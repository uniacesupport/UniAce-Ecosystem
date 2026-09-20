import { useState, useEffect } from 'react';
import { Module } from '../types';
import { BrainCircuit, Book, ArrowRight, PlayCircle, Flame, Target, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import Flashcards from './Flashcards';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useUserProgress } from '../hooks/useUserProgress';

interface FlashcardHubProps {
  syllabus: Module[];
}

export default function FlashcardHub({ syllabus }: FlashcardHubProps) {
  const { user } = useAuth();
  const { progress } = useUserProgress();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isGlobalReview, setIsGlobalReview] = useState(false);
  const [stats, setStats] = useState({ learning: 0, mastered: 0, totalDue: 0, streak: 0 });

  const fetchStats = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, `users/${user.uid}/flashcards`));
      const snap = await getDocs(q);
      let learning = 0;
      let mastered = 0;
      let due = 0;
      const now = new Date().toISOString();

      snap.forEach(doc => {
        const card = doc.data();
        if ((card.repetition || 0) > 3) {
          mastered++;
        } else {
          learning++;
        }
        if (!card.nextReviewDate || card.nextReviewDate <= now) {
          due++;
        }
      });
      
      setStats({ learning, mastered, totalDue: due, streak: progress?.streak || 0 });
    } catch (e) {
      console.error("Failed to fetch flashcard stats:", e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-blue-950 p-3 sm:p-6 lg:p-8 pb-16 transition-colors">
      <div className="w-full space-y-8 sm:space-y-12">
        {/* Header */}
        <header className="space-y-4 lg:pl-4 xl:pl-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-purple-500 font-bold uppercase tracking-widest text-xs">
              <BrainCircuit size={16} />
              <span>Spaced Repetition</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Flashcard Hub
            </h1>
            <p className="text-slate-500 dark:text-blue-300 text-lg max-w-2xl mt-4">
              Review key concepts and formulas using spaced repetition to ensure long-term retention.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsGlobalReview(true)}
            className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-3xl font-bold shadow-xl shadow-purple-500/20 transition-colors shrink-0"
          >
            <PlayCircle size={24} />
            <div className="text-left">
              <div className="font-bold leading-tight">Daily Global Review</div>
              <div className="text-xs text-purple-200 font-medium">{stats.totalDue > 0 ? `${stats.totalDue} cards due` : 'All caught up!'}</div>
            </div>
          </motion.button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-3">
               <Flame size={24} />
             </div>
             <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.streak}</div>
             <div className="text-sm font-bold text-slate-500 dark:text-blue-300 uppercase tracking-widest mt-1">Day Streak</div>
          </div>
          <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-3">
               <Target size={24} />
             </div>
             <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalDue}</div>
             <div className="text-sm font-bold text-slate-500 dark:text-blue-300 uppercase tracking-widest mt-1">Due Today</div>
          </div>
          <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mb-3">
               <BrainCircuit size={24} />
             </div>
             <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.learning}</div>
             <div className="text-sm font-bold text-slate-500 dark:text-blue-300 uppercase tracking-widest mt-1">Learning</div>
          </div>
          <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-3">
               <Trophy size={24} />
             </div>
             <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.mastered}</div>
             <div className="text-sm font-bold text-slate-500 dark:text-blue-300 uppercase tracking-widest mt-1">Mastered</div>
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(syllabus || []).map((module, i) => (
            <motion.div
              key={module.id || i}
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
                    {(module.subTopics || []).length} topics to review
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
          {(!syllabus || syllabus.length === 0) && (
            <div className="col-span-full p-8 text-center text-slate-500 dark:text-blue-300 bg-white dark:bg-blue-900 rounded-3xl border border-slate-200 dark:border-blue-800">
              No modules available for flashcards.
            </div>
          )}
        </div>
      </div>

      {(selectedModule || isGlobalReview) && (
        <Flashcards 
          module={selectedModule || undefined}
          isGlobalReview={isGlobalReview} 
          onClose={() => {
            setSelectedModule(null);
            setIsGlobalReview(false);
            fetchStats();
          }} 
        />
      )}
    </div>
  );
}
