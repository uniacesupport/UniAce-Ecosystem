import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, MicOff, Loader2, Volume2, Wifi, WifiOff } from 'lucide-react';

interface VoiceTutorProps {
  isOpen: boolean;
  onClose: () => void;
  pdfContent?: string;
  systemInstruction?: string;
}

export default function VoiceTutor({ isOpen, onClose, pdfContent, systemInstruction }: VoiceTutorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // PCM to Base64 utility
  const pcmToBase64 = (pcmData: Float32Array) => {
    const buffer = new ArrayBuffer(pcmData.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < pcmData.length; i++) {
      let s = Math.max(-1, Math.min(1, pcmData[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const playAudioChunk = (base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;
    
    // Decode base64 to array buffer
    const binary = window.atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Gemini Live API returns 24kHz PCM 16-bit
    const audioData = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      float32Data[i] = audioData[i] / 32768.0;
    }
    
    const buffer = ctx.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    // Gapless playback scheduling
    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime + 0.05; // slight buffer
    }
    
    source.start(nextStartTimeRef.current);
    
    setIsSpeaking(true);
    source.onended = () => {
      setTimeout(() => setIsSpeaking(false), 500); 
    };
    
    nextStartTimeRef.current += buffer.duration;
  };

  const stopAudioOutput = () => {
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.suspend();
      setTimeout(() => {
        if (outputAudioCtxRef.current) {
          outputAudioCtxRef.current.resume();
          nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
        }
      }, 50);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startConnection();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isOpen]);

  const startConnection = async () => {
    if (wsRef.current) return;
    setIsConnecting(true);
    setAiResponse('Connecting to AI Tutor...');

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const token = user?.uid || 'anonymous';
      
      let contextStr = systemInstruction || 'You are UniAce voice tutor.';
      if (pdfContent) {
         contextStr += `\n\nStudy Context:\n${pdfContent.substring(0, 1500)}`;
      }
      
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/live?token=${encodeURIComponent(token)}&systemInstruction=${encodeURIComponent(contextStr)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsConnecting(false);
        setAiResponse('Connected. Start speaking!');
        
        // Setup audio contexts
        inputAudioCtxRef.current = new window.AudioContext({ sampleRate: 16000 });
        outputAudioCtxRef.current = new window.AudioContext({ sampleRate: 24000 });
        nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
          const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
          source.connect(processor);
          processor.connect(inputAudioCtxRef.current.destination);
          
          processor.onaudioprocess = (e) => {
            if (isMuted || ws.readyState !== WebSocket.OPEN) return;
            const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
            ws.send(JSON.stringify({ audio: base64 }));
          };
        } catch (e) {
          console.error("Mic error:", e);
          setAiResponse('Microphone access denied or error.');
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playAudioChunk(msg.audio);
        }
        if (msg.interrupted) {
          stopAudioOutput();
          setIsSpeaking(false);
          setAiResponse('Interrupted. Listening...');
        }
        if (msg.error) {
           setAiResponse('Error: ' + msg.error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setAiResponse('Disconnected.');
      };

    } catch (e) {
      console.error(e);
      setAiResponse('Failed to connect.');
      setIsConnecting(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800/50">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg">
                  {isConnected ? <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-5 h-5 text-slate-400" />}
                </div>
                Live Voice Tutor
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center min-h-[350px] relative">
              {/* Status Text */}
              <div className="absolute top-6 left-0 right-0 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isConnecting ? 'Connecting...' : !isConnected ? 'Disconnected' : isSpeaking ? 'Tutor is speaking...' : isMuted ? 'Muted' : 'Listening...'}
                </p>
              </div>

              {/* Main Interaction Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                disabled={!isConnected}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                  !isConnected
                    ? 'bg-slate-200 dark:bg-zinc-800'
                    : isMuted
                    ? 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)]'
                    : isSpeaking
                    ? 'bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)]'
                    : 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                }`}
              >
                {/* Ripple Effect */}
                {isConnected && !isMuted && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full border-2 border-white/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full border-2 border-white/20"
                    />
                  </>
                )}

                {isConnecting ? (
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : !isConnected ? (
                  <WifiOff className="w-12 h-12 text-slate-400" />
                ) : isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white" />
                ) : isMuted ? (
                  <MicOff className="w-12 h-12 text-white" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </motion.button>

              {/* Transcript / Response Area */}
              <div className="mt-10 w-full text-center h-24 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={aiResponse}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-slate-600 dark:text-slate-400 text-base"
                  >
                    {aiResponse}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

