import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, GraduationCap, ArrowRight, Sparkles, Atom, FlaskConical, Globe, Code, ChevronDown, Dna, Settings, Bird, Lock } from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { CourseId, View, Subject } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { LogService } from '../services/logService';
import NotificationCenter from './NotificationCenter';

interface CourseHubProps {
  activeSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  onSelectCourse: (id: CourseId) => void;
  onProfileClick: () => void;
  onViewSelect: (view: View) => void;
  enrolledCourses: CourseId[];
}

const SUBJECTS: Record<Subject, { icon: any, color: string, textClass: string, bgClass: string, borderClass: string, description: string }> = {
  'Mathematics': { 
    icon: Sparkles, 
    color: 'emerald', 
    textClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-500/30',
    description: 'Calculus, Algebra, and Statistics' 
  },
  'Physics': { 
    icon: Atom, 
    color: 'purple', 
    textClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-600',
    borderClass: 'border-purple-500/30',
    description: 'Mechanics, Optics, and Thermodynamics' 
  },
  'Chemistry': { 
    icon: FlaskConical, 
    color: 'rose', 
    textClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-600',
    borderClass: 'border-rose-500/30',
    description: 'Organic, Inorganic, and Physical' 
  },
  'Biology': { 
    icon: Dna, 
    color: 'emerald', 
    textClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-500/30',
    description: 'Cell Biology, Genetics, and Evolution' 
  },
  'General Studies': { 
    icon: Globe, 
    color: 'blue', 
    textClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-600',
    borderClass: 'border-blue-500/30',
    description: 'GNS 101, 102, and Citizenship' 
  },
  'Computer Science': { 
    icon: Code, 
    color: 'orange', 
    textClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-600',
    borderClass: 'border-orange-500/30',
    description: 'Programming, Algorithms, and Data' 
  },
  'General Engineering Training': { 
    icon: Settings, 
    color: 'slate', 
    textClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-600',
    borderClass: 'border-slate-500/30',
    description: 'Statics, Dynamics, and Graphics' 
  },
  'Zoology': { 
    icon: Bird, 
    color: 'emerald', 
    textClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-500/30',
    description: 'Animal Diversity and Physiology' 
  }
};

export default function CourseHub({ activeSubject, onSubjectChange, onSelectCourse, onProfileClick, onViewSelect, enrolledCourses }: CourseHubProps) {
  const { user, profile, isConfigured, signInWithGoogle } = useAuth();
  const { courses } = useCourses();
  const { isPremium } = usePremiumStatus();
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  const isLocked = !isPremium && !isAdmin;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentSubject = SUBJECTS[activeSubject];
  const activeEnrolledCourses = enrolledCourses.filter(id => courses[id]?.subject === activeSubject);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col p-4 sm:p-6 lg:p-12 pb-24 lg:pb-16 relative overflow-x-hidden overflow-y-auto transition-colors">
      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white p-2 text-center text-xs font-bold z-50 shadow-lg">
          Firebase is not configured. Please set the VITE_FIREBASE_* environment variables.
        </div>
      )}
      {/* Header */}
      <header className="flex items-center justify-between w-full max-w-7xl mx-auto mb-12 sm:mb-16 relative z-30 lg:pl-4 xl:pl-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            🎓 Welcome back, {user?.displayName?.split(' ')[0] || 'Scholar'}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 font-medium">
            Ready to continue your journey?
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {!isAdmin && (
            <>
              {isLocked ? (
                <button 
                  onClick={() => onViewSelect('pricing')}
                  className="text-emerald-500 font-bold text-[10px] sm:text-sm tracking-widest hover:text-emerald-600 transition-colors"
                >
                  ACTIVATE
                </button>
              ) : null}
            </>
          )}
          
          <NotificationCenter />
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-2 sm:gap-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 pr-3 sm:p-2 sm:pr-4 rounded-full shadow-sm border border-slate-200 dark:border-zinc-800 hover:scale-105 transition-transform"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm bg-blue-100 dark:bg-blue-900/30">
              <img 
                src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200 hidden xs:block">
              {user?.displayName?.split(' ')[0] || 'Scholar'}
            </span>
          </button>
        </div>
      </header>

      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -left-24 w-64 h-64 sm:w-96 sm:h-96 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-10 sm:mb-12 relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 border border-slate-800 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-6 sm:mb-8 relative z-20"
        >
          <Sparkles size={10} className="text-amber-400 animate-pulse" />
          <span>UniAce Ecosystem</span>
        </motion.div>
        
        <div className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 sm:mb-8 tracking-tighter leading-tight sm:leading-none flex flex-col items-center gap-2 sm:gap-4">
          <h1>Master Your</h1>
          <div className="relative inline-block group z-30">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-2 border-dashed ${currentSubject.borderClass} hover:border-current transition-all cursor-pointer group-hover:scale-105`}
              style={{ color: 'inherit' }}
            >
              <span className={`text-2xl sm:text-5xl md:text-7xl font-black ${currentSubject.textClass}`}>
                {activeSubject}
              </span>
              <ChevronDown size={24} className={`${currentSubject.textClass} transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 sm:w-72 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-2 sm:p-3 z-40 text-left"
                >
                  <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-2">Switch Subject</p>
                  {Object.keys(SUBJECTS).map((subject) => {
                    const s = subject as Subject;
                    const Icon = SUBJECTS[s].icon;
                    const sub = SUBJECTS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          onSubjectChange(s);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all ${
                          activeSubject === s 
                            ? `bg-slate-100 dark:bg-slate-800 ${sub.textClass} font-bold` 
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${activeSubject === s ? `bg-white dark:bg-slate-700 shadow-sm` : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <Icon size={16} className={sub.textClass} />
                        </div>
                        <span className="text-sm">{s}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <p className="text-slate-500 dark:text-blue-300 max-w-xl mx-auto text-base sm:text-lg md:text-xl font-medium leading-relaxed px-4">
          {currentSubject.description}. <br className="hidden sm:block" />
          Select a course below to begin your journey.
        </p>
      </motion.div>

      {/* Subject Quick Bar */}
      <div className="w-full max-w-4xl px-4 mb-10 sm:mb-14 relative z-20 mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex gap-2 mx-auto">
            {Object.keys(SUBJECTS).map((subject) => {
              const s = subject as Subject;
              const isActive = activeSubject === s;
              const sub = SUBJECTS[s];
              return (
                <button
                  key={s}
                  onClick={() => onSubjectChange(s)}
                  className={`whitespace-nowrap px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all border ${
                    isActive 
                      ? `${sub.bgClass} border-transparent text-white shadow-lg shadow-slate-200 dark:shadow-none scale-105` 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeEnrolledCourses.length > 0 && (
        <div className="max-w-7xl w-full px-4 mx-auto mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <BookOpen size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Enrolled Courses</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeEnrolledCourses.map((courseId, index) => {
              const course = courses[courseId];
              if (!course) return null;
              return (
                <motion.button
                  key={`enrolled-${course.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onSelectCourse(course.id as CourseId)}
                  className="group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border-2 border-emerald-500/20 dark:border-emerald-500/10 text-left hover:border-emerald-500 transition-all hover:shadow-2xl hover:shadow-emerald-100/50 dark:hover:shadow-none flex flex-col h-full"
                >
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 dark:text-zinc-400 mb-6 line-clamp-2 text-sm flex-grow">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                      Continue Learning
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-7xl w-full px-4 mx-auto mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Explore {activeSubject}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full px-4 mx-auto">
        {Object.values(courses).filter(c => c.subject === activeSubject).length > 0 ? (
          Object.values(courses).filter(c => c.subject === activeSubject).map((course, index) => {
            const isEnrolled = enrolledCourses.includes(course.id as CourseId);
            return (
              <motion.button
                key={course.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  if (isLocked && index > 2) {
                    LogService.log('info', 'user', 'locked_feature_click', { feature: 'course', courseId: course.id, userId: user?.uid });
                    onViewSelect('pricing');
                    return;
                  }
                  onSelectCourse(course.id as CourseId);
                }}
                className={`group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-zinc-800 text-left hover:border-emerald-500 dark:hover:border-emerald-400 transition-all hover:shadow-2xl hover:shadow-emerald-100/50 dark:hover:shadow-none flex flex-col h-full ${isLocked && index > 2 ? 'opacity-70 grayscale-[0.5] cursor-not-allowed' : ''}`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-colors relative ${
                  course.id.startsWith('MAT') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 
                  course.id.startsWith('STA') ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white' :
                  course.id.startsWith('BIO') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white' :
                  course.id.startsWith('PHY') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white' :
                  course.id.startsWith('CHM') ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white' :
                  course.id.startsWith('COS') ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white' :
                  course.id.startsWith('GST') ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white' :
                  course.id.startsWith('GET') ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 group-hover:bg-slate-600 group-hover:text-white' :
                  course.id.startsWith('ZOO') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white' :
                  'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 group-hover:bg-slate-600 group-hover:text-white'
                }`}>
                {isLocked && index > 2 ? <Lock size={24} className="sm:w-7 sm:h-7" /> : (
                  course.id.startsWith('MAT') ? <BookOpen size={24} className="sm:w-7 sm:h-7" /> : 
                  course.id.startsWith('STA') ? <Sparkles size={24} className="sm:w-7 sm:h-7" /> :
                  course.id.startsWith('BIO') ? <Dna size={24} className="sm:w-7 sm:h-7" /> :
                  course.id.startsWith('PHY') ? <Atom size={24} className="sm:w-7 sm:h-7" /> :
                  course.id.startsWith('CHM') ? <FlaskConical size={24} className="sm:w-7 sm:h-7" /> :
                  course.id.startsWith('COS') ? <Code size={24} className="sm:w-7 sm:h-7" /> :
                  course.id.startsWith('GST') ? <Globe size={24} className="sm:w-7 sm:h-7" /> :
                  course.id.startsWith('GET') ? <Settings size={24} className="sm:w-7 sm:h-7" /> :
                  course.id.startsWith('ZOO') ? <Bird size={24} className="sm:w-7 sm:h-7" /> :
                  <GraduationCap size={24} className="sm:w-7 sm:h-7" />
                )}
                
                {(['STA112', 'BIO101', 'BIO102', 'BIO107', 'BIO108', 'PHY101', 'PHY102', 'PHY107', 'PHY108', 'CHM101', 'CHM102', 'CHM107', 'CHM108', 'COS101', 'COS102', 'GST111', 'GST112', 'GET101', 'GET102', 'ZOO101', 'ZOO102'].includes(course.id)) && (
                  <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                    NEW
                  </div>
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {course.title}
              </h2>
              <p className="text-slate-500 dark:text-blue-300 mb-8 line-clamp-2 flex-grow">
                {course.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className={`text-sm font-bold uppercase tracking-widest ${isEnrolled ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500'}`}>
                  {isLocked && index > 2 ? 'Locked' : (isEnrolled ? 'Continue Learning' : 'Enroll Now')}
                </span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isEnrolled ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 dark:bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                  {isLocked && index > 2 ? <Lock size={20} /> : <ArrowRight size={20} />}
                </div>
              </div>
            </motion.button>
          )})
        ) : (
          <div className="col-span-full text-center py-20">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-12 inline-block">
              <div className={`w-20 h-20 mx-auto bg-${SUBJECTS[activeSubject].color}-100 rounded-full flex items-center justify-center mb-6 text-${SUBJECTS[activeSubject].color}-600`}>
                {React.createElement(SUBJECTS[activeSubject].icon, { size: 40 })}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {activeSubject} Module Coming Soon
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                We are currently crafting the ultimate learning experience for {activeSubject}. 
                Check back later for updates!
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-16 text-slate-400 dark:text-blue-400 text-sm font-medium text-center w-full">
        Powered by UniAce Ecosystem 2.0
      </footer>
    </div>
  );
}
