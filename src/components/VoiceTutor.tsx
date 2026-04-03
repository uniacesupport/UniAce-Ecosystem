import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { callAI } from '../services/ai';

interface VoiceTutorProps {
  isOpen: boolean;
  onClose: () => void;
  pdfContent?: string;
  systemInstruction?: string;
}

export default function VoiceTutor({ isOpen, onClose, pdfContent, systemInstruction }: VoiceTutorProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Process the transcript when listening stops and we have text
  useEffect(() => {
    if (!isListening && transcript && !isProcessing && !isSpeaking) {
      handleAIProcessing(transcript);
    }
  }, [isListening, transcript]);

  const handleAIProcessing = async (text: string) => {
    setIsProcessing(true);
    try {
      const prompt = pdfContent ? `Context: ${pdfContent.substring(0, 2000)}\n\nUser: ${text}` : text;
      const response = await callAI(prompt, systemInstruction, undefined, 1024, 'standard', 'chat');
      
      if (response && response.text) {
        setAiResponse(response.text);
        speakText(response.text);
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      setAiResponse("I'm sorry, I encountered an error connecting to my brain. Please try again.");
      speakText("I'm sorry, I encountered an error connecting to my brain. Please try again.");
    } finally {
      setIsProcessing(false);
      setTranscript(''); // Clear transcript for next input
    }
  };

  const speakText = (text: string) => {
    if (!synthesisRef.current) return;
    
    synthesisRef.current.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a good English voice
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isSpeaking) {
      synthesisRef.current?.cancel();
      setIsSpeaking(false);
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setAiResponse('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start recognition", e);
      }
    }
  };

  const handleClose = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (synthesisRef.current) synthesisRef.current.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setTranscript('');
    setAiResponse('');
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
                  <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Voice Tutor
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
                  {isListening ? 'Listening...' : isProcessing ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Tap to speak'}
                </p>
              </div>

              {/* Main Interaction Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                disabled={isProcessing}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isListening 
                    ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]' 
                    : isProcessing
                    ? 'bg-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.4)]'
                    : isSpeaking
                    ? 'bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)]'
                    : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {/* Ripple Effect when listening or speaking */}
                {(isListening || isSpeaking) && (
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

                {isProcessing ? (
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white" />
                ) : isListening ? (
                  <Mic className="w-12 h-12 text-white" />
                ) : (
                  <MicOff className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                )}
              </motion.button>

              {/* Transcript / Response Area */}
              <div className="mt-10 w-full text-center h-24 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {transcript && (
                    <motion.p 
                      key="transcript"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-slate-800 dark:text-slate-200 text-lg font-medium"
                    >
                      "{transcript}"
                    </motion.p>
                  )}
                  {aiResponse && !transcript && (
                    <motion.p 
                      key="response"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-slate-600 dark:text-slate-400 text-base"
                    >
                      {aiResponse}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
