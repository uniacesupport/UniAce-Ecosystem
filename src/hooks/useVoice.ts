import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceService, VoiceConfig, VoiceCallbacks, VoiceMode, VoiceProvider } from '../services/voiceService';
import { toast } from 'react-hot-toast';

export const useVoice = (initialConfig?: Partial<VoiceConfig> & { pdfContent?: string }) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; isUser: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<VoiceConfig>({
    mode: initialConfig?.mode || 'live',
    provider: initialConfig?.provider || 'gemini',
    model: initialConfig?.model,
    systemInstruction: initialConfig?.systemInstruction
  });

  const stop = useCallback(() => {
    voiceService.stop();
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      setIsActive(true);
      
      const callbacks: VoiceCallbacks = {
        onAudioStart: () => setIsSpeaking(true),
        onAudioEnd: () => setIsSpeaking(false),
        onTextUpdate: (text, isUser) => {
          setTranscript(prev => [...prev, { text, isUser }]);
          if (isUser) setIsListening(false);
        },
        onError: (err) => {
          console.error('Voice Error:', err);
          setError(err.message || 'An error occurred during voice interaction.');
          toast.error('Voice interaction failed.');
          stop();
        },
        onInterrupted: () => {
          setIsSpeaking(false);
          toast('Interrupted', { icon: '🛑' });
        }
      };

      if (config.mode === 'live') {
        await voiceService.startLive(config, callbacks, initialConfig?.pdfContent);
      } else {
        await voiceService.startStandard(config, callbacks, initialConfig?.pdfContent);
      }
      
      setIsListening(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start voice mode.');
      setIsActive(false);
      toast.error('Failed to start voice mode.');
    }
  }, [config, stop, initialConfig?.pdfContent]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    isActive,
    isListening,
    isSpeaking,
    transcript,
    error,
    config,
    setConfig,
    start,
    stop,
    clearTranscript: () => setTranscript([])
  };
};
