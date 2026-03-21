import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, BookOpen, CheckCircle2, Clock, Target, Sparkles, Loader2, ChevronRight, AlertCircle, Download, Share2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { AIService } from '../services/ai';
import LockedFeature from './LockedFeature';
import { Module, UserProgress } from '../types';

interface StudyPlanData {
  title: string;
  overview: string;
  dailySchedule: {
    day: string;
    focus: string;
    tasks: string[];
  }[];
  tips: string[];
}

interface StudyPlanProps {
  progress: UserProgress;
  syllabus: Module[];
}

export default function StudyPlan({ progress, syllabus }: StudyPlanProps) {
  const { user, profile } = useAuth();
  const { isPremium } = usePremiumStatus();
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  const isLocked = !isPremium && !isAdmin;
  
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async () => {
    if (!progress || !syllabus) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await AIService.generateStudyPlan(progress, syllabus);
      setPlan(data);
    } catch (err) {
      console.error('Error generating study plan:', err);
      setError('Failed to generate your personalized plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs">
              <Calendar size={16} />
              <span>Strategic Learning</span>
            </div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">AI Study Architect</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Data-driven study plans tailored to your mastery levels.</p>
          </div>
          
          {!plan && !isLoading && (
            <button
              onClick={() => {
                if (isLocked) {
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'pricing' }));
                  return;
                }
                generatePlan();
              }}
              className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3 relative group"
            >
              <Sparkles size={20} fill="currentColor" />
              GENERATE PLAN
              {isLocked && <Lock size={12} className="absolute -top-1 -right-1 text-amber-500" />}
            </button>
          )}
        </header>

        {isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-12 text-center border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Loader2 size={40} className="animate-spin" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Architecting Your Success...</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">Analyzing your mastery levels, streak data, and syllabus complexity to build the optimal path.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-3xl flex items-center gap-4 text-red-600 dark:text-red-400">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Overview Card */}
            <div className="bg-zinc-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight">{plan.title}</h2>
                <p className="text-zinc-400 font-medium text-lg leading-relaxed max-w-2xl">{plan.overview}</p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Target size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold uppercase">Mastery Focus</span>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Clock size={16} className="text-blue-400" />
                    <span className="text-xs font-bold uppercase">7-Day Sprint</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plan.dailySchedule.map((day, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 shadow-xl hover:shadow-2xl transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-500">{day.day}</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">{day.focus}</h3>
                  <ul className="space-y-3">
                    {day.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Tips Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Expert Strategies</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {plan.tips.map((tip, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <Download size={18} />
                Export PDF
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <Share2 size={18} />
                Share with Tutor
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
