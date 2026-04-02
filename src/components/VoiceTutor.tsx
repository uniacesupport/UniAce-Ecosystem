import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, X, Settings, MessageSquare, Sparkles, AlertCircle, Play, Square } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { VoiceMode, VoiceProvider } from '../services/voiceService';

interface VoiceTutorProps {
  isOpen: boolean;
  onClose: () => void;
  systemInstruction?: string;
  pdfContent?: string;
}

const VoiceTutor: React.FC<VoiceTutorProps> = ({ isOpen, onClose, systemInstruction, pdfContent }) => {
  const { 
    isActive, 
    isListening, 
    isSpeaking, 
    transcript, 
    error, 
    config, 
    setConfig, 
    start, 
    stop,
    clearTranscript
  } = useVoice({ systemInstruction, pdfContent });

  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const toggleVoice = () => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  };

  const handleModeChange = (mode: VoiceMode) => {
    stop();
    setConfig(prev => ({ ...prev, mode }));
  };

  const handleProviderChange = (provider: VoiceProvider) => {
    stop();
    setConfig(prev => ({ ...prev, provider }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-6 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden z-50 flex flex-col"
          style={{ maxHeight: '70vh' }}
        >
          {/* Header */}
          <div className="p-4 bg-emerald-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">UniAce Live Tutor</h3>
                <p className="text-[10px] opacity-80">
                  {isActive ? (isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Active') : 'Ready to talk'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { stop(); onClose(); }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Overlay */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50 dark:bg-emerald-900/20 p-4 border-b border-emerald-100 dark:border-emerald-900/30"
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      Interaction Mode
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModeChange('live')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                          config.mode === 'live' 
                            ? 'bg-emerald-500 text-white shadow-md' 
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-emerald-100 dark:border-emerald-900/30'
                        }`}
                      >
                        Live (Real-time)
                      </button>
                      <button
                        onClick={() => handleModeChange('standard')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                          config.mode === 'standard' 
                            ? 'bg-emerald-500 text-white shadow-md' 
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-emerald-100 dark:border-emerald-900/30'
                        }`}
                      >
                        Standard
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      AI Provider
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['gemini', 'groq', 'openai', 'mistral'] as VoiceProvider[]).map((p) => (
                        <button
                          key={p}
                          disabled={config.mode === 'live' && p !== 'gemini'}
                          onClick={() => handleProviderChange(p)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all capitalize ${
                            config.provider === p 
                              ? 'bg-emerald-500 text-white shadow-md' 
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-emerald-100 dark:border-emerald-900/30 disabled:opacity-30'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    {config.mode === 'live' && (
                      <p className="text-[9px] text-emerald-600/60 mt-1 italic">
                        * Live mode currently only supports Gemini.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript Area */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/50"
            style={{ minHeight: '200px' }}
          >
            {transcript.length === 0 && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-2">
                <MessageSquare className="w-8 h-8" />
                <p className="text-xs">Tap the mic to start your session</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs">{error}</p>
              </div>
            )}

            {transcript.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.isUser ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                  msg.isUser 
                    ? 'bg-emerald-500 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-emerald-100 dark:border-emerald-900/30 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {isSpeaking && !isListening && (
              <div className="flex justify-start">
                <div className="flex gap-1 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <motion.div 
                    animate={{ height: [4, 12, 4] }} 
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-1 bg-emerald-500 rounded-full" 
                  />
                  <motion.div 
                    animate={{ height: [8, 4, 8] }} 
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
                    className="w-1 bg-emerald-500 rounded-full" 
                  />
                  <motion.div 
                    animate={{ height: [4, 12, 4] }} 
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                    className="w-1 bg-emerald-500 rounded-full" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-6 bg-white dark:bg-gray-900 border-t border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center gap-4">
            {/* Visualizer Circle */}
            <div className="relative">
              <AnimatePresence>
                {(isListening || isSpeaking) && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-emerald-500 rounded-full"
                  />
                )}
              </AnimatePresence>
              
              <button
                onClick={toggleVoice}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isActive 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isActive ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex items-center gap-6 text-gray-400 dark:text-gray-500">
              <div className="flex flex-col items-center gap-1">
                <div className={`p-2 rounded-full ${isListening ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                  {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </div>
                <span className="text-[9px] font-medium uppercase tracking-tighter">Mic</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className={`p-2 rounded-full ${isSpeaking ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                  {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <span className="text-[9px] font-medium uppercase tracking-tighter">Speaker</span>
              </div>
            </div>
            
            {transcript.length > 0 && (
              <button 
                onClick={clearTranscript}
                className="text-[10px] text-gray-400 hover:text-emerald-500 transition-colors uppercase tracking-widest font-bold"
              >
                Clear History
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceTutor;
