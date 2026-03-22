import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, X, MessageSquare, Mic, MicOff, Image as ImageIcon, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, Zap, Lightbulb, Sparkles, Settings, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, CourseId, UserProgress, AIPersonality } from "../types";
import MarkdownRenderer from './MarkdownRenderer';
import { AIService } from "../services/ai";
import { useAuth } from "../context/AuthContext";
import { useWebSocketChat } from "../hooks/useWebSocketChat";
import PricingModal from './PricingModal';

interface ChatBotProps {
  isFullPage?: boolean;
  onToggleFullPage?: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeCourseId: CourseId | null;
  activeModule?: string;
  activeSubTopic?: string;
  subTopicContent?: string;
  progress?: UserProgress;
  profile?: any;
  onUpdatePersonality?: (personality: AIPersonality) => void;
}

export default function ChatBot({ 
  isFullPage = false, 
  onToggleFullPage,
  messages,
  setMessages,
  activeCourseId,
  activeModule,
  activeSubTopic,
  subTopicContent,
  progress,
  profile,
  onUpdatePersonality
}: ChatBotProps) {
  const { user, updateProfileData, signInWithGoogle } = useAuth();
  const { isConnected: isWsConnected, sendMessage: sendWsMessage } = useWebSocketChat();
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState(() => localStorage.getItem('chat_input_backup') || "");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [sparksRemaining, setSparksRemaining] = useState<number | null>(profile?.ai_sparks ?? null);
  const [isProMode, setIsProMode] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  useEffect(() => {
    localStorage.setItem('chat_input_backup', input);
  }, [input]);

  useEffect(() => {
    if (profile?.ai_sparks !== undefined) {
      setSparksRemaining(profile.ai_sparks);
    }
  }, [profile?.ai_sparks]);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const currentPersonality = progress?.aiPersonality || 'encouraging';

  const personalities: { id: AIPersonality; label: string; icon: string; desc: string }[] = [
    { id: 'encouraging', label: 'Coach', icon: '🏆', desc: 'Strategic & high-performance motivation' },
    { id: 'strict', label: 'Professor', icon: '👨‍🏫', desc: 'Elite academic rigor & precision' },
    { id: 'socratic', label: 'Mentor', icon: '🤔', desc: 'Deep philosophical inquiry & mastery' },
    { id: 'humorous', label: 'Buddy', icon: '🤪', desc: 'Witty, sharp & engaging learning' },
    { id: 'master', label: 'Grandmaster', icon: '🧠', desc: 'Omniscient, powerful & direct guidance' },
    { id: 'debate', label: 'Debater', icon: '🤺', desc: 'Flawed peer that challenges your logic' },
  ];

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setInput("");
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const speakText = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    
    // Try Browser TTS first for speed (and cost saving), fallback to API if needed or preferred
    // For this implementation, we'll prioritize Browser TTS for immediate feedback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Select a good voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        if (autoSpeak) {
           // Optional: Auto-listen after speaking could go here
        }
      };
      
      window.speechSynthesis.speak(utterance);
      return;
    }

    // Fallback to API TTS
    try {
      const audioUrl = await AIService.generateTTS(text);

      if (audioUrl) {
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.play();
        }
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  };

  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);

  useEffect(() => {
    // Analyze last message to show relevant suggested actions
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'model') {
      const text = lastMessage.text.toLowerCase();
      const actions = [];
      if (text.includes('trick') || text.includes('exam')) actions.push("Show me a trick!");
      if (text.includes('recommendation') || text.includes('master')) actions.push("Give me a recommendation");
      if (text.includes('tip') || text.includes('secret')) actions.push("Tell me the secret tip");
      if (text.includes('quiz') || text.includes('test')) actions.push("Test me with a quiz");
      if (text.includes('problem') || text.includes('practice')) actions.push("Give me a practice problem");
      
      setSuggestedActions(actions.slice(0, 3));
    } else {
      setSuggestedActions([]);
    }
  }, [messages]);

  const handleSend = async (overrideInput?: string, isHintRequest: boolean = false) => {
    const textToSend = overrideInput || input;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;
    if (!user) {
      setMessages((prev) => [...prev, { role: "model", text: "Please sign in to use the AI Tutor." }]);
      return;
    }

    // Scenario B: Volume Hard Stop
    const isFreeUser = profile?.plan_type === 'free';
    const hasNoSparks = (profile?.ai_sparks ?? 0) <= 0;
    if (isFreeUser && hasNoSparks && !isAdmin) {
      setShowPricingModal(true);
      return;
    }

    const userMsg: ChatMessage = { 
      role: "user", 
      text: textToSend || (selectedImage ? "Analyzed an image." : ""),
      image: selectedImage || undefined
    };
    
    setMessages((prev) => [...prev, userMsg]);
    
    setInput("");
    localStorage.removeItem('chat_input_backup');
    setSelectedImage(null);
    setIsLoading(true);

    // Calculate mastery level
    let masteryLevel = 0;
    if (progress && activeSubTopic) {
      const masteries = Object.values(progress.mastery);
      masteryLevel = masteries.length > 0 ? masteries.reduce((a, b) => a + b, 0) / masteries.length : 0;
    }

    // Use WebSocket if connected, fallback to fetch
    if (isWsConnected) {
      const modelMsg: ChatMessage = { role: "model", text: "" };
      const msgIndex = messages.length + 1; // Index of the message we just added
      setMessages(prev => [...prev, modelMsg]);

      sendWsMessage({
        message: userMsg.text,
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        context: `Course: ${activeCourseId}, Module: ${activeModule}, Topic: ${activeSubTopic}. Content: ${subTopicContent}`,
        complexity: isProMode ? 'high' : 'standard',
        isHintRequest,
        masteryLevel,
        personality: currentPersonality,
        currentSparks: profile?.ai_sparks ?? 50,
        planType: profile?.plan_type ?? 'free'
      }, (chunk) => {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[msgIndex].text += chunk;
          return newMsgs;
        });
      }, () => {
        setIsLoading(false);
        setMessages(prev => {
          const finalMsg = prev[msgIndex];
          if (autoSpeak) speakText(finalMsg.text);
          return prev;
        });
      }, (err) => {
        console.error("WS Chat error:", err);
        setIsLoading(false);
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[msgIndex].text = "Error: Failed to connect to AI tutor via WebSocket.";
          return newMsgs;
        });
      }, (meta) => {
        if (meta.sparksRemaining !== undefined) {
          setSparksRemaining(meta.sparksRemaining);
        }
      });
      return;
    }

    // Fallback to fetch if WS not connected
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          context: `Course: ${activeCourseId}, Module: ${activeModule}, Topic: ${activeSubTopic}. Content: ${subTopicContent}`,
          complexity: isProMode ? 'high' : 'standard',
          isHintRequest,
          masteryLevel,
          personality: currentPersonality,
          currentSparks: profile?.ai_sparks ?? 50,
          planType: profile?.plan_type ?? 'free'
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response JSON:', responseText);
        throw new Error(`Server returned an invalid response (Status ${response.status}). This usually happens if the server is restarting or misconfigured.`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error: ${response.status}`);
      }

      const modelMsg: ChatMessage = { 
        role: "model", 
        text: data.response
      };
      setMessages((prev) => [...prev, modelMsg]);
      setSparksRemaining(data.sparksRemaining);
      
      if (autoSpeak) {
        speakText(data.response);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "model", text: error.message || "Error: Failed to connect to AI tutor." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFullPage) {
    return (
      <div className="fixed inset-0 z-[80] lg:relative lg:z-auto flex-1 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-black text-white p-5 pt-safe flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <span className="font-bold text-lg block">AI Study Companion</span>
              <div className="flex items-center gap-2">
                {profile?.plan_type !== 'free' || isAdmin ? (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    <Zap size={10} fill="currentColor" />
                    <span>Unlimited Sparks</span>
                  </div>
                ) : sparksRemaining !== null && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    <Zap size={10} fill="currentColor" />
                    <span>{sparksRemaining} Sparks</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 uppercase tracking-tighter opacity-80">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Connected</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={() => onToggleFullPage?.()}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-50 border-b border-slate-200 overflow-hidden z-10 shrink-0"
            >
              <div className="p-5 max-w-3xl mx-auto">
                <h3 className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Choose AI Personality</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {personalities.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onUpdatePersonality?.(p.id);
                        setShowSettings(false);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        currentPersonality === p.id
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20'
                          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md'
                      }`}
                    >
                      <div className="text-2xl mb-2">{p.icon}</div>
                      <div className={`font-bold text-sm mb-1 ${currentPersonality === p.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{p.label}</div>
                      <div className={`text-xs ${currentPersonality === p.id ? 'text-emerald-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-zinc-950 scroll-smooth" ref={scrollRef}>
          {(messages.length === 0 || (messages.length === 1 && messages[0].role === 'model')) && (
            <div className="text-center space-y-6 py-8 max-w-2xl mx-auto">
              {messages.length === 0 && (
                <>
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Bot size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">How can I help you study?</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">Ask me anything about your current module or upload a problem.</p>
                  </div>
                </>
              )}
              <div className="space-y-3 text-left max-w-md mx-auto w-full">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Trending in this Course</span>
                </div>
                {[
                  { icon: "🔥", text: "Explain the core concept of this module simply" },
                  { icon: "📊", text: "What are the most common exam questions for this?" },
                  { icon: "🎯", text: "Create a quick practice quiz to test my knowledge" },
                  { icon: "🧠", text: "Help me memorize the key formulas and definitions" }
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setInput(item.text); }}
                    className="w-full p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-left hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all group flex items-center gap-3"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-sm text-slate-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-1">{item.text}</span>
                    <ArrowRight size={16} className="text-slate-300 dark:text-zinc-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === "user" ? "bg-slate-900 text-white" : "bg-emerald-500 text-white"
                  }`}>
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                    msg.role === "user" 
                      ? "bg-slate-900 dark:bg-zinc-800 text-white rounded-tr-none" 
                      : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none"
                  }`}>
                    {msg.image && (
                      <img src={msg.image} alt="User upload" className="rounded-xl mb-3 max-w-full h-auto border border-white/10 shadow-sm" />
                    )}
                    <div className="text-inherit prose prose-sm prose-slate dark:prose-invert max-w-none">
                      <MarkdownRenderer content={msg.text} />
                    </div>
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source, idx) => (
                            <a 
                              key={idx} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg border border-slate-200 dark:border-zinc-700 transition-colors flex items-center gap-1.5 font-medium"
                            >
                              <MessageSquare size={12} />
                              {source.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.role === "model" && (
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => speakText(msg.text)}
                          className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                          title="Read aloud"
                        >
                          <Volume2 size={16} />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(msg.text, i)}
                          className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                          title="Copy"
                        >
                          {copiedId === i ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 shrink-0 pb-safe">
          <div className="max-w-3xl mx-auto w-full">
            {suggestedActions.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {suggestedActions.map((action, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSend(action)}
                    className="whitespace-nowrap px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-1.5 uppercase tracking-wider shadow-sm"
                  >
                    <Sparkles size={12} />
                    {action}
                  </button>
                ))}
              </div>
            )}

            {messages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                  onClick={() => handleSend("I'm stuck. Can you give me a progressive hint?", true)}
                  className="whitespace-nowrap px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Lightbulb size={12} />
                  Get a Hint
                </button>
              </div>
            )}

            {selectedImage && (
              <div className="relative inline-block mb-4">
                <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-2xl border-2 border-emerald-500 shadow-lg" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setIsProMode(!isProMode)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  isProMode 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/20' 
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
                title={isProMode ? "Deep Analysis (Cost varies by length)" : "Standard Query (Cost varies by length)"}
              >
                <Sparkles size={12} fill={isProMode ? "currentColor" : "none"} />
                {isProMode ? "Deep Analysis" : "Standard Query"}
              </button>
              {isProMode && (
                <span className="text-[10px] text-purple-500 font-medium animate-pulse">
                  High precision mode enabled
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isRecording ? "Listening..." : "Ask anything..."}
                  className={`w-full pl-5 pr-12 py-3.5 bg-slate-100 dark:bg-zinc-900 border-none rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 transition-all ${isRecording ? 'animate-pulse ring-2 ring-emerald-500' : ''}`}
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={isLoading || (!input.trim() && !selectedImage)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  title="Upload image"
                >
                  <ImageIcon size={20} />
                </button>
                <button 
                  onClick={toggleRecording}
                  className={`p-3 rounded-xl transition-colors ${isRecording ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                  title="Voice input"
                >
                  {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button 
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`p-3 rounded-xl transition-colors ${autoSpeak ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                  title="Toggle auto-speak"
                >
                  {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>
        {showPricingModal && (
          <PricingModal 
            isOpen={showPricingModal} 
            onClose={() => setShowPricingModal(false)} 
            type="volume-stop"
            onUpgradeClick={() => {
              setShowPricingModal(false);
              onToggleFullPage?.();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for all screen sizes */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[65]"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[70] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg h-[80vh] sm:h-[700px] flex flex-col overflow-hidden"
            >
              {/* Header */}
                  <div className="bg-slate-900 dark:bg-black text-white p-5 pt-safe flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Bot size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-sm block">AI Study Companion</span>
                <div className="flex items-center gap-2">
                  {profile?.plan_type !== 'free' || isAdmin ? (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      <Zap size={10} fill="currentColor" />
                      <span>Unlimited Sparks</span>
                    </div>
                  ) : sparksRemaining !== null && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      <Zap size={10} fill="currentColor" />
                      <span>{sparksRemaining} Sparks</span>
                    </div>
                  )}
                  <div className={`flex items-center gap-1 text-[8px] uppercase tracking-tighter transition-colors ${isWsConnected ? 'text-emerald-400' : 'text-amber-400 opacity-50'}`}>
                    <div className={`w-1 h-1 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span>{isWsConnected ? 'Real-time' : 'Standard'}</span>
                  </div>
                </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`hover:bg-white/10 p-2 rounded-xl transition-colors ${showSettings ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                        title="Customize Personality"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={onToggleFullPage} 
                        className="hover:bg-white/10 p-2 rounded-xl transition-colors text-slate-400 hover:text-white hidden sm:block"
                        title="Full page mode"
                      >
                        <Maximize2 size={18} />
                      </button>
                      <button 
                        onClick={() => setIsOpen(false)} 
                        className="hover:bg-white/10 p-2 rounded-xl transition-colors text-slate-400 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-800 border-b border-slate-700 overflow-hidden z-10 shrink-0"
                  >
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {personalities.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            onUpdatePersonality?.(p.id);
                            setShowSettings(false);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col ${
                            currentPersonality === p.id
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{p.icon}</span>
                            <span className="font-bold text-xs">{p.label}</span>
                          </div>
                          <div className="text-[10px] opacity-70 truncate">
                            {p.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-zinc-950 no-scrollbar">
                {(messages.length === 0 || (messages.length === 1 && messages[0].role === 'model')) && (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 px-6">
                    {messages.length === 0 && (
                      <>
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-inner">
                          <Bot size={40} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">How can I help you study?</p>
                          <p className="text-sm text-slate-500 dark:text-zinc-400">Ask me anything about your current module or upload a problem.</p>
                        </div>
                      </>
                    )}
                    <div className="flex flex-col gap-2 w-full max-w-xs text-left">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Trending Questions</span>
                      </div>
                      {[
                        { icon: "🔥", text: "Explain the core concept simply" },
                        { icon: "📊", text: "What are the common exam questions?" },
                        { icon: "🎯", text: "Create a quick practice quiz" }
                      ].map((q, idx) => (
                        <button 
                          key={idx}
                          onClick={() => { setInput(q.text); }}
                          className="text-sm p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-700 dark:text-zinc-300 font-medium hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-left shadow-sm flex items-center gap-2 group"
                        >
                          <span className="text-base">{q.icon}</span>
                          <span className="flex-1 text-xs">{q.text}</span>
                          <ArrowRight size={14} className="text-slate-300 dark:text-zinc-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[90%] p-5 rounded-3xl text-sm shadow-sm ${
                      msg.role === "user" 
                        ? "bg-slate-900 dark:bg-zinc-800 text-white rounded-tr-none" 
                        : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none"
                    }`}>
                      {msg.image && (
                        <img src={msg.image} alt="User upload" className="rounded-2xl mb-4 max-w-full h-auto border border-white/20 shadow-md" />
                      )}
                      <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                        <MarkdownRenderer content={msg.text} />
                      </div>
                      {msg.role === "model" && (
                        <div className="mt-5 flex gap-2">
                          <button 
                            onClick={() => speakText(msg.text)}
                            className="p-2 bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                            title="Read aloud"
                          >
                            <Volume2 size={16} />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(msg.text, i)}
                            className="p-2 bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                            title="Copy"
                          >
                            {copiedId === i ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-3xl rounded-tl-none shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 shrink-0">
                {suggestedActions.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {suggestedActions.map((action, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSend(action)}
                        className="whitespace-nowrap px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-1.5 uppercase tracking-wider shadow-sm"
                      >
                        <Sparkles size={12} />
                        {action}
                      </button>
                    ))}
                  </div>
                )}

                {messages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button 
                      onClick={() => handleSend("I'm stuck. Can you give me a progressive hint?", true)}
                      className="whitespace-nowrap px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all flex items-center gap-1.5 uppercase tracking-wider"
                    >
                      <Lightbulb size={12} />
                      Get a Hint
                    </button>
                  </div>
                )}

                {selectedImage && (
                  <div className="relative inline-block mb-2">
                    <img src={selectedImage} alt="Preview" className="h-24 w-24 object-cover rounded-2xl border-2 border-emerald-500 shadow-lg" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setIsProMode(!isProMode)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isProMode 
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/20' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                    title={isProMode ? "Deep Analysis (Cost varies by length)" : "Standard Query (Cost varies by length)"}
                  >
                    <Sparkles size={12} fill={isProMode ? "currentColor" : "none"} />
                    {isProMode ? "Deep Analysis" : "Standard Query"}
                  </button>
                  {isProMode && (
                    <span className="text-[10px] text-purple-500 font-medium animate-pulse">
                      High precision mode enabled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder={isRecording ? "Listening..." : "Ask anything..."}
                      className={`w-full pl-6 pr-14 py-4 bg-slate-100 dark:bg-zinc-900 border-none rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 transition-all ${isRecording ? 'animate-pulse ring-2 ring-emerald-500' : ''}`}
                    />
                    <button 
                      onClick={() => handleSend()}
                      disabled={isLoading || (!input.trim() && !selectedImage)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md active:scale-95"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all"
                      title="Upload image"
                    >
                      <ImageIcon size={22} />
                    </button>
                    <button 
                      onClick={toggleRecording}
                      className={`p-4 rounded-xl transition-all ${isRecording ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20' : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
                      title="Voice input"
                    >
                      {isRecording ? <Mic size={22} /> : <MicOff size={22} />}
                    </button>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={`fixed bottom-24 sm:bottom-6 right-6 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto' : 'opacity-100'}`}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-900 dark:bg-emerald-600 text-white p-5 rounded-[2rem] shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center group"
        >
          {isOpen ? <X size={28} className="group-hover:rotate-90 transition-transform duration-300" /> : <MessageSquare size={28} className="group-hover:scale-110 transition-transform duration-300" />}
        </motion.button>
      </div>

      {showPricingModal && (
        <PricingModal 
          isOpen={showPricingModal} 
          onClose={() => setShowPricingModal(false)} 
          type="volume-stop"
          onUpgradeClick={() => {
            setShowPricingModal(false);
            setIsOpen(false);
            // Trigger navigation to pricing view
            const event = new CustomEvent('navigate', { detail: 'pricing' });
            window.dispatchEvent(event);
          }}
        />
      )}
    </>
  );
}
