import { motion, AnimatePresence } from 'motion/react';
import { X, Bot, Loader2, Sparkles, List } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { useState, useEffect } from 'react';
import { AIService } from '../services/ai';

interface QuickSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  content: string;
}

export default function QuickSummaryModal({ isOpen, onClose, topicTitle, content }: QuickSummaryModalProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const generateSummary = async () => {
      if (!isOpen || !content || summary) return;
      
      setIsGenerating(true);
      setError(null);
      try {
        const prompt = `Generate a highly concise, high-level bullet-point recap of the following academic sub-topic titled "${topicTitle}". 
Limit the summary to 4-5 key takeaways. Make it easy to scan and understand quickly. 
Use Markdown formatting with bullet points.

Content:
${content}`;
        const response = await AIService.generateContent(prompt);
        if (isMounted) {
          setSummary(response);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error generating summary:", err);
          setError("Failed to generate summary. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    generateSummary();

    return () => {
      isMounted = false;
    };
  }, [isOpen, content, topicTitle]); // Note: removing summary from deps to avoid re-triggering if it gets set to null externally, wait no, if it opens again we want to keep it if it's the same topic. Actually, when topic changes, we should reset summary.

  useEffect(() => {
    // Reset summary when topic changes
    setSummary(null);
    setError(null);
  }, [topicTitle]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] pointer-events-auto border border-zinc-200 dark:border-zinc-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <List size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Quick Summary</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Key takeaways for {topicTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 space-y-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="font-medium">Distilling key points...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <button 
                  onClick={() => {
                    setSummary(null);
                    setError(null);
                  }} 
                  className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : summary ? (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <MarkdownRenderer content={summary} />
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
