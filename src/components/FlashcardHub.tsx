import { useState } from 'react';
import { Module } from '../types';
import { BrainCircuit, Book, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import Flashcards from './Flashcards';
import { useAuth } from '../context/AuthContext';

interface FlashcardHubProps {
  syllabus: Module[];
}

export default function FlashcardHub({ syllabus }: FlashcardHubProps) {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-blue-950 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-4 lg:pl-4 xl:pl-0">
          <div className="flex items-center gap-3 text-purple-500 font-bold uppercase tracking-widest text-xs">
            <BrainCircuit size={16} />
            <span>Spaced Repetition</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Flashcard Hub
          </h1>
          <p className="text-slate-500 dark:text-blue-300 text-lg max-w-2xl">
            Review key concepts and formulas using spaced repetition to ensure long-term retention.
          </p>
        </header>

        {/* Module Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {syllabus.map((module, i) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 rounded-3xl p-6 hover:shadow-xl hover:border-purple-500 transition-all duration-300 group flex flex-col h-full"
            >
              <div className="flex-1 space-y-4">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Book size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                    {module.title}
                  </h3>
                  <p className="text-slate-500 dark:text-blue-300 text-sm line-clamp-2">
                    {module.subTopics.length} topics to review
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedModule(module)}
                className="mt-6 w-full py-4 bg-slate-50 dark:bg-blue-950 text-slate-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-purple-500 group-hover:text-white transition-colors"
              >
                Start Review
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedModule && (
        <Flashcards 
          module={selectedModule} 
          onClose={() => setSelectedModule(null)} 
        />
      )}
    </div>
  );
}
