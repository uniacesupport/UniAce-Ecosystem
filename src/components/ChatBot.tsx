import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, X, MessageSquare, Maximize2, Minimize2, 
  RotateCcw, Sparkles, Settings, ArrowRight, Download 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, CourseId, UserProgress, AIPersonality, Bookmark } from "../types";
import { jsonrepair } from 'jsonrepair';
import { AIService } from "../services/ai";
import { useAuth } from "../context/AuthContext";
import { useCourses } from "../context/CourseContext";
import { useWebSocketChat } from "../hooks/useWebSocketChat";
import PricingModal from './PricingModal';
import { ChatHeader } from './chat/ChatHeader';
import { ChatMessageCard } from './chat/ChatMessageCard';
import { ChatInputBar } from './chat/ChatInputBar';
import { ChatToolkitSheet } from './chat/ChatToolkitSheet';
import { SyllabusJumperModal } from './chat/SyllabusJumperModal';
import { MiniQuizModal } from './chat/MiniQuizModal';

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
  onToggleCalculator?: () => void;
  onOpenVoiceTutor?: () => void;
  onPdfTextChange?: (text: string | null) => void;
  onSelectTopicContext?: (courseId: CourseId, moduleTitle: string, subTopicTitle: string, subTopicContent?: string) => void;
  onSaveBookmark?: (bookmark: Bookmark) => void;
  onClose?: () => void;
}

export default function ChatBot({ 
  isFullPage = false, 
  onToggleFullPage,
  messages,
  setMessages,
  activeCourseId: initialCourseId,
  activeModule: initialModule,
  activeSubTopic: initialSubTopic,
  subTopicContent: initialSubTopicContent,
  progress,
  profile,
  onUpdatePersonality,
  onToggleCalculator,
  onOpenVoiceTutor,
  onPdfTextChange,
  onSelectTopicContext,
  onSaveBookmark,
  onClose
}: ChatBotProps) {
  const { user, profile: authProfile } = useAuth();
  const { courses } = useCourses();
  const { isConnected: isWsConnected, sendMessage: sendWsMessage } = useWebSocketChat();
  const isAdmin = (profile || authProfile)?.role === 'admin' || (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').includes(user?.email || '');

  // Dynamic context state (can be overridden by Syllabus Jumper)
  const [currentCourseId, setCurrentCourseId] = useState<CourseId | null>(initialCourseId);
  const [currentModuleTitle, setCurrentModuleTitle] = useState<string | undefined>(initialModule);
  const [currentSubTopicTitle, setCurrentSubTopicTitle] = useState<string | undefined>(initialSubTopic);
  const [currentContent, setCurrentContent] = useState<string | undefined>(initialSubTopicContent);

  useEffect(() => {
    if (initialCourseId) setCurrentCourseId(initialCourseId);
    if (initialModule) setCurrentModuleTitle(initialModule);
    if (initialSubTopic) setCurrentSubTopicTitle(initialSubTopic);
    if (initialSubTopicContent) setCurrentContent(initialSubTopicContent);
  }, [initialCourseId, initialModule, initialSubTopic, initialSubTopicContent]);

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState(() => localStorage.getItem('chat_input_backup') || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [sparksRemaining, setSparksRemaining] = useState<number | null>((profile || authProfile)?.ai_sparks ?? null);
  const [isProMode, setIsProMode] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Modals & Panels
  const [isToolkitOpen, setIsToolkitOpen] = useState(false);
  const [isMathPaletteOpen, setIsMathPaletteOpen] = useState(false);
  const [isSyllabusJumperOpen, setIsSyllabusJumperOpen] = useState(false);
  const [isMiniQuizOpen, setIsMiniQuizOpen] = useState(false);

  // Audio Speech state
  const [activeSpeechIdx, setActiveSpeechIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Adaptive hint counter
  const [hintsRequestedCount, setHintsRequestedCount] = useState(0);

  // File Inputs Ref
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const currentPersonality = progress?.aiPersonality || profile?.aiPersonality || 'encouraging';

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/pdfWorker.ts', import.meta.url), { type: 'module' });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_input_backup', input);
  }, [input]);

  useEffect(() => {
    if ((profile || authProfile)?.ai_sparks !== undefined) {
      setSparksRemaining((profile || authProfile).ai_sparks);
    }
  }, [(profile || authProfile)?.ai_sparks]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isAiThinking]);

  // Handle Context Selection from Syllabus Jumper
  const handleSelectTopicContext = (courseId: CourseId, moduleTitle: string, subTopicTitle: string, content?: string) => {
    setCurrentCourseId(courseId);
    setCurrentModuleTitle(moduleTitle);
    setCurrentSubTopicTitle(subTopicTitle);
    setCurrentContent(content);
    if (onSelectTopicContext) {
      onSelectTopicContext(courseId, moduleTitle, subTopicTitle, content);
    }
  };

  // Image & PDF Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("PDF size must be less than 15MB");
        return;
      }
      setIsPdfLoading(true);
      setPdfFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (workerRef.current) {
          workerRef.current.onmessage = (event) => {
            const { type, text, error } = event.data;
            if (type === 'SUCCESS') {
              setPdfText(text);
              setIsPdfLoading(false);
              if (onPdfTextChange) onPdfTextChange(text);
            } else if (type === 'ERROR') {
              alert(`PDF Extraction Error: ${error}`);
              setIsPdfLoading(false);
            }
          };
          workerRef.current.postMessage({ type: 'PARSE_PDF', fileData: reader.result });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Speech TTS
  const handleSpeakText = async (text: string, idx: number) => {
    if (!text) return;
    setActiveSpeechIdx(idx);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural'));
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onend = () => setActiveSpeechIdx(null);
      utterance.onerror = () => setActiveSpeechIdx(null);
      window.speechSynthesis.speak(utterance);
      return;
    }

    try {
      const audioUrl = await AIService.generateTTS(text);
      if (audioUrl) {
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = () => setActiveSpeechIdx(null);
          audio.play();
        }
      }
    } catch (e) {
      console.error("TTS playback error:", e);
      setActiveSpeechIdx(null);
    }
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActiveSpeechIdx(null);
  };

  // Export Notes to Markdown
  const handleExportNotes = () => {
    if (messages.length === 0) return;
    const formattedDate = new Date().toLocaleDateString();
    let md = `# UniAce Study Session Notes — ${currentCourseId || 'Academic Subject'}\n`;
    md += `**Topic:** ${currentSubTopicTitle || currentModuleTitle || 'Core Curriculum'}\n`;
    md += `**Date:** ${formattedDate}\n\n---\n\n`;

    messages.forEach((msg, idx) => {
      const speaker = msg.role === 'user' ? '### 🧑‍🎓 Student' : '### 🎓 UniAce Academic Tutor';
      md += `${speaker}\n\n${msg.text}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `UniAce_Study_Notes_${(currentSubTopicTitle || 'Topic').replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset / New Session
  const handleNewSession = () => {
    if (messages.length > 0 && confirm("Start a fresh study conversation? Your previous notes remain saved in your notebook.")) {
      setMessages([]);
      setInput("");
      setSelectedImage(null);
      setPdfText(null);
      setHintsRequestedCount(0);
      localStorage.removeItem('chat_input_backup');
    }
  };

  // Send Message Logic
  const handleSend = async (overrideInput?: string, isHintRequest: boolean = false) => {
    let textToSend = overrideInput || input;
    if ((!textToSend.trim() && !selectedImage && !pdfText) || isLoading) return;
    if (!user) {
      setMessages((prev) => [...prev, { role: "model", text: "Please sign in to access your UniAce Academic Tutor." }]);
      return;
    }

    const isFreeUser = (profile || authProfile)?.plan_type === 'free';
    const hasNoSparks = ((profile || authProfile)?.ai_sparks ?? 0) <= 0;
    if (isFreeUser && hasNoSparks && !isAdmin) {
      setShowPricingModal(true);
      return;
    }

    if (isHintRequest) {
      setHintsRequestedCount(prev => prev + 1);
    }

    if (pdfText) {
      textToSend = `[Attached Document Context]:\n${pdfText}\n\n[Student Question]:\n${textToSend}`;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: "user",
      text: textToSend || (selectedImage ? "Analyzed problem diagram." : "Analyzed uploaded document."),
      image: selectedImage || undefined,
      pdfContent: pdfText ? "Context Included" : undefined,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setPdfText(null);
    localStorage.removeItem('chat_input_backup');
    setIsLoading(true);

    let masteryLevel = 0;
    if (progress && progress.mastery) {
      const masteries = Object.values(progress.mastery);
      masteryLevel = masteries.length > 0 ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length) : 0;
    }

    const chatContext = [
      currentCourseId && `Course: ${currentCourseId}`,
      currentModuleTitle && `Module: ${currentModuleTitle}`,
      currentSubTopicTitle && `Topic: ${currentSubTopicTitle}`,
      currentContent && `Curriculum Reference: ${currentContent.substring(0, 12000)}`
    ].filter(Boolean).join(', ') || 'General Academic Tutor';

    if (isWsConnected) {
      const modelMsg: ChatMessage = { 
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: "model", 
        text: "", 
        timestamp: new Date().toISOString() 
      };
      const msgIndex = messages.length + 1;
      setMessages(prev => [...prev, modelMsg]);

      sendWsMessage({
        message: userMsg.text,
        image: userMsg.image,
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        context: chatContext,
        complexity: isProMode ? 'high' : 'standard',
        isHintRequest,
        masteryLevel,
        personality: currentPersonality,
        currentSparks: (profile || authProfile)?.ai_sparks ?? 50,
        planType: (profile || authProfile)?.plan_type ?? 'free'
      }, (chunk) => {
        setMessages(prev => {
          const newMsgs = [...prev];
          if (newMsgs[msgIndex]) {
            newMsgs[msgIndex].text += chunk;
          }
          return newMsgs;
        });
      }, () => {
        setIsLoading(false);
        setIsAiThinking(false);
      }, (err) => {
        console.error("WS Chat error:", err);
        setIsLoading(false);
        setIsAiThinking(false);
        setMessages(prev => {
          const newMsgs = [...prev];
          if (newMsgs[msgIndex]) {
            newMsgs[msgIndex].text = err ? `⚠️ ${err}` : "Error: Failed to connect to UniAce Tutor stream.";
            newMsgs[msgIndex].timestamp = new Date().toISOString();
          }
          return newMsgs;
        });
      }, (meta) => {
        if (meta.sparksRemaining !== undefined) {
          setSparksRemaining(meta.sparksRemaining);
        }
        if (meta.status === 'thinking') {
          if (isProMode) setIsAiThinking(true);
        } else if (meta.status === 'answering') {
          setIsAiThinking(false);
        }
      });
      return;
    }

    // Fallback HTTP Fetch
    try {
      let token = '';
      try {
        token = (await user?.getIdToken()) || '';
      } catch (tokErr) {
        console.warn("Could not retrieve user auth token:", tokErr);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: userMsg.text,
          image: userMsg.image,
          history: messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          context: chatContext,
          complexity: isProMode ? 'high' : 'standard',
          isHintRequest,
          masteryLevel,
          personality: currentPersonality,
          currentSparks: (profile || authProfile)?.ai_sparks ?? 50,
          planType: (profile || authProfile)?.plan_type ?? 'free'
        })
      });

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(responseText);
        } catch {
          try {
            data = JSON.parse(jsonrepair(responseText));
          } catch {
            data = null;
          }
        }
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || (
          response.status === 502 || response.status === 503 || response.status === 504
            ? 'UniAce Tutor is currently reconnecting. Please wait a moment and try again.'
            : `Server error (${response.status}): ${response.statusText || 'Request failed'}`
        );
        throw new Error(errorMsg);
      }

      if (!data || !data.response) {
        throw new Error("Unable to parse tutor response. Please try sending your message again.");
      }

      const modelMsg: ChatMessage = {
        id: data.id || `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: "model",
        text: data.response,
        meta: data.meta,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, modelMsg]);
      if (data.sparksRemaining !== undefined) {
        setSparksRemaining(data.sparksRemaining);
      }
    } catch (error: any) {
      console.error("Chat fetch error:", error);
      const displayMsg = error?.message || "Error: Failed to connect to UniAce Tutor.";
      setMessages((prev) => [...prev, { role: "model", text: displayMsg, timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render Full Page Experience
  const renderChatInterface = () => (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-zinc-950 overflow-hidden relative">
      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        onChange={handlePdfUpload}
        className="hidden"
      />

      {/* Upgraded Header */}
      <ChatHeader
        activeCourseId={currentCourseId}
        activeModuleTitle={currentModuleTitle}
        activeSubTopicTitle={currentSubTopicTitle}
        progress={progress}
        profile={profile || authProfile}
        sparksRemaining={sparksRemaining}
        isWsConnected={isWsConnected}
        currentPersonality={currentPersonality}
        onUpdatePersonality={onUpdatePersonality}
        onToggleCalculator={onToggleCalculator}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onOpenSyllabusJumper={() => setIsSyllabusJumperOpen(true)}
        onNewChatSession={handleNewSession}
        onClose={onClose}
        isFullPage={isFullPage}
        onToggleFullPage={onToggleFullPage}
      />

      {/* Settings / Personality Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 overflow-hidden z-20 shrink-0"
          >
            <div className="p-4 max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Pedagogical Tutor Calibration
                </span>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'encouraging', label: 'Academic Coach', icon: '🏆', desc: 'Supportive step-by-step mentor' },
                  { id: 'strict', label: 'Professor Rigor', icon: '👨‍🏫', desc: 'Formal proofs & exam rigor' },
                  { id: 'socratic', label: 'Socratic Mentor', icon: '🤔', desc: 'Guided inquiry & hints' },
                  { id: 'debate', label: 'Reverse Feynman', icon: '🔄', desc: 'Teach AI & spot logical flaws' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onUpdatePersonality?.(p.id as AIPersonality);
                      setShowSettings(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      currentPersonality === p.id
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{p.icon}</div>
                    <div className="font-bold text-xs">{p.label}</div>
                    <div className={`text-[10px] mt-0.5 ${currentPersonality === p.id ? 'text-emerald-100' : 'text-slate-400 dark:text-zinc-400'}`}>
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Messages Scroll Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Bot size={32} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                UniAce Academic Companion
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                Grounded in <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentCourseId || 'University Curriculum'}</span>. 
                Ask step-by-step proofs, scan diagrams, or test your mastery with a 3-question check.
              </p>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
              {[
                { title: "Explain Core Mechanics", desc: "Break down fundamental theorems and definitions with proofs.", prompt: "Explain the core mechanics and derivations of this topic in rigorous detail." },
                { title: "Worked University Problem", desc: "Show a step-by-step worked exam calculation with formulas.", prompt: "Provide a challenging worked exam problem on this topic with step-by-step solutions." },
                { title: "3-Question Quick Check", desc: "Test diagnostic recall and calculation accuracy right now.", prompt: "__TRIGGER_MINI_QUIZ__" },
                { title: "Syllabus Key Formulas", desc: "Extract essential LaTeX formulas and physical constants.", prompt: "List all key formulas, units, and constants for this syllabus module." }
              ].map((card, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => {
                    if (card.prompt === "__TRIGGER_MINI_QUIZ__") {
                      setIsMiniQuizOpen(true);
                    } else {
                      setInput(card.prompt);
                    }
                  }}
                  className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between text-left"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-3">
                    <span>Ask Tutor</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-5 py-2">
            {messages.map((msg, idx) => (
              <ChatMessageCard
                key={msg.id || idx}
                message={msg}
                index={idx}
                isLast={idx === messages.length - 1}
                activeSpeechIdx={activeSpeechIdx}
                onSpeakText={handleSpeakText}
                onStopSpeech={handleStopSpeech}
                onSendPrompt={(p) => handleSend(p)}
                onSaveBookmark={onSaveBookmark}
                currentUserId={user?.uid}
                courseId={currentCourseId || undefined}
              />
            ))}

            {/* Loading / Thinking Indicator (only when pending model message is not already in the list) */}
            {isLoading && (!messages.length || messages[messages.length - 1].role !== 'model') && (
              <div className="w-full flex justify-start">
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-xs border border-slate-200/85 dark:border-zinc-800 max-w-sm shadow-xs">
                  {isAiThinking && isProMode ? (
                    <>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.4s]" />
                      </div>
                      <span className="text-xs font-bold text-indigo-500">Pro Deep Proof in progress...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">UniAce Tutor is writing solution...</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgraded Multiline Input Bar */}
      <ChatInputBar
        input={input}
        setInput={setInput}
        onSend={handleSend}
        isLoading={isLoading}
        isProMode={isProMode}
        setIsProMode={setIsProMode}
        selectedImage={selectedImage}
        onClearImage={() => setSelectedImage(null)}
        pdfText={pdfText}
        pdfFileName={pdfFileName}
        onClearPdf={() => setPdfText(null)}
        isPdfLoading={isPdfLoading}
        onOpenToolkit={() => setIsToolkitOpen(true)}
        onOpenMathPalette={() => setIsMathPaletteOpen(!isMathPaletteOpen)}
        isMathPaletteOpen={isMathPaletteOpen}
        onCloseMathPalette={() => setIsMathPaletteOpen(false)}
        onInsertSymbol={(sym) => setInput(prev => prev ? `${prev} ${sym}` : sym)}
        hintsRequestedCount={hintsRequestedCount}
        onRequestAdaptiveSolution={() => handleSend("Please break down this derivation step-by-step with full intermediate calculations and intuitive analogies.")}
        activeTopicTitle={currentSubTopicTitle || currentModuleTitle || currentCourseId || undefined}
      />

      {/* Academic Toolkit Bottom Sheet */}
      <ChatToolkitSheet
        isOpen={isToolkitOpen}
        onClose={() => setIsToolkitOpen(false)}
        onTriggerImageUpload={() => imageInputRef.current?.click()}
        onTriggerPdfUpload={() => pdfInputRef.current?.click()}
        onToggleMathPalette={() => setIsMathPaletteOpen(true)}
        onOpenMiniQuiz={() => setIsMiniQuizOpen(true)}
        onExportNotes={handleExportNotes}
        onOpenSyllabusJumper={() => setIsSyllabusJumperOpen(true)}
        activeTopicTitle={currentSubTopicTitle || currentModuleTitle}
        hasMessages={messages.length > 0}
      />

      {/* Syllabus Unit Navigator Modal */}
      <SyllabusJumperModal
        isOpen={isSyllabusJumperOpen}
        onClose={() => setIsSyllabusJumperOpen(false)}
        courses={courses}
        activeCourseId={currentCourseId}
        activeModuleTitle={currentModuleTitle}
        activeSubTopicTitle={currentSubTopicTitle}
        progress={progress}
        onSelectTopicContext={handleSelectTopicContext}
      />

      {/* 3-Question Mini Quiz Modal */}
      <MiniQuizModal
        isOpen={isMiniQuizOpen}
        onClose={() => setIsMiniQuizOpen(false)}
        activeCourseId={currentCourseId}
        activeModuleTitle={currentModuleTitle}
        activeSubTopicTitle={currentSubTopicTitle}
        subTopicContent={currentContent}
        onQuizCompleted={(score) => {
          setMessages(prev => [
            ...prev,
            {
              role: 'model',
              text: `🎯 **Diagnostic Check Completed!**\n\nYou scored **${score}%** on the 3-question check for *${currentSubTopicTitle || 'this topic'}*.\n\n${
                score >= 80 
                  ? '🌟 Excellent mastery! Ready to tackle more advanced derivations or past exam questions.'
                  : '💡 Good effort! Review the worked solutions above or ask me to break down any step you found tricky.'
              }`
            }
          ]);
        }}
      />

      {/* Pricing Modal */}
      {showPricingModal && (
        <PricingModal 
          isOpen={showPricingModal} 
          onClose={() => setShowPricingModal(false)} 
          onUpgradeClick={() => {
            setShowPricingModal(false);
            window.location.href = '/pricing';
          }}
        />
      )}
    </div>
  );

  // If used in Full Page view
  if (isFullPage) {
    return (
      <div className="fixed inset-0 z-[80] lg:relative lg:z-auto flex-1 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
        {renderChatInterface()}
      </div>
    );
  }

  // Floating Popup Widget (When minimized / floating)
  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 group"
          title="Open UniAce AI Academic Tutor"
        >
          <Bot size={24} />
          <span className="hidden group-hover:inline text-xs font-bold pr-1">Ask UniAce</span>
        </button>
      )}

      {/* Floating Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[480px] h-[650px] max-h-[90vh] bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden"
          >
            {renderChatInterface()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
