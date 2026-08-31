import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Loader2, Brain } from 'lucide-react';
import { Module, SubTopic, UserProgress } from '../types';
import { AIService } from '../services/ai';
import MarkdownRenderer from './MarkdownRenderer';
import { sanitizeLatex } from '../services/aiCourseGenerator';
import { useAuth } from '../context/AuthContext';

const stripThinkTags = (text: string) => {
  return text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
};

interface MiniTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: 'simpler' | 'quiz') => void;
  module: Module;
  subTopic: SubTopic;
  mode?: 'default' | 'simpler' | 'quiz' | 'proactive';
  progress?: UserProgress;
}

export default function MiniTeacherModal({ isOpen, onClose, onAction, module, subTopic, mode = 'default', progress }: MiniTeacherModalProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState(mode);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContent('');
      setError(null);
      setActiveMode(mode);
      
      generateLesson(mode);
    } else {
      // Abort any ongoing generation when modal is closed
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen, subTopic.id, mode]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  const generateLesson = async (lessonMode: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    console.log(`[MiniTeacher] Generating lesson. Mode: ${lessonMode}, Topic: ${subTopic.title}`);
    setIsGenerating(true);
    try {
      const stream = AIService.generateMiniLessonStream(
        module, 
        subTopic, 
        'Medium', 
        lessonMode as any, 
        progress?.learningProfile,
        profile?.academic_level,
        profile?.department,
        profile?.displayName,
        signal
      );
      for await (const chunk of stream) {
        if (signal.aborted) break;
        setContent(prev => prev + chunk);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Mini Teacher Error:', err);
      setError(err.message || 'Failed to generate lesson. Please try again.');
    } finally {
      if (!signal.aborted) {
        setIsGenerating(false);
      }
    }
  };

  const handleAction = (newMode: 'simpler' | 'quiz') => {
    if (newMode === 'simpler') {
      AIService.logStruggle(module.id, subTopic.id, module.title, subTopic.title);
    }
    
    if (onAction && activeMode === 'proactive') {
      onAction(newMode);
      return;
    }
    setActiveMode(newMode);
    setContent('');
    generateLesson(newMode);
  };

  const getTitle = () => {
    if (activeMode === 'simpler') return 'Simple Explanation';
    if (activeMode === 'quiz') return 'Practice Quiz';
    if (activeMode === 'proactive') return 'AI Check-In';
    return 'Mini Teacher';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {getTitle()}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {subTopic.title}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div 
              ref={contentRef}
              className="flex-1 overflow-y-auto p-6 scroll-smooth"
            >
              {error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center">
                  {error}
                  <button 
                    onClick={() => generateLesson(activeMode)}
                    className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : content ? (
                <div className="max-w-none">
                  <MarkdownRenderer content={sanitizeLatex(stripThinkTags(content))} />
                  
                  {activeMode === 'proactive' && !isGenerating && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800"
                    >
                      <button 
                        onClick={() => handleAction('simpler')}
                        className="flex-1 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} />
                        Explain Simpler
                      </button>
                      <button 
                        onClick={() => handleAction('quiz')}
                        className="flex-1 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Brain size={16} />
                        Give Me a Quiz
                      </button>
                      <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors font-medium"
                      >
                        I'm Good 👍
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="animate-pulse">Preparing your personalized lesson...</p>
                </div>
              )}
              
              {isGenerating && content && (
                <div className="flex items-center gap-2 text-purple-500 mt-6 text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Teacher is thinking...</span>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
               <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
