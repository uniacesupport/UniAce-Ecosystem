import { Module, SubTopic, UserProgress } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, Brain, Menu, Volume2, Loader2, ArrowLeft, Sparkles, Wand2, Lock, Calculator as CalcIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import QuizGenerator from './QuizGenerator';
import QuickCheck from './QuickCheck';
import MarkdownRenderer from './MarkdownRenderer';
import PricingModal from './PricingModal';
import MiniTeacherModal from './MiniTeacherModal';
import { AIService } from '../services/ai';
import { generateLessonContent } from '../services/aiCourseGenerator';
import { LogService } from '../services/logService';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PipelineMetadata } from '../types';

interface ContentAreaProps {
  courseId: string | null;
  courseTitle: string;
  module: Module;
  activeSubTopicId: string;
  onSubTopicSelect: (id: string) => void;
  onBackToSyllabus: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onQuizComplete: (topicId: string, score: number) => void;
  onQuickCheckComplete?: (topicId: string) => void;
  autoStartQuiz?: boolean;
  onBookmark?: (item: any) => void;
  onViewSelect?: (view: any) => void;
  progress?: UserProgress;
  onToggleCalculator?: () => void;
  onLessonContentChange?: (content: string) => void;
}

export default function ContentArea({ 
  courseId,
  courseTitle,
  module, 
  activeSubTopicId, 
  onSubTopicSelect, 
  onBackToSyllabus,
  isSidebarOpen, 
  toggleSidebar,
  onQuizComplete,
  onQuickCheckComplete,
  autoStartQuiz = false,
  onBookmark,
  onViewSelect,
  progress,
  onToggleCalculator,
  onLessonContentChange
}: ContentAreaProps) {
  const [showQuiz, setShowQuiz] = useState(autoStartQuiz);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isMiniTeacherOpen, setIsMiniTeacherOpen] = useState(false);
  const [miniTeacherMode, setMiniTeacherMode] = useState<'default' | 'simpler' | 'quiz' | 'proactive'>('default');
  const [isProactiveQuiz, setIsProactiveQuiz] = useState(false);
  const hasCheckedInRef = useRef<Set<string>>(new Set());
  const [lockedFeatureName, setLockedFeatureName] = useState('');
  const [fetchedLesson, setFetchedLesson] = useState<{ content: string, metadata: PipelineMetadata } | null>(null);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const { refreshCourses } = useCourses();
  const { user, profile } = useAuth();
  const { isPremium } = usePremiumStatus();
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  const isLocked = !isPremium && !isAdmin;

  const activeSubTopicIndex = module.subTopics.findIndex(st => st.id === activeSubTopicId);
  const activeSubTopic = module.subTopics[activeSubTopicIndex] || module.subTopics[0];

  const generationSteps = [
    "AI is brainstorming the lesson structure...",
    "Consulting academic sources...",
    "Writing university-level content...",
    "Formatting LaTeX formulas...",
    "Drawing Mermaid diagrams...",
    "Adding real-world examples...",
    "Finalizing your personalized lesson..."
  ];

  // Proactive Mini Teacher Check-in (Smart Timer)
  const isMiniTeacherOpenRef = useRef(isMiniTeacherOpen);
  useEffect(() => { isMiniTeacherOpenRef.current = isMiniTeacherOpen; }, [isMiniTeacherOpen]);
  
  const showQuizRef = useRef(showQuiz);
  useEffect(() => { showQuizRef.current = showQuiz; }, [showQuiz]);

  // Load content dynamically (Lazy Loading)
  useEffect(() => {
    const loadContent = async () => {
      if (!courseId || !db) return;
      
      // If it already has content (legacy courses), use it
      if (activeSubTopic.content) {
        setFetchedLesson({ content: activeSubTopic.content, metadata: {} });
        return;
      }

      setIsFetchingContent(true);
      try {
        let lessonDoc = await getDoc(doc(db, `courses/${courseId}/modules/${module.id}/lessons`, activeSubTopic.id));
        
        // Fallback for legacy courses where lesson ID was just 'l1' instead of 'm1-l1'
        if (!lessonDoc.exists() && activeSubTopic.id.includes('-')) {
          const legacyId = activeSubTopic.id.split('-')[1];
          if (legacyId) {
            lessonDoc = await getDoc(doc(db, `courses/${courseId}/modules/${module.id}/lessons`, legacyId));
          }
        }

        if (lessonDoc.exists() && lessonDoc.data().content) {
          const data = lessonDoc.data();
          setFetchedLesson({ content: data.content, metadata: data.metadata || {} });
          onLessonContentChange?.(data.content);
        } else {
          // Trigger generation if not found
          setFetchedLesson(null);
          handleGenerateLesson();
        }
      } catch (error) {
        console.error("Error fetching lesson content:", error);
      } finally {
        setIsFetchingContent(false);
      }
    };

    loadContent();
  }, [activeSubTopic.id, courseId, module.id]);

  useEffect(() => {
    if (!fetchedLesson || isGenerating || isFetchingContent) return;
    if (hasCheckedInRef.current.has(activeSubTopic.id)) return;

    // Calculate Dynamic Delay (Smart Timer)
    // Avg reading speed: 200 wpm. We nudge at ~70% of estimated reading time.
    const wordCount = fetchedLesson.content.split(/\s+/).length;
    const estimatedReadingTimeMs = (wordCount / 200) * 60 * 1000;
    const dynamicDelay = Math.max(45000, Math.min(180000, estimatedReadingTimeMs * 0.7));

    const timer = setTimeout(() => {
      if (!isMiniTeacherOpenRef.current && !showQuizRef.current) {
        handleOpenMiniTeacher('proactive');
      }
      hasCheckedInRef.current.add(activeSubTopic.id);
    }, dynamicDelay);

    return () => clearTimeout(timer);
  }, [activeSubTopic.id, fetchedLesson, isGenerating, isFetchingContent]);

  useEffect(() => {
    if (autoStartQuiz) {
      setShowQuiz(true);
    }
    // Reset audio when subtopic changes
    setAudioUrl(null);
    setIsSpeaking(false);
  }, [autoStartQuiz, activeSubTopicId]);

  const handleOpenMiniTeacher = (mode: 'default' | 'simpler' | 'quiz' | 'proactive' = 'default') => {
    setMiniTeacherMode(mode);
    setIsMiniTeacherOpen(true);
  };

  const handleMiniTeacherAction = (action: 'simpler' | 'quiz') => {
    if (action === 'quiz') {
      setIsMiniTeacherOpen(false);
      setIsProactiveQuiz(true);
      setShowQuiz(true);
    } else {
      setMiniTeacherMode('simpler');
    }
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    setIsProactiveQuiz(false);
  };

  const handleGenerateLesson = async () => {
    if (!courseId || !db) return;
    
    setIsGenerating(true);
    setGenerationStep(0);

    // Progress animation
    const interval = setInterval(() => {
      setGenerationStep(prev => (prev + 1) % generationSteps.length);
    }, 3000);

    try {
      const lesson = await generateLessonContent(
        courseTitle,
        module.title,
        activeSubTopic.title
      );

      // Save to Firestore
      const lessonRef = doc(db, `courses/${courseId}/modules/${module.id}/lessons`, activeSubTopic.id);
      await setDoc(lessonRef, { content: lesson.content, metadata: lesson.metadata }, { merge: true });

      LogService.log('success', 'ai', `Generated lesson content for ${activeSubTopic.title}`, { courseId, moduleId: module.id, lessonId: activeSubTopic.id });

      // Update local state
      setFetchedLesson(lesson);
      onLessonContentChange?.(lesson.content);

      // Update global state to reflect new content
      await refreshCourses();
    } catch (error) {
      console.error('Lesson Generation Error:', error);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleListen = async () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.play();
      return;
    }

    if (!fetchedLesson?.content) return;

    try {
      setIsSpeaking(true);
      const url = await AIService.generateTTS(fetchedLesson.content);
      if (url) {
        setAudioUrl(url);
        const audio = new Audio(url);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  const prevSubTopic = activeSubTopicIndex > 0 ? module.subTopics[activeSubTopicIndex - 1] : null;
  const nextSubTopic = activeSubTopicIndex < module.subTopics.length - 1 ? module.subTopics[activeSubTopicIndex + 1] : null;

  const handleNextTopicClick = () => {
    if (nextSubTopic) {
      if (isLocked && activeSubTopicIndex + 1 > 0) {
        setLockedFeatureName('Full Module Access');
        setShowPricingModal(true);
        return;
      }
      onSubTopicSelect(nextSubTopic.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-50 dark:bg-zinc-950">
      {/* Subtopic Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between overflow-x-auto no-scrollbar whitespace-nowrap">
        <div className="flex items-center gap-4">
          {!isSidebarOpen && (
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <Menu size={18} />
            </button>
          )}
          <button 
            onClick={onBackToSyllabus}
            className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Syllabus</span>
          </button>
          {profile?.role === 'admin' && (
            <button 
              onClick={handleGenerateLesson}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all active:scale-95 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50"
              title="Regenerate Full University Note"
            >
              <Wand2 size={14} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleListen}
            disabled={isSpeaking && !audioUrl}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all active:scale-95 ${
              isSpeaking 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {isSpeaking && !audioUrl ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Volume2 size={14} />
            )}
            <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => handleOpenMiniTeacher('default')}
              className="flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all active:scale-95 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50"
            >
              <Sparkles size={14} />
              <span>Mini Teacher</span>
            </button>
          </div>

          <button
            onClick={onToggleCalculator}
            className="flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all active:scale-95 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-300"
          >
            <CalcIcon size={14} />
            <span>Calc</span>
          </button>

          <button
            onClick={() => setShowQuiz(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-all active:scale-95"
          >
            <Brain size={14} />
            <span>Quiz</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 pb-4 lg:pb-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <motion.div
            key={activeSubTopic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 lg:p-10 text-zinc-800 dark:text-zinc-200"
          >
            <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">
              <BookOpen size={12} />
              <span>{module.title}</span>
              <ChevronRight size={12} />
              <span className="text-zinc-900 dark:text-zinc-100">{activeSubTopic.title}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-950 dark:text-white mb-6 sm:mb-8 tracking-tight">{activeSubTopic.title}</h1>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 size={32} className="text-emerald-600 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                    <Sparkles size={20} className="text-amber-500" />
                    Infinite Lesson Engine
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">
                    {generationSteps[generationStep]}
                  </p>
                </div>
                <div className="max-w-xs text-xs text-zinc-400 italic">
                  "The magic of AI is turning blank pages into worlds of knowledge."
                </div>
              </div>
            ) : isFetchingContent ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">
                  Loading lesson content...
                </p>
              </div>
            ) : fetchedLesson ? (
              <div className="max-w-none">
                <MarkdownRenderer content={fetchedLesson.content} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full">
                  <BookOpen size={32} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">This lesson is currently empty.</p>
                <button 
                  onClick={handleGenerateLesson}
                  className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
                >
                  Generate Content Now
                </button>
              </div>
            )}
          </motion.div>

          {!isGenerating && !isFetchingContent && fetchedLesson && (
            <>
              {/* Quick Knowledge Check */}
              <QuickCheck 
                key={`qc-${activeSubTopic.id}`}
                subTopic={{ ...activeSubTopic, content: fetchedLesson.content }} 
                onCorrect={() => onQuickCheckComplete?.(activeSubTopic.id)} 
              />
            </>
          )}

          {/* Navigation & Quiz Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {prevSubTopic ? (
              <button
                onClick={() => onSubTopicSelect(prevSubTopic.id)}
                className="group flex flex-col items-start gap-1 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-900 dark:hover:border-zinc-100 transition-all text-left"
              >
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Previous Topic</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold group-hover:text-emerald-600 transition-colors">{prevSubTopic.title}</span>
              </button>
            ) : <div />}

            <button
              onClick={() => setShowQuiz(true)}
              className="flex flex-col items-center justify-center gap-2 p-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95"
            >
              <Brain size={20} />
              <span className="font-semibold text-sm">Take Topic Quiz</span>
            </button>

            {nextSubTopic ? (
              <button
                onClick={handleNextTopicClick}
                className="group flex flex-col items-end gap-1 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-900 dark:hover:border-zinc-100 transition-all text-right"
              >
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  {isLocked && activeSubTopicIndex + 1 > 0 && <Lock size={10} className="text-amber-500" />}
                  Next Topic
                </span>
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold group-hover:text-emerald-600 transition-colors">{nextSubTopic.title}</span>
              </button>
            ) : <div />}
          </div>
        </div>
      </div>

      {/* Quiz Generator Overlay */}
      <AnimatePresence>
        {showQuiz && (
          <QuizGenerator 
            courseId={courseId || undefined}
            module={module} 
            subTopic={{ ...activeSubTopic, content: fetchedLesson?.content || '' }}
            isProactive={isProactiveQuiz}
            onClose={handleQuizClose} 
            onComplete={(score) => onQuizComplete(activeSubTopic.id, score)}
            onNextTopic={nextSubTopic ? handleNextTopicClick : undefined}
            isNextTopicLocked={isLocked && activeSubTopicIndex + 1 > 0}
            onBookmark={onBookmark}
            onToggleCalculator={onToggleCalculator}
          />
        )}
      </AnimatePresence>

      {showPricingModal && (
        <PricingModal 
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)} 
          featureName={lockedFeatureName}
          onUpgradeClick={() => {
            setShowPricingModal(false);
            setShowQuiz(false);
            onViewSelect?.('pricing');
          }}
        />
      )}

      <MiniTeacherModal
        isOpen={isMiniTeacherOpen}
        onClose={() => setIsMiniTeacherOpen(false)}
        onAction={handleMiniTeacherAction}
        module={module}
        subTopic={{ ...activeSubTopic, content: fetchedLesson?.content || '' }}
        mode={miniTeacherMode}
        progress={progress}
      />
    </div>
  );
}
