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
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="lg:pl-4 xl:pl-0">
          <h1 className="text-3xl font-black text-slate-900 mb-2">My Notebook</h1>
          <p className="text-slate-500">Your saved formulas and tricky questions.</p>
        </header>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'formula', 'question'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
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
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bookmark.type === 'formula' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {bookmark.type === 'formula' ? <Calculator size={20} /> : <BookOpen size={20} />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {bookmark.type} • {new Date(bookmark.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveBookmark(bookmark.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="prose prose-slate max-w-none">
                  {bookmark.type === 'formula' ? (
                    <div>
                      <h3 className="font-bold text-lg mb-2">{bookmark.content.title}</h3>
                      <div className="bg-slate-50 p-4 rounded-xl font-mono text-center my-4 overflow-x-auto">
                        <MarkdownRenderer content={`$${bookmark.content.latex}$`} />
                      </div>
                      <div className="text-slate-600">
                        <MarkdownRenderer content={bookmark.content.description} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-lg mb-2">Question</h3>
                      <div className="mb-4">
                        <MarkdownRenderer content={bookmark.content.question} />
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-sm font-bold text-emerald-700 mb-1">Correct Answer:</p>
                        <div className="text-emerald-900">
                          <MarkdownRenderer content={bookmark.content.correctAnswer} />
                        </div>
                      </div>
                      <div className="mt-4 text-slate-600 text-sm italic">
                        <MarkdownRenderer content={bookmark.content.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredBookmarks.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>No bookmarks yet. Save formulas or questions to review them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
