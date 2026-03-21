import { z } from 'zod';

export interface ModelResponse {
  text: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
}

export interface ModelProvider {
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
    const statusCode = error.statusCode || (error.message?.match(/\b(\d{3})\b/)?.[1] ? parseInt(error.message.match(/\b(\d{3})\b/)[1]) : undefined);
    
    // Non-retryable errors
    const isUnauthorized = statusCode === 401 || error.message?.includes('invalid_api_key') || error.message?.includes('Unauthorized');
    const isKeyLimit = statusCode === 403 && error.message?.includes('Key limit exceeded');
    const isBadRequest = statusCode === 400 && !error.message?.includes('rate_limit');
    const isNotFound = statusCode === 404;
    
    const isRetryable = !isUnauthorized && !isKeyLimit && !isBadRequest && !isNotFound && retries > 0;

    if (!isRetryable) {
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
    
    console.warn(`[${providerName}] Retrying AI request... (${retries} left) after ${Math.round(waitTime)}ms. Error: ${error.message}`);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return retry(fn, providerName, retries - 1, waitTime * 1.5);
  }
}

class KeyRotator {
  private keys: string[];
  private currentIndex: number = 0;

  constructor(keyString: string) {
    this.keys = keyString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (this.keys.length === 0) {
      this.keys = ['']; // Fallback to empty string if no keys provided
    }
  }

  getNextKey(): string {
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  get currentKey(): string {
    return this.keys[this.currentIndex];
  }

  get hasKeys(): boolean {
    return this.keys.length > 0 && this.keys[0] !== '';
  }
}

export class GeminiOpenRouterProvider implements ModelProvider {
  private rotator: KeyRotator;

  constructor(apiKey: string) {
    this.rotator = new KeyRotator(apiKey);
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = this.rotator.getNextKey();
      const body: any = {
        model: 'google/gemini-2.5-flash', // Forced Flash as per user request
        max_tokens: 8192,
        temperature: 0.5,
        messages: messages
      };

      if (options.jsonMode) {
        body.response_format = { type: "json_object" };
      }

      const orRes = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://uniace.app',
          'X-Title': 'UniAce Learning App',
        },
        body: JSON.stringify(body)
      });

      if (!orRes.ok) {
        const errorBody = await orRes.text();
        throw new Error(`OpenRouter API Error: ${orRes.statusText} - ${errorBody}`);
      }

      const rawData = await orRes.json();
      const data = ProviderResponseSchema.parse(rawData);
      
      return {
        text: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 500
        },
        finishReason: data.choices[0].finish_reason || 'stop'
      };
    }, 'GeminiOpenRouter');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = this.rotator.getNextKey();
      const body: any = {
        model: 'google/gemini-2.5-flash', // Forced Flash as per user request
        max_tokens: 8192,
        temperature: 0.5,
        messages: messages,
        stream: true
      };

      const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://uniace.app',
          'X-Title': 'UniAce Learning App',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API Error: ${response.statusText} - ${errorBody}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              console.warn('Error parsing stream chunk:', e);
            }
          }
        }
      }

      return {
        text: fullText,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop'
      };
    }, 'GeminiOpenRouter');
  }
}

export class MistralProvider implements ModelProvider {
  private rotator: KeyRotator;

  constructor(apiKey: string) {
    this.rotator = new KeyRotator(apiKey);
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = this.rotator.getNextKey();
      const body: any = {
        model: options.complexity === 'high' ? 'mistral-large-latest' : 'mistral-small-latest',
        temperature: 0.5,
        max_tokens: 8192,
        messages: messages
      };

      if (options.jsonMode) {
        body.response_format = { type: "json_object" };
      }

      const response = await fetchWithTimeout('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Mistral API Error: ${response.statusText} - ${errorBody}`);
      }

      const rawData = await response.json();
      const data = ProviderResponseSchema.parse(rawData);
      
      return {
        text: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 500
        },
        finishReason: data.choices[0].finish_reason || 'stop'
      };
    }, 'Mistral');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = this.rotator.getNextKey();
      const body: any = {
        model: options.complexity === 'high' ? 'mistral-large-latest' : 'mistral-small-latest',
        temperature: 0.5,
        max_tokens: 8192,
        messages: messages,
        stream: true
      };

      const response = await fetchWithTimeout('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Mistral API Error: ${response.statusText} - ${errorBody}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              console.warn('Error parsing stream chunk:', e);
            }
          }
        }
      }

      return {
        text: fullText,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop'
      };
    }, 'Mistral');
  }
}

export class GroqProvider implements ModelProvider {
  private rotator: KeyRotator;

  constructor(apiKey: string) {
    this.rotator = new KeyRotator(apiKey);
  }

  async generate(messages: any[], options: { complexity: 'high' | 'standard', jsonMode?: boolean }): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = this.rotator.getNextKey();
      const body: any = {
        model: options.complexity === 'high' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 8192,
        temperature: 0.5
      };

      if (options.jsonMode) {
        body.response_format = { type: "json_object" };
      }

      const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Groq API Error: ${response.statusText} - ${errorBody}`);
      }

      const rawData = await response.json();
      const data = ProviderResponseSchema.parse(rawData);
      
      return {
        text: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 500
        },
        finishReason: data.choices[0].finish_reason || 'stop'
      };
    }, 'Groq');
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    return retry(async () => {
      const apiKey = this.rotator.getNextKey();
      const body: any = {
        model: options.complexity === 'high' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 8192,
        temperature: 0.5,
        stream: true
      };

      const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Groq API Error: ${response.statusText} - ${errorBody}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              console.warn('Error parsing stream chunk:', e);
            }
          }
        }
      }

      return {
        text: fullText,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop'
      };
    }, 'Groq');
  }
}

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 3;
  private readonly resetTimeout = 300000; // 5 minutes

  constructor(private provider: ModelProvider) {}

  async generate(messages: any[], options: { complexity: 'high' | 'standard' }): Promise<ModelResponse> {
    if (this.failureCount >= this.threshold) {
      if (Date.now() - this.lastFailureTime < this.resetTimeout) {
        throw new Error('Circuit breaker open');
      }
      this.failureCount = 0;
    }

    try {
      const response = await this.provider.generate(messages, options);
      this.failureCount = 0;
      return response;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      throw error;
    }
  }

  async stream(messages: any[], options: { complexity: 'high' | 'standard' }, onChunk: (chunk: string) => void): Promise<ModelResponse> {
    if (this.failureCount >= this.threshold) {
      if (Date.now() - this.lastFailureTime < this.resetTimeout) {
        throw new Error('Circuit breaker open');
      }
      this.failureCount = 0;
    }

    try {
      const response = await this.provider.stream(messages, options, onChunk);
      this.failureCount = 0;
      return response;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      throw error;
    }
  }
}
