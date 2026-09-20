import { useState } from 'react';
import { ArrowRight, GraduationCap, ArrowLeft, Wand2, Lock, Book, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { Module, CourseId } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { LogService } from '../services/logService';
import { getModuleIcon, getCleanModuleTitle } from '../utils/moduleIcons';

interface CourseSyllabusProps {
  onModuleSelect: (moduleId: string) => void;
  onBack: () => void;
  onViewSelect?: (view: any) => void;
  activeCourseId: CourseId | null;
  syllabus: Module[];
  objectives?: string[];
  isEnrolled: boolean;
  onEnroll: () => void;
  onUnenroll?: () => void;
  onRegenerate?: () => void;
  regenerationProgress?: number;
  regenerationStatus?: string;
}

export default function CourseSyllabus({ 
  onModuleSelect, 
  onBack, 
  onViewSelect,
  activeCourseId, 
  syllabus, 
  objectives = [], 
  isEnrolled, 
  onEnroll, 
  onUnenroll,
  onRegenerate,
  regenerationProgress = 0,
  regenerationStatus = ''
}: CourseSyllabusProps) {
  const { user, signInWithGoogle, profile } = useAuth();
  const { isPremium } = usePremiumStatus();
  const isAdmin = profile?.role === 'admin' || (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').includes(user?.email || '');
  const isLocked = !isPremium && !isAdmin;
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950 p-3 sm:p-6 lg:p-8 pb-16 transition-colors">
      <div className="w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <header className="space-y-4 sm:space-y-6 lg:pl-4 xl:pl-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
            {isAdmin && onRegenerate && (
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={onRegenerate}
                  disabled={regenerationProgress > 0 && regenerationProgress < 100}
                  className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition-colors text-sm ${
                    regenerationProgress > 0 && regenerationProgress < 100
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200'
                  }`}
                >
                  <Wand2 size={16} className={regenerationProgress > 0 && regenerationProgress < 100 ? 'animate-spin' : ''} />
                  {regenerationProgress > 0 && regenerationProgress < 100 ? 'Regenerating...' : 'Regenerate Syllabus'}
                </button>
                {regenerationProgress > 0 && (
                  <div className="w-48 sm:w-64 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      <span>{regenerationStatus}</span>
                      <span>{Math.round(regenerationProgress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${regenerationProgress}%` }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 text-emerald-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                <GraduationCap size={16} />
                <span>Full Course Syllabus</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {activeCourseId} Syllabus.
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 text-base sm:text-lg max-w-2xl">
                A comprehensive breakdown of the course modules. Select a module to explore its topics and start studying.
              </p>
            </div>
            
            <div className="shrink-0">
              {isEnrolled ? (
                <button
                  onClick={() => {
                    if (onUnenroll) {
                      setShowUnenrollConfirm(true);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 font-bold border border-emerald-200 dark:border-emerald-800 hover:border-red-200 dark:hover:border-red-800 transition-colors group"
                >
                  <Activity size={20} className="group-hover:hidden" />
                  <span className="group-hover:hidden">Enrolled</span>
                  <span className="hidden group-hover:inline">Unenroll</span>
                </button>
              ) : (
                <button
                  onClick={onEnroll}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95"
                >
                  <Book size={20} />
                  <span>Enroll Now</span>
                </button>
              )}
            </div>
          </div>
        </header>


        {/* Course Modules Grid */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {(syllabus || []).map((module, i) => {
              const Icon = getModuleIcon(module.id, module.title, i);
              const isLockedModule = false; // Modules are no longer locked, only subtopics are locked
              return (
                <motion.button
                  key={module.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    if (isLockedModule && onViewSelect) {
                      LogService.log('info', 'user', 'locked_feature_click', { feature: 'module', moduleId: module.id, userId: user?.uid });
                      onViewSelect('pricing');
                      return;
                    }
                    if (isEnrolled) {
                      onModuleSelect(module.id);
                    } else {
                      onEnroll();
                    }
                  }}
                  className={`group relative flex flex-col h-full bg-white dark:bg-blue-900 border p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-left transition-all duration-500 overflow-hidden ${
                    isEnrolled 
                      ? 'border-slate-200 dark:border-blue-800 hover:border-slate-900 dark:hover:border-blue-400 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-blue-950/50 cursor-pointer' 
                      : 'border-slate-100 dark:border-blue-800/50 opacity-70 hover:opacity-100 cursor-not-allowed'
                  } ${isLockedModule ? 'opacity-70 grayscale-[0.5]' : ''}`}
                >
                  <div className="relative z-10 flex flex-col h-full w-full">
                    <div className={`text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit transition-colors duration-500 mb-4 sm:mb-6 ${
                      isEnrolled && !isLockedModule ? 'bg-slate-900 dark:bg-blue-950 group-hover:bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'
                    }`}>
                      {isLockedModule ? <Lock size={20} className="sm:w-6 sm:h-6" /> : <Icon size={20} className="sm:w-6 sm:h-6" />}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 break-words leading-tight pr-4">{module.title}</h3>
                      <p className="text-slate-500 dark:text-blue-300 text-xs sm:text-sm leading-relaxed mb-6 flex-1">
                        Explore {(module?.subTopics || []).length} key topics including {(module?.subTopics?.[0]?.title || 'core concepts').toLowerCase()}.
                      </p>
                      <div className={`flex items-center gap-2 font-bold text-xs sm:text-sm mt-auto ${
                        isEnrolled && !isLockedModule ? 'text-slate-900 dark:text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        <span>{isLockedModule ? 'Upgrade to Unlock' : isEnrolled ? 'Explore Module' : 'Locked'}</span>
                        {isEnrolled && !isLockedModule && <ArrowRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />}
                        {isLockedModule && <Lock size={14} className="text-amber-500" />}
                      </div>
                    </div>
                  </div>
                  {/* Decorative background element */}
                  <div className="absolute -right-4 -bottom-4 text-slate-50 dark:text-blue-950 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                    <Icon size={120} className="sm:w-40 sm:h-40" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Syllabus Summary */}
        <section className="bg-slate-900 dark:bg-blue-900 text-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] space-y-6 sm:space-y-8 border dark:border-blue-800">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold">Course Objectives</h3>
            <p className="text-slate-400 dark:text-blue-200 text-sm sm:text-base">By the end of this course, students should be able to:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {(objectives || []).map((objective, index) => (
              <div key={index} className="flex gap-4">
                <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg h-fit">
                  <GraduationCap size={20} />
                </div>
                <p className="text-slate-300 dark:text-blue-100 text-sm">{objective}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Unenroll Confirmation Modal */}
      {showUnenrollConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-zinc-800"
          >
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Unenroll Course?</h3>
            <p className="text-slate-600 dark:text-zinc-400 mb-8">
              Are you sure you want to unenroll from this course? Your progress will be saved, but the course will be removed from your dashboard.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowUnenrollConfirm(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUnenrollConfirm(false);
                  if (onUnenroll) onUnenroll();
                }}
                className="px-6 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/30"
              >
                Unenroll
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
