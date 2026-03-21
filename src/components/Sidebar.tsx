import { LogService } from '../services/logService';
import { Module, View, CourseId } from '../types';
import { LayoutGrid, Book, Layers, Activity, GraduationCap, X, ChevronLeft, FileText, Brain, Home, Award, Calculator, Bot, Grid, LogIn, LogOut, User as UserIcon, BookOpen, Zap, BrainCircuit, Trophy, Settings, Maximize2, Calendar, Share2, Swords, Sun, Moon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProgress } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface SidebarProps {
  activeModuleId: string;
  onModuleSelect: (id: string) => void;
  activeView: View | 'pricing';
  onViewSelect: (view: View | 'pricing') => void;
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  activeCourseId: CourseId | null;
  syllabus: Module[];
  isOnline: boolean;
}

const MODULE_ICONS: Record<string, any> = {
  vectors: Book,
  geometry: Layers,
  motion: Activity,
};

const THEME_COLORS: Record<string, { bg: string, text: string, bgHover: string, bgLight: string, shadow: string }> = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-400', bgHover: 'hover:bg-blue-600', bgLight: 'bg-blue-500/20', shadow: 'shadow-blue-500/20' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', bgHover: 'hover:bg-emerald-600', bgLight: 'bg-emerald-500/20', shadow: 'shadow-emerald-500/20' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-400', bgHover: 'hover:bg-purple-600', bgLight: 'bg-purple-500/20', shadow: 'shadow-purple-500/20' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-400', bgHover: 'hover:bg-rose-600', bgLight: 'bg-rose-500/20', shadow: 'shadow-rose-500/20' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-400', bgHover: 'hover:bg-amber-600', bgLight: 'bg-amber-500/20', shadow: 'shadow-amber-500/20' }
};

export default function Sidebar({ 
  activeModuleId, 
  onModuleSelect, 
  activeView, 
  onViewSelect, 
  isOpen, 
  onClose,
  progress,
  activeCourseId,
  syllabus,
  isOnline
}: SidebarProps) {
  const { user, profile, signInWithGoogle, logout } = useAuth();
  const { theme: appTheme, toggleTheme } = useTheme();
  const { isPremium, isTrialActive } = usePremiumStatus();
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  const sparks = profile?.ai_sparks ?? null;
  const isLocked = !isPremium && !isAdmin;
  const theme = THEME_COLORS[profile?.themeColor || 'emerald'] || THEME_COLORS.emerald;

  const handleLockedFeatureClick = (featureName: string) => {
    LogService.log('info', 'user', 'locked_feature_click', { feature: featureName, userId: user?.uid });
    onViewSelect('pricing');
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative w-72 bg-slate-900 dark:bg-zinc-950 text-white flex flex-col h-full border-r border-slate-800 dark:border-zinc-900 z-50"
          >
            <div className="p-8 border-b border-slate-800 dark:border-zinc-900 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`${theme.bg} w-10 h-10 rounded-xl shadow-lg ${theme.shadow} flex items-center justify-center text-2xl`}>
                  🎓
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-white leading-none">UniAce Mastery Hub</h1>
                  <p className={`${theme.text} text-[10px] font-bold uppercase tracking-widest mt-1`}>
                    {activeCourseId ? activeCourseId : 'Learning System'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleTheme}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                  title={`Switch to ${appTheme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {appTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors lg:hidden"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
              {/* User Profile Section */}
              {user ? (
                <div className="space-y-3">
                  <div className="bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between border border-zinc-700/50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`} 
                          alt="User" 
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                        {isTrialActive && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded-full">
                            Trial
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate max-w-[7rem]">{user.displayName}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">Student</p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>

                  {/* Sparks Display */}
                  <div className="bg-slate-800/30 rounded-2xl p-3 flex items-center justify-between border border-slate-700/30">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Zap size={16} fill="currentColor" />
                      <span>{sparks !== null ? sparks.toLocaleString() : '...'} Sparks</span>
                    </div>
                    {!isAdmin && (
                      <button 
                        onClick={() => onViewSelect('pricing')}
                        className={`text-xs ${theme.bg} ${theme.bgHover} text-white px-3 py-1.5 rounded-lg font-bold transition-colors`}
                      >
                        Top Up
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="w-full bg-white text-slate-900 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-white/10"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Sign In with Google
                </button>
              )}

              {/* Main Navigation */}
              <div className="space-y-2">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-4 mb-4">
                  Navigation
                </div>
                
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  <button
                    onClick={() => onViewSelect('hub')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                      activeView === 'hub'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Grid size={18} />
                    <span className="text-[10px] font-medium">Hub</span>
                  </button>

                  <button
                    onClick={() => onViewSelect('dashboard')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                      activeView === 'dashboard'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Home size={18} />
                    <span className="text-[10px] font-medium">Dashboard</span>
                  </button>

                  <button
                    onClick={() => onViewSelect('course-syllabus')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                      activeView === 'course-syllabus'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Book size={18} />
                    <span className="text-[10px] font-medium">Syllabus</span>
                  </button>

                  <button
                    onClick={() => isLocked ? handleLockedFeatureClick('mastery') : onViewSelect('mastery')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all relative ${
                      activeView === 'mastery'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Award size={18} />
                    <span className="text-[10px] font-medium">Mastery</span>
                    {isLocked && <Lock size={8} className="absolute top-2 right-2 text-amber-500" />}
                  </button>

                  <button
                    onClick={() => onViewSelect('quizzes')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                      activeView === 'quizzes'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Brain size={18} />
                    <span className="text-[10px] font-medium">Quizzes</span>
                  </button>

                  <button
                    onClick={() => onViewSelect('arena')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                      activeView === 'arena'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Swords size={18} />
                    <span className="text-[10px] font-medium">Arena</span>
                  </button>

                  <button
                    onClick={() => onViewSelect('ai-tutor')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                      activeView === 'ai-tutor'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Bot size={18} />
                    <span className="text-[10px] font-medium">Tutor</span>
                  </button>

                  <button
                    onClick={() => isLocked ? handleLockedFeatureClick('concept-map') : onViewSelect('concept-map')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all relative ${
                      activeView === 'concept-map'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Maximize2 size={18} />
                    <span className="text-[10px] font-medium">Map</span>
                    {isLocked && <Lock size={8} className="absolute top-2 right-2 text-amber-500" />}
                  </button>

                  <button
                    onClick={() => isLocked ? handleLockedFeatureClick('study-plan') : onViewSelect('study-plan')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all relative ${
                      activeView === 'study-plan'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Calendar size={18} />
                    <span className="text-[10px] font-medium">Plan</span>
                    {isLocked && <Lock size={8} className="absolute top-2 right-2 text-amber-500" />}
                  </button>

                  <button
                    onClick={() => onViewSelect('formulas')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                      activeView === 'formulas'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Calculator size={18} />
                    <span className="text-[10px] font-medium">Formulas</span>
                  </button>

                  <button
                    onClick={() => onViewSelect('past-questions')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                      activeView === 'past-questions'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <FileText size={18} />
                    <span className="text-[10px] font-medium">Past Q</span>
                  </button>

                  <button
                    onClick={() => isLocked ? handleLockedFeatureClick('flashcards') : onViewSelect('flashcards')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all relative ${
                      activeView === 'flashcards'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Zap size={18} />
                    <span className="text-[10px] font-medium">Cards</span>
                    {isLocked && <Lock size={8} className="absolute top-2 right-2 text-amber-500" />}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => onViewSelect('admin-dashboard')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all ${
                        activeView === 'admin-dashboard'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Settings size={18} />
                      <span className="text-[10px] font-medium">Admin</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Course Modules */}
              <div className="space-y-1">
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2">
                  Modules
                </div>
                {syllabus.map((module, index) => {
                  const Icon = MODULE_ICONS[module.id] || LayoutGrid;
                  const isActive = activeView === 'study' && activeModuleId === module.id;
                  const isLockedModule = isLocked && index > 0;

                  return (
                    <button
                      key={module.id}
                      onClick={() => isLockedModule ? onViewSelect('pricing') : onModuleSelect(module.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm relative ${
                        isActive
                          ? 'bg-zinc-800 text-white font-semibold'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                      } ${isLockedModule ? 'opacity-60' : ''}`}
                    >
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-zinc-700' : 'bg-zinc-800'}`}>
                        {isLockedModule ? <Lock size={14} className="text-amber-500" /> : <LayoutGrid size={14} />}
                      </div>
                      <span className="text-left leading-tight truncate">
                        {module.title.split('. ')[1]}
                      </span>
                      {isLockedModule && (
                        <div className="absolute right-3">
                          <Lock size={10} className="text-amber-500/50" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 dark:border-zinc-900">
              {!isOnline && (
                <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2 rounded-lg text-xs font-bold text-center">
                  You are offline. Progress saved locally.
                </div>
              )}
              <div className="bg-slate-800/50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-slate-700/30 dark:border-zinc-800/50">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Level {progress.level}</p>
                  <p className={`${theme.text} text-[10px] font-bold`}>{progress.xp % 1000}/1000 XP</p>
                </div>
                <div className="h-1.5 w-full bg-slate-700 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${theme.bg} rounded-full transition-all duration-500`} 
                    style={{ width: `${(progress.xp % 1000) / 10}%` }}
                  />
                </div>
                <p className="text-slate-500 dark:text-zinc-600 text-[10px] mt-2">{progress?.mastery ? Object.keys(progress.mastery).length : 0} Topics Mastered</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
