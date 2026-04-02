import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel } from "@google/genai";

export type VoiceMode = 'live' | 'standard';
export type VoiceProvider = 'gemini' | 'groq' | 'openai' | 'mistral';

export interface VoiceConfig {
  mode: VoiceMode;
  provider: VoiceProvider;
  model?: string;
  systemInstruction?: string;
}

export interface VoiceCallbacks {
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onTextUpdate?: (text: string, isUser: boolean) => void;
  onError?: (error: any) => void;
  onInterrupted?: () => void;
}

class VoiceService {
  private liveSession: any = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  private async initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async startLive(config: VoiceConfig, callbacks: VoiceCallbacks, pdfContent?: string) {
    await this.initAudio();
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key is required for Live Mode.");

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = (config.systemInstruction || "You are a helpful university tutor.") + 
      (pdfContent ? `\n\n[CONTEXT FROM UPLOADED DOCUMENT]:\n${pdfContent}` : "");

    this.liveSession = await ai.live.connect({
      model: config.model || "gemini-3.1-flash-live-preview",
      callbacks: {
        onopen: () => {
          this.startMicStreaming();
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts) {
            const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData?.data);
            const textPart = message.serverContent.modelTurn.parts.find(p => p.text);
            
            if (textPart?.text) {
              callbacks.onTextUpdate?.(textPart.text, false);
            }
            
            if (audioPart?.inlineData?.data) {
              const base64 = audioPart.inlineData.data;
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;
              
              this.audioQueue.push(float32);
              if (!this.isPlaying) this.playNextInQueue(callbacks);
            }
          }
          
          if (message.serverContent?.interrupted) {
            this.stopPlayback();
            callbacks.onInterrupted?.();
          }
        },
        onerror: (e) => callbacks.onError?.(e),
        onclose: () => this.stopMicStreaming()
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction,
      },
    });
  }

  private async startMicStreaming() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext!.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext!.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (this.liveSession) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        this.liveSession.sendRealtimeInput({
          audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
        });
      }
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext!.destination);
  }

  private stopMicStreaming() {
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.processor?.disconnect();
    this.processor = null;
  }

  private playNextInQueue(callbacks: VoiceCallbacks) {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      callbacks.onAudioEnd?.();
      return;
    }

    this.isPlaying = true;
    callbacks.onAudioStart?.();
    const data = this.audioQueue.shift()!;
    const buffer = this.audioContext!.createBuffer(1, data.length, 16000);
    buffer.getChannelData(0).set(data);
    
    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);
    source.onended = () => this.playNextInQueue(callbacks);
    source.start();
  }

  private stopPlayback() {
    this.audioQueue = [];
    this.isPlaying = false;
  }

  async startStandard(config: VoiceConfig, callbacks: VoiceCallbacks, pdfContent?: string) {
    if (!this.recognition) throw new Error("Speech Recognition not supported in this browser.");
    
    this.recognition.onresult = async (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      
      if (event.results[0].isFinal) {
        callbacks.onTextUpdate?.(transcript, true);
        this.processStandardResponse(transcript, config, callbacks, pdfContent);
      }
    };

    this.recognition.onerror = (e: any) => callbacks.onError?.(e);
    this.recognition.start();
  }

  private async processStandardResponse(text: string, config: VoiceConfig, callbacks: VoiceCallbacks, pdfContent?: string) {
    try {
      // Import callAI dynamically to avoid circular deps
      const { callAI } = await import('./ai');
      const prompt = text + (pdfContent ? `\n\n[CONTEXT FROM UPLOADED DOCUMENT]:\n${pdfContent}` : "");
      const response = await callAI(prompt, config.systemInstruction, undefined, undefined, 'standard', 'chat', config.provider);
      
      callbacks.onTextUpdate?.(response.text, false);
      this.speak(response.text, callbacks);
    } catch (e) {
      callbacks.onError?.(e);
    }
  }

  private speak(text: string, callbacks: VoiceCallbacks) {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => callbacks.onAudioStart?.();
    utterance.onend = () => callbacks.onAudioEnd?.();
    this.synthesis.speak(utterance);
  }

  stop() {
    this.liveSession?.close();
    this.liveSession = null;
    this.stopMicStreaming();
    this.stopPlayback();
    this.recognition?.stop();
    this.synthesis?.cancel();
  }
}

export const voiceService = new VoiceService();
