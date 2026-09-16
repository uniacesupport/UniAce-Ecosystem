import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Camera, FileText, Sparkles, HelpCircle, 
  Share2, Download, Sigma, Brain, BookOpen 
} from 'lucide-react';
import { ChatMessage } from '../../types';

interface ChatToolkitSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerImageUpload: () => void;
  onTriggerPdfUpload: () => void;
  onToggleMathPalette: () => void;
  onOpenMiniQuiz: () => void;
  onExportNotes: () => void;
  onOpenSyllabusJumper: () => void;
  activeTopicTitle?: string;
  hasMessages: boolean;
}

export const ChatToolkitSheet: React.FC<ChatToolkitSheetProps> = ({
  isOpen,
  onClose,
  onTriggerImageUpload,
  onTriggerPdfUpload,
  onToggleMathPalette,
  onOpenMiniQuiz,
  onExportNotes,
  onOpenSyllabusJumper,
  activeTopicTitle,
  hasMessages
}) => {
  if (!isOpen) return null;

  const tools = [
    {
      id: 'scan',
      title: 'Scan Homework / Diagram',
      desc: 'Upload photo or diagram for instant OCR & step-by-step visual solution',
      icon: Camera,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      action: () => {
        onTriggerImageUpload();
        onClose();
      }
    },
    {
      id: 'pdf',
      title: 'Upload Syllabus / Textbook PDF',
      desc: 'Ground the AI in your specific lecture slides or textbook chapters',
      icon: FileText,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      action: () => {
        onTriggerPdfUpload();
        onClose();
      }
    },
    {
      id: 'math',
      title: 'Math & Symbol Palette',
      desc: 'Quickly insert integrals, derivatives, Greek symbols, and LaTeX formulas',
      icon: Sigma,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      action: () => {
        onToggleMathPalette();
        onClose();
      }
    },
    {
      id: 'quiz',
      title: '3-Question Diagnostic Quiz',
      desc: `Test your mastery of ${activeTopicTitle || 'the current topic'} right now`,
      icon: HelpCircle,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      action: () => {
        onOpenMiniQuiz();
        onClose();
      }
    },
    {
      id: 'syllabus',
      title: 'Syllabus Unit Navigator',
      desc: 'Switch active course module or sub-topic context immediately',
      icon: BookOpen,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      action: () => {
        onOpenSyllabusJumper();
        onClose();
      }
    },
    {
      id: 'export',
      title: 'Export Structured Study Notes',
      desc: 'Download session solutions and proofs as a Markdown study guide',
      icon: Download,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      disabled: !hasMessages,
      action: () => {
        onExportNotes();
        onClose();
      }
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Academic Study Toolkit
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Select an interactive tool or input mode
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tools Grid */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[70vh] overflow-y-auto">
            {tools.map((tool) => {
              const IconComp = tool.icon;
              return (
                <button
                  key={tool.id}
                  disabled={tool.disabled}
                  onClick={tool.action}
                  className="p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-500/60 text-left transition-all flex flex-col gap-2 group disabled:opacity-40 disabled:pointer-events-none"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tool.color} transition-transform group-hover:scale-105`}>
                    <IconComp size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {tool.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 text-center">
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ChatToolkitSheet;
