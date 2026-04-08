import { z } from 'zod';
import admin from 'firebase-admin';
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { Mistral } from '@mistralai/mistralai';
import { CohereClient } from "cohere-ai";
import { HfInference } from "@huggingface/inference";
import OpenAI from "openai";

export interface ModelResponse {
  text: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
}

export interface ModelProvider {
  readonly name: string;
  generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse>;
  stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse>;
}

const ProviderResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string()
    }),
    finish_reason: z.string().nullable().optional()
  })).min(1),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional()
  }).optional().nullable()
});

async function fetchWithTimeout(url: string, options: any, timeout = 600000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

class ModelProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'ModelProviderError';
  }
}

async function retry<T>(fn: () => Promise<T>, providerName: string, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || (error.message?.match(/\b(\d{3})\b/)?.[1] ? parseInt(error.message.match(/\b(\d{3})\b/)[1]) : undefined);
    
    // Non-retryable errors
    const isUnauthorized = statusCode === 401 || 
                           error.message?.includes('invalid_api_key') || 
                           error.message?.includes('Unauthorized') ||
                           error.message?.includes('API key not valid') ||
                           error.message?.includes('INVALID_ARGUMENT');
    const isKeyLimit = statusCode === 403 && error.message?.includes('Key limit exceeded');
    const isBadRequest = statusCode === 400 && !error.message?.includes('rate_limit') && !isUnauthorized;
    const isNotFound = statusCode === 404;
    
    const isRetryable = (!isBadRequest && !isNotFound && retries > 0) || isUnauthorized || isKeyLimit;

    if (!isRetryable || retries <= 0) {
      throw new ModelProviderError(error.message, providerName, statusCode, false);
    }

    // Check for rate limit errors or timeouts
    const isRateLimit = statusCode === 429 || 
                        error.message?.toLowerCase().includes('rate_limit') || 
                        error.message?.toLowerCase().includes('too many requests');
    
    const isTimeout = error.name === 'AbortError' || error.message?.toLowerCase().includes('timeout');
    
    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    const waitTime = (isRateLimit ? delay * 3 : (isTimeout ? 1000 : delay)) + jitter;
    
    console.warn(`[${providerName}] Retrying AI request... (${retries} left) after ${Math.round(waitTime)}ms. Error: ${error.message}${isUnauthorized ? ' (Check if your API key is valid)' : ''}`);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return retry(fn, providerName, retries - 1, waitTime * 1.5);
  }
}

export class DynamicKeyRotator {
  private providerName: string;
  private fallbackKeys: string[];
  private dbKeys: string[] = [];
  private currentIndex: number = 0;
  private lastFetchTime: number = 0;
  private exhaustedKeys: Set<string> = new Set();
  private configuredModel: string = '';
  private configuredFallbackModel: string = '';

  constructor(providerName: string, fallbackKeyString: string = '') {
    this.providerName = providerName;
    this.fallbackKeys = fallbackKeyString.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  async fetchKeys() {
    // Fetch every 1 minute to stay updated
    if (Date.now() - this.lastFetchTime < 60000 && this.dbKeys.length > 0) {
      return;
    }
    try {
      const docRef = admin.firestore().collection('system_settings').doc('api_keys');
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data[this.providerName]) {
          this.configuredModel = data[this.providerName].model || '';
          this.configuredFallbackModel = data[this.providerName].fallbackModel || '';
          
          if (Array.isArray(data[this.providerName].keys)) {
           let needsUpdate = false;
           const now = Date.now();
           const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

           const updatedKeys = data[this.providerName].keys.map((k: any) => {
             if (k.isExhausted && k.exhaustedAt) {
               const exhaustedDate = new Date(k.exhaustedAt);
               const currentDate = new Date(now);
               
               // Reset if:
               // 1. It's a different calendar day (UTC)
               // 2. OR 24 hours have passed (Safety fallback)
               const isNewDay = exhaustedDate.getUTCDate() !== currentDate.getUTCDate() || 
                                exhaustedDate.getUTCMonth() !== currentDate.getUTCMonth() ||
                                exhaustedDate.getUTCFullYear() !== currentDate.getUTCFullYear();
               
               const isPast24h = now - k.exhaustedAt > TWENTY_FOUR_HOURS;

               if (isNewDay || isPast24h) {
                 needsUpdate = true;
                 return { ...k, isExhausted: false, exhaustedAt: undefined };
               }
             }
             return k;
           });

           if (needsUpdate) {
             await docRef.update({
               [`${this.providerName}.keys`]: updatedKeys
             });
             data[this.providerName].keys = updatedKeys;
           }

           this.dbKeys = data[this.providerName].keys
             .filter((k: any) => k.key && k.key.trim().length > 0)
             .map((k: any) => k.key.trim());

           // Sync local exhausted state with DB so we don't try exhausted keys until they reset
           for (const k of data[this.providerName].keys) {
             if (k.isExhausted) {
               this.exhaustedKeys.add(k.key.trim());
             } else {
               this.exhaustedKeys.delete(k.key.trim());
             }
           }
        }
      }
      this.lastFetchTime = Date.now();
    } catch (e) {
      console.error(`Failed to fetch keys for ${this.providerName}`, e);
    }
  }

  async getModel(): Promise<string> {
    await this.fetchKeys();
    return this.configuredModel;
  }

  async getFallbackModel(): Promise<string> {
    await this.fetchKeys();
    return this.configuredFallbackModel;
  }

  async getNextKey(): Promise<string> {
    await this.fetchKeys();
    const allKeys = [...this.fallbackKeys, ...this.dbKeys];
    
    // Filter out obvious placeholders
    const activeKeys = allKeys.filter(k => 
      k && 
      k.length > 5 && 
      !k.includes('TODO') && 
      !k.includes('YOUR_') && 
      !k.includes('PLACEHOLDER') &&
      !k.includes('<') &&
      !k.includes('>')
    );
    
    if (activeKeys.length === 0) {
      const msg = `No valid API keys available for provider: ${this.providerName}. ${allKeys.length > 0 ? 'The provided keys appear to be placeholders.' : 'Please configure them in the Admin Dashboard or environment variables.'}`;
      console.error(msg);
      throw new Error(msg);
    }
    
    // Try to find a non-exhausted key
    let key = activeKeys[this.currentIndex % activeKeys.length];
    let attempts = 0;
    while (this.exhaustedKeys.has(key) && attempts < activeKeys.length) {
      this.currentIndex = (this.currentIndex + 1) % activeKeys.length;
      key = activeKeys[this.currentIndex % activeKeys.length];
      attempts++;
    }

    // If all keys are exhausted, clear the set and try again (maybe limits reset)
    if (attempts >= activeKeys.length) {
      this.exhaustedKeys.clear();
      key = activeKeys[this.currentIndex % activeKeys.length];
    }

    this.currentIndex = (this.currentIndex + 1) % activeKeys.length;
    return key;
  }

  async markKeyExhausted(key: string) {
    this.exhaustedKeys.add(key);
    
    // Update Firestore to mark key as exhausted
    try {
      const docRef = admin.firestore().collection('system_settings').doc('api_keys');
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data && data[this.providerName] && Array.isArray(data[this.providerName].keys)) {
          const updatedKeys = data[this.providerName].keys.map((k: any) => {
            if (k.key === key) {
              return { ...k, isExhausted: true, exhaustedAt: Date.now() };
            }
            return k;
          });
          await docRef.update({
            [`${this.providerName}.keys`]: updatedKeys
          });
        }
      }
    } catch (e) {
      console.error(`Failed to update exhausted state for ${this.providerName}`, e);
    }
  }
}

export class GeminiDirectProvider implements ModelProvider {
  private rotator: DynamicKeyRotator;
  public readonly name = 'gemini_direct';

  constructor(apiKey: string = '') {
    this.rotator = new DynamicKeyRotator('gemini_direct', apiKey);
  }

  private transformMessagesToGemini(messages: any[]) {
    const systemMessage = messages.find(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    const transformContent = (content: any) => {
      if (typeof content === 'string') {
        return [{ text: content }];
      }
      if (Array.isArray(content)) {
        return content.map(part => {
          if (part.type === 'text') {
            return { text: part.text };
          }
          if (part.type === 'image_url' || part.type === 'file') {
            const url = part.image_url?.url || part.file_url?.url;
            if (!url) return { text: '' };
            const matches = url.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              return {
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
                }
              };
            }
          }
          return { text: JSON.stringify(part) };
        });
      }
      return [{ text: String(content) }];
    };

    const contents = otherMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: transformContent(m.content)
    }));

    const systemInstruction = systemMessage ? 
      (typeof systemMessage.content === 'string' ? systemMessage.content : JSON.stringify(systemMessage.content)) : 
      undefined;

    return { contents, systemInstruction };
  }

  private ensureJsonInMessages(messages: any[]) {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const jsonRequirement = " (Your response MUST be a valid JSON object. Ensure the word 'json' is present in your internal reasoning if applicable, and the output is strictly JSON.)";
    
    if (typeof lastMessage.content === 'string') {
      if (!lastMessage.content.toLowerCase().includes('json')) {
        lastMessage.content += jsonRequirement;
      }
    } else if (Array.isArray(lastMessage.content)) {
      const hasJson = lastMessage.content.some((part: any) => 
        part.type === 'text' && part.text.toLowerCase().includes('json')
      );
      if (!hasJson) {
        lastMessage.content.push({ type: 'text', text: jsonRequirement });
      }
    }
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const ai = new GoogleGenAI({ apiKey });
      const { contents, systemInstruction } = this.transformMessagesToGemini(messages);
      
      if (options.jsonMode) {
        this.ensureJsonInMessages(messages);
      }

      try {
        const model = ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents,
          config: {
            systemInstruction,
            responseMimeType: options.jsonMode ? "application/json" : "text/plain",
            temperature: 0.5,
            maxOutputTokens: 8192,
          }
        });

        const response = await model;
        if (!response.text) throw new Error('Empty response from Gemini');

        return {
          text: response.text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0
          },
          finishReason: 'stop'
        };
      } catch (error: any) {
        const status = error.status || error.statusCode;
        if (status === 401 || status === 403 || status === 429) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'GeminiDirect');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const ai = new GoogleGenAI({ apiKey });
      const { contents, systemInstruction } = this.transformMessagesToGemini(messages);

      try {
        const result = await ai.models.generateContentStream({
          model: "gemini-3-flash-preview",
          contents,
          config: {
            systemInstruction,
            temperature: 0.5,
            maxOutputTokens: 8192,
          }
        });

        let fullText = '';
        for await (const chunk of result) {
          const text = chunk.text;
          if (text) {
            fullText += text;
            onChunk(text);
          }
        }

        return {
          text: fullText,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop'
        };
      } catch (error: any) {
        const status = error.status || error.statusCode;
        if (status === 401 || status === 403 || status === 429) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'GeminiDirect');
  }
}



export class OpenRouterFreeProvider implements ModelProvider {
  private rotator: DynamicKeyRotator;
  public readonly name = 'openrouter_free';

  constructor(apiKey: string = '') {
    this.rotator = new DynamicKeyRotator('openrouter', apiKey);
  }

  private ensureJsonInMessages(messages: any[]) {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const jsonRequirement = " (Your response MUST be a valid JSON object. Ensure the word 'json' is present in your internal reasoning if applicable, and the output is strictly JSON.)";
    
    if (typeof lastMessage.content === 'string') {
      if (!lastMessage.content.toLowerCase().includes('json')) {
        lastMessage.content += jsonRequirement;
      }
    } else if (Array.isArray(lastMessage.content)) {
      const hasJson = lastMessage.content.some((part: any) => 
        part.type === 'text' && part.text.toLowerCase().includes('json')
      );
      if (!hasJson) {
        lastMessage.content.push({ type: 'text', text: jsonRequirement });
      }
    }
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const model = await this.rotator.getModel() || 'google/gemini-2.0-flash-exp:free';
      const fallbackModel = await this.rotator.getFallbackModel() || 'google/gemini-flash-1.5';
      
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
          "HTTP-Referer": "https://uniace.app",
          "X-Title": "UniAce Learning App",
        }
      });

      if (options.jsonMode) {
        this.ensureJsonInMessages(messages);
      }

      try {
        // Try free model first
        const response = await openai.chat.completions.create({
          model: model,
          messages: messages,
          max_tokens: 8192,
          temperature: 0.5,
          response_format: options.jsonMode ? { type: "json_object" } : undefined
        });

        return {
          text: response.choices[0]?.message?.content || '',
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          },
          finishReason: response.choices[0]?.finish_reason || 'stop'
        };
      } catch (error: any) {
        // If rate limited (429), fallback to paid model
        if (error.status === 429) {
          console.log(`[OpenRouterFree] Rate limit hit on ${model}, falling back to ${fallbackModel}`);
          try {
            const paidResponse = await openai.chat.completions.create({
              model: fallbackModel,
              messages: messages,
              max_tokens: 8192,
              temperature: 0.5,
              response_format: options.jsonMode ? { type: "json_object" } : undefined
            });

            return {
              text: paidResponse.choices[0]?.message?.content || '',
              usage: {
                promptTokens: paidResponse.usage?.prompt_tokens || 0,
                completionTokens: paidResponse.usage?.completion_tokens || 0,
                totalTokens: paidResponse.usage?.total_tokens || 0
              },
              finishReason: paidResponse.choices[0]?.finish_reason || 'stop'
            };
          } catch (paidError: any) {
             if (paidError.status === 401 || paidError.status === 403 || paidError.status === 429) {
               this.rotator.markKeyExhausted(apiKey);
             }
             throw paidError;
          }
        }
        
        if (error.status === 401 || error.status === 403) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'OpenRouterFree');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const model = await this.rotator.getModel() || 'google/gemini-2.0-flash-exp:free';
      const fallbackModel = await this.rotator.getFallbackModel() || 'google/gemini-flash-1.5';

      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
          "HTTP-Referer": "https://uniace.app",
          "X-Title": "UniAce Learning App",
        }
      });

      try {
        // Try free model first
        const stream = await openai.chat.completions.create({
          model: model,
          messages: messages,
          max_tokens: 8192,
          temperature: 0.5,
          stream: true
        });

        let fullText = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        }

        return {
          text: fullText,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop'
        };
      } catch (error: any) {
        // If rate limited (429), fallback to paid model
        if (error.status === 429) {
          console.log(`[OpenRouterFree Stream] Rate limit hit on ${model}, falling back to ${fallbackModel}`);
          try {
            const paidStream = await openai.chat.completions.create({
              model: fallbackModel,
              messages: messages,
              max_tokens: 8192,
              temperature: 0.5,
              stream: true
            });

            let fullText = '';
            for await (const chunk of paidStream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onChunk(content);
              }
            }

            return {
              text: fullText,
              usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              finishReason: 'stop'
            };
          } catch (paidError: any) {
            if (paidError.status === 401 || paidError.status === 403 || paidError.status === 429) {
              this.rotator.markKeyExhausted(apiKey);
            }
            throw paidError;
          }
        }

        if (error.status === 401 || error.status === 403) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'OpenRouterFree');
  }
}

export class MistralProvider implements ModelProvider {
  private rotator: DynamicKeyRotator;
  public readonly name = 'mistral_direct';

  constructor(apiKey: string = '') {
    this.rotator = new DynamicKeyRotator('mistral_direct', apiKey);
  }

  private ensureJsonInMessages(messages: any[]) {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const jsonRequirement = " (Your response MUST be a valid JSON object. Ensure the word 'json' is present in your internal reasoning if applicable, and the output is strictly JSON.)";
    
    if (typeof lastMessage.content === 'string') {
      if (!lastMessage.content.toLowerCase().includes('json')) {
        lastMessage.content += jsonRequirement;
      }
    } else if (Array.isArray(lastMessage.content)) {
      const hasJson = lastMessage.content.some((part: any) => 
        part.type === 'text' && part.text.toLowerCase().includes('json')
      );
      if (!hasJson) {
        lastMessage.content.push({ type: 'text', text: jsonRequirement });
      }
    }
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const mistral = new Mistral({ apiKey: apiKey });

      if (options.jsonMode) {
        this.ensureJsonInMessages(messages);
      }

      try {
        const response = await mistral.chat.complete({
          model: options.complexity === 'high' ? 'mistral-large-latest' : 'mistral-small-latest',
          temperature: 0.5,
          maxTokens: 8192,
          messages: messages,
          responseFormat: options.jsonMode ? { type: "json_object" } : undefined
        });

        return {
          text: response.choices?.[0]?.message?.content as string || '',
          usage: {
            promptTokens: response.usage?.promptTokens || 0,
            completionTokens: response.usage?.completionTokens || 0,
            totalTokens: response.usage?.totalTokens || 0
          },
          finishReason: response.choices?.[0]?.finishReason || 'stop'
        };
      } catch (error: any) {
        if (error.status === 401 || error.status === 403 || error.status === 429) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'Mistral');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const mistral = new Mistral({ apiKey: apiKey });

      try {
        const stream = await mistral.chat.stream({
          model: options.complexity === 'high' ? 'mistral-large-latest' : 'mistral-small-latest',
          temperature: 0.5,
          maxTokens: 8192,
          messages: messages
        });

        let fullText = '';
        for await (const chunk of stream) {
          const content = chunk.data.choices[0]?.delta?.content as string || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        }

        return {
          text: fullText,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop'
        };
      } catch (error: any) {
        if (error.status === 401 || error.status === 403 || error.status === 429) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'Mistral');
  }
}

export class GroqProvider implements ModelProvider {
  private rotator: DynamicKeyRotator;
  public readonly name = 'groq';

  constructor(apiKey: string = '') {
    this.rotator = new DynamicKeyRotator('groq', apiKey);
  }

  private ensureJsonInMessages(messages: any[]) {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const jsonRequirement = " (Your response MUST be a valid JSON object. Ensure the word 'json' is present in your internal reasoning if applicable, and the output is strictly JSON.)";
    
    if (typeof lastMessage.content === 'string') {
      if (!lastMessage.content.toLowerCase().includes('json')) {
        lastMessage.content += jsonRequirement;
      }
    } else if (Array.isArray(lastMessage.content)) {
      const hasJson = lastMessage.content.some((part: any) => 
        part.type === 'text' && part.text.toLowerCase().includes('json')
      );
      if (!hasJson) {
        lastMessage.content.push({ type: 'text', text: jsonRequirement });
      }
    }
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const groq = new Groq({ apiKey: apiKey });

      // Truncate messages for Groq to avoid TPM limits (especially for 8b model)
      // Free tier TPM is often 6000. We target 4000 to be safe and leave room for response.
      const maxTokens = options.complexity === 'high' ? 4000 : 2500;
      const truncatedMessages = this.truncateMessages(messages, maxTokens);

      if (options.jsonMode) {
        this.ensureJsonInMessages(truncatedMessages);
      }

      try {
        const response = await groq.chat.completions.create({
          model: options.complexity === 'high' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant',
          temperature: 0.5,
          max_tokens: options.complexity === 'high' ? 4096 : 2048,
          messages: truncatedMessages,
          response_format: options.jsonMode ? { type: "json_object" } : undefined
        });

        return {
          text: response.choices[0]?.message?.content || '',
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          },
          finishReason: response.choices[0]?.finish_reason || 'stop'
        };
      } catch (error: any) {
        if (error.status === 401 || error.status === 403 || error.status === 429) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'Groq');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const groq = new Groq({ apiKey: apiKey });

      // Truncate messages for Groq to avoid TPM limits
      const maxTokens = options.complexity === 'high' ? 4000 : 2500;
      const truncatedMessages = this.truncateMessages(messages, maxTokens);

      try {
        const stream = await groq.chat.completions.create({
          model: options.complexity === 'high' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant',
          temperature: 0.5,
          max_tokens: options.complexity === 'high' ? 4096 : 2048,
          messages: truncatedMessages,
          stream: true
        });

        let fullText = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        }

        return {
          text: fullText,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop'
        };
      } catch (error: any) {
        if (error.status === 401 || error.status === 403 || error.status === 429) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'Groq');
  }

  private truncateMessages(messages: any[], maxTokens: number): any[] {
    if (!messages || messages.length === 0) return [];
    
    // Conservative estimate: 1 token ≈ 2.5 characters
    let currentTokens = 0;
    const truncated = [];
    
    // Always keep the system message if it exists
    const systemMessage = messages.find(m => m.role === 'system');
    let systemTokens = 0;
    if (systemMessage) {
      systemTokens = Math.ceil((systemMessage.content?.length || 0) / 2.5);
      // If system message alone is too big, truncate it (rare but possible)
      if (systemTokens > maxTokens * 0.4) {
        const allowedChars = Math.floor(maxTokens * 0.4 * 2.5);
        systemMessage.content = systemMessage.content.substring(0, allowedChars) + "... [truncated]";
        systemTokens = Math.ceil(systemMessage.content.length / 2.5);
      }
      currentTokens += systemTokens;
    }

    // Process other messages from newest to oldest
    const otherMessages = messages.filter(m => m.role !== 'system');
    for (let i = otherMessages.length - 1; i >= 0; i--) {
      const msg = otherMessages[i];
      let content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      let estimatedTokens = Math.ceil(content.length / 2.5);
      
      // If the very first (newest) message is too large, truncate it
      if (i === otherMessages.length - 1 && currentTokens + estimatedTokens > maxTokens) {
        const allowedTokens = maxTokens - currentTokens;
        if (allowedTokens > 100) {
          const allowedChars = Math.floor(allowedTokens * 2.5);
          content = content.substring(0, allowedChars) + "... [truncated]";
          estimatedTokens = Math.ceil(content.length / 2.5);
          msg.content = content;
        } else {
          // Too little space left, skip this message
          continue;
        }
      }

      if (currentTokens + estimatedTokens > maxTokens) {
        break;
      }
      
      currentTokens += estimatedTokens;
      truncated.unshift(msg);
    }
    
    if (systemMessage) {
      truncated.unshift(systemMessage);
    }
    
    return truncated;
  }
}

export class CohereProvider implements ModelProvider {
  private rotator: DynamicKeyRotator;
  public readonly name = 'cohere';

  constructor(apiKey: string = '') {
    this.rotator = new DynamicKeyRotator('cohere', apiKey);
  }

  private ensureJsonInMessages(messages: any[]) {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const jsonRequirement = " (Your response MUST be a valid JSON object. Ensure the word 'json' is present in your internal reasoning if applicable, and the output is strictly JSON.)";
    
    if (typeof lastMessage.content === 'string') {
      if (!lastMessage.content.toLowerCase().includes('json')) {
        lastMessage.content += jsonRequirement;
      }
    } else if (Array.isArray(lastMessage.content)) {
      const hasJson = lastMessage.content.some((part: any) => 
        part.type === 'text' && part.text.toLowerCase().includes('json')
      );
      if (!hasJson) {
        lastMessage.content.push({ type: 'text', text: jsonRequirement });
      }
    }
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const cohere = new CohereClient({ token: apiKey });
      
      if (options.jsonMode) {
        this.ensureJsonInMessages(messages);
      }

      const chatHistory = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'CHATBOT' : (m.role === 'system' ? 'SYSTEM' : 'USER'),
        message: m.content
      }));
      const lastMessage = messages[messages.length - 1].content;

      try {
        const response = await cohere.chat({
          model: options.complexity === 'high' ? 'command-r-plus-08-2024' : 'command-r',
          message: lastMessage,
          chatHistory: chatHistory as any,
          temperature: 0.5,
        });

        return {
          text: response.text,
          usage: {
            promptTokens: response.meta?.billedUnits?.inputTokens || 0,
            completionTokens: response.meta?.billedUnits?.outputTokens || 0,
            totalTokens: (response.meta?.billedUnits?.inputTokens || 0) + (response.meta?.billedUnits?.outputTokens || 0)
          },
          finishReason: response.finishReason || 'COMPLETE'
        };
      } catch (error: any) {
        if (error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 429) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'Cohere');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const cohere = new CohereClient({ token: apiKey });
      
      const chatHistory = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'CHATBOT' : (m.role === 'system' ? 'SYSTEM' : 'USER'),
        message: m.content
      }));
      const lastMessage = messages[messages.length - 1].content;

      try {
        const stream = await cohere.chatStream({
          model: options.complexity === 'high' ? 'command-r-plus-08-2024' : 'command-r',
          message: lastMessage,
          chatHistory: chatHistory as any,
          temperature: 0.5,
        });

        let fullText = '';
        for await (const chunk of stream) {
          if (chunk.eventType === 'text-generation') {
            fullText += chunk.text;
            onChunk(chunk.text);
          }
        }

        return {
          text: fullText,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'COMPLETE'
        };
      } catch (error: any) {
        if (error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 429) {
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'Cohere');
  }
}

export class HuggingFaceProvider implements ModelProvider {
  private rotator: DynamicKeyRotator;
  public readonly name = 'huggingface';

  constructor(apiKey: string = '') {
    this.rotator = new DynamicKeyRotator('huggingface', apiKey);
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const hf = new HfInference(apiKey);

      try {
        const response = await hf.chatCompletion({
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          messages: messages,
          max_tokens: 4096,
          temperature: 0.5,
          // @ts-ignore - wait_for_model is supported by the API to handle model loading
          wait_for_model: true
        });

        return {
          text: response.choices[0]?.message?.content || '',
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          },
          finishReason: response.choices[0]?.finish_reason || 'stop'
        };
      } catch (error: any) {
        const status = error.status || error.statusCode;
        const isQuotaError = status === 401 || status === 403 || status === 429 || 
                           error.message?.toLowerCase().includes('limit') ||
                           error.message?.toLowerCase().includes('quota') ||
                           error.message?.toLowerCase().includes('http error');
        
        if (isQuotaError) {
          console.warn(`[HuggingFace] Marking key as exhausted due to error: ${error.message}`);
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'HuggingFace');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = await this.rotator.getNextKey();
      const hf = new HfInference(apiKey);

      try {
        const stream = hf.chatCompletionStream({
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          messages: messages,
          max_tokens: 4096,
          temperature: 0.5,
          // @ts-ignore
          wait_for_model: true
        });

        let fullText = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        }

        return {
          text: fullText,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop'
        };
      } catch (error: any) {
        const status = error.status || error.statusCode;
        const isQuotaError = status === 401 || status === 403 || status === 429 || 
                           error.message?.toLowerCase().includes('limit') ||
                           error.message?.toLowerCase().includes('quota') ||
                           error.message?.toLowerCase().includes('http error');
        
        if (isQuotaError) {
          console.warn(`[HuggingFace] Marking key as exhausted due to error: ${error.message}`);
          this.rotator.markKeyExhausted(apiKey);
        }
        throw error;
      }
    }, 'HuggingFace');
  }
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  constructor(private provider: ModelProvider) {}

  get name() {
    return this.provider.name;
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    if (this.isOpen()) {
      throw new Error(`Circuit breaker open for provider`);
    }

    try {
      const response = await this.provider.generate(messages, options);
      this.onSuccess();
      return response;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    if (this.isOpen()) {
      throw new Error(`Circuit breaker open for provider`);
    }

    try {
      const response = await this.provider.stream(messages, options, onChunk);
      this.onSuccess();
      return response;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    if (this.failures >= this.threshold) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        // Half-open state
        this.failures = this.threshold - 1;
        return false;
      }
      return true;
    }
    return false;
  }

  private onSuccess() {
    this.failures = 0;
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
