import { useState } from 'react';
import { Bookmark } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, BookOpen, Calculator } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../context/AuthContext';

interface NotebookProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
}

export default function Notebook({ bookmarks, onRemoveBookmark }: NotebookProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'formula' | 'question'>('all');

  const filteredBookmarks = bookmarks.filter(b => filter === 'all' || b.type === filter);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-900 p-3 sm:p-6 lg:p-8 pb-16 transition-colors">
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
        <header className="lg:pl-4 xl:pl-0">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">My Notebook</h1>
          <p className="text-slate-500 dark:text-zinc-400">Your saved formulas and tricky questions.</p>
        </header>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'formula', 'question'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}s
            </button>
          ))}
        </div>

        <div className="grid gap-6">
          <AnimatePresence>
            {filteredBookmarks.map(bookmark => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bookmark.type === 'formula' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
                      {bookmark.type === 'formula' ? <Calculator size={20} /> : <BookOpen size={20} />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      {bookmark.type} • {new Date(bookmark.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveBookmark(bookmark.id)}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                    title="Remove from notebook"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="max-w-none">
                  {bookmark.type === 'formula' ? (
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{bookmark.content.title}</h3>
                      <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl font-mono text-center my-4 overflow-x-auto text-slate-900 dark:text-zinc-100">
                        <MarkdownRenderer content={`$${bookmark.content.latex}$`} />
                      </div>
                      <div className="text-slate-600 dark:text-zinc-300">
                        <MarkdownRenderer content={bookmark.content.description} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Question</h3>
                      <div className="mb-4 text-slate-800 dark:text-zinc-200">
                        <MarkdownRenderer content={bookmark.content.question} />
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-1">Correct Answer:</p>
                        <div className="text-emerald-900 dark:text-emerald-200">
                          <MarkdownRenderer content={bookmark.content.correctAnswer} />
                        </div>
                      </div>
                      <div className="mt-4 text-slate-600 dark:text-zinc-400 text-sm italic">
                        <MarkdownRenderer content={bookmark.content.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredBookmarks.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-zinc-500">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>No bookmarks yet. Save formulas or questions to review them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
