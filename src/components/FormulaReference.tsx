import { Formula, CourseId } from '../types';
import { motion } from 'motion/react';
import { Book, Search, Copy, Check, GraduationCap, ArrowLeft, Bookmark } from 'lucide-react';
import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../context/AuthContext';

interface FormulaReferenceProps {
  onBack: () => void;
  activeCourseId: CourseId | null;
  formulas: Formula[];
  onBookmark?: (formula: Formula) => void;
}

export default function FormulaReference({ onBack, activeCourseId, formulas, onBookmark }: FormulaReferenceProps) {
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFormulas = formulas.filter(f => 
    f.title.toLowerCase().includes(search.toLowerCase()) || 
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (formula: Formula) => {
    navigator.clipboard.writeText(formula.latex);
    setCopiedId(formula.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-6 lg:pl-4 xl:pl-0">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-500 font-bold uppercase tracking-widest text-xs">
                <Book size={16} />
                <span>Formula Repository</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                The Equation Vault.
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl">
                A centralized repository of every formula and theorem in the {activeCourseId} syllabus.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Search formulas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-0 transition-all shadow-sm font-medium"
              />
            </div>
          </div>
        </header>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['All', ...new Set(formulas.map(f => f.category))].map(cat => (
            <button
              key={cat}
              onClick={() => setSearch(cat === 'All' ? '' : cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                (search === cat || (cat === 'All' && search === ''))
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Formula Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredFormulas.map((formula, i) => (
            <motion.div
              key={formula.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 p-10 rounded-[2.5rem] space-y-8 hover:border-slate-900 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest">
                  {formula.category}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => copyToClipboard(formula)}
                    className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-full"
                    title="Copy LaTeX"
                  >
                    {copiedId === formula.id ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                  {onBookmark && (
                    <button
                      onClick={() => onBookmark(formula)}
                      className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-full"
                      title="Save to Notebook"
                    >
                      <Bookmark size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-950">{formula.title}</h3>
                <div className="p-10 bg-slate-50 rounded-3xl flex items-center justify-center min-h-[160px] border border-slate-100 group-hover:bg-white transition-colors">
                  <div className="text-4xl text-slate-950">
                    <MarkdownRenderer content={`$$${formula.latex}$$`} />
                  </div>
                </div>
                <div className="text-slate-600 text-base leading-relaxed markdown-body">
                  <MarkdownRenderer content={formula.description} />
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Empty State */}
        {filteredFormulas.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="bg-slate-100 p-6 rounded-full w-fit mx-auto text-slate-400">
              <Search size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No formulas found</h3>
            <p className="text-slate-500">Try searching for a different keyword or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
