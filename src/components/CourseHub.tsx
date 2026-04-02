import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Globe, Search, Users, Calendar, ArrowRight, Loader2, Edit2, Clock } from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { CourseId, View, Course, UserProgress, Department, Semester } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import NotificationCenter from './NotificationCenter';
import AcademicProfileModal from './AcademicProfileModal';
import { useDebounce } from 'use-debounce';
import { formatDistanceToNow } from 'date-fns';
import { useAppStore } from '../lib/store';

interface CourseHubProps {
  onSelectCourse: (id: CourseId) => void;
  onProfileClick: () => void;
  onViewSelect: (view: View) => void;
  enrolledCourses: CourseId[];
  progress: UserProgress;
  activeSemester: Semester;
  setActiveSemester: (semester: Semester) => void;
}

type Tab = 'your-courses' | 'explore';

export default function CourseHub({ onSelectCourse, onProfileClick, onViewSelect, enrolledCourses, progress, activeSemester, setActiveSemester }: CourseHubProps) {
  const { user, profile, isConfigured } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();
  const { isPremium } = usePremiumStatus();
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  
  const [activeTab, setActiveTab] = useState<Tab>('your-courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { addLastAccessedCourse } = useAppStore();

  const filteredCourses = useMemo(() => {
    let result = Object.values(courses);

    const normalize = (s: any) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const extractLevel = (lvl: any) => String(lvl || '').match(/\d+/)?.[0] || '';

    // Apply Tab Filter
    if (activeTab === 'your-courses') {
      // Filter by user's active semester
      if (activeSemester) {
        const userSemester = normalize(activeSemester);
        result = result.filter(c => normalize(c.semester) === userSemester);
      }
      
      // Filter by user's level
      if (profile?.academic_level) {
        const userLevel = extractLevel(profile.academic_level);
        result = result.filter(c => {
          const courseLevel = extractLevel(c.level);
          return courseLevel === userLevel;
        });
      }

      result = result.filter(c => enrolledCourses.includes(c.id as CourseId));
    } else if (activeTab === 'explore' && !isAdmin) {
      // Filter by user's department/faculty
      result = result.filter(c => {
        if (c.scope === 'GLOBAL') return true;
        if (c.scope === 'FACULTY') {
          if (profile?.faculty && c.faculties?.includes(profile.faculty)) return true;
          if (profile?.department && c.departments?.includes(profile.department as Department)) return true;
          return false;
        }
        if (c.scope === 'DEPARTMENT') {
          return profile?.department && c.departments?.includes(profile.department as Department);
        }
        return true;
      });
    }

    // Apply Search Filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.departments?.some(d => d.toLowerCase().includes(query)) ||
        c.faculties?.some(f => f.toLowerCase().includes(query)) ||
        c.scope?.toLowerCase().includes(query)
      );
    }

    // Sort: Courses with progress first
    result.sort((a, b) => {
      const aHasProgress = a.syllabus?.some(module => 
        module.subTopics?.some(topic => 
          (progress.mastery?.[`${module.id}-${topic.id}`] || 0) > 0 || 
          progress.topicLastStudied?.[`${module.id}-${topic.id}`]
        )
      );
      const bHasProgress = b.syllabus?.some(module => 
        module.subTopics?.some(topic => 
          (progress.mastery?.[`${module.id}-${topic.id}`] || 0) > 0 || 
          progress.topicLastStudied?.[`${module.id}-${topic.id}`]
        )
      );
      
      if (aHasProgress && !bHasProgress) return -1;
      if (!aHasProgress && bHasProgress) return 1;
      return 0;
    });

    return result;
  }, [courses, activeTab, debouncedSearchQuery, profile, enrolledCourses, progress]);

  if (coursesLoading && Object.keys(courses).length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-slate-900 dark:text-white animate-spin" />
          <p className="text-slate-500 dark:text-zinc-400 font-medium">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col lg:flex-row p-4 sm:p-6 lg:p-12 gap-8 lg:gap-16 relative overflow-x-hidden transition-colors">
      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white p-2 text-center text-xs font-bold z-50 shadow-lg">
          Firebase is not configured. Please set the VITE_FIREBASE_* environment variables.
        </div>
      )}

      {showEditProfile && (
        <AcademicProfileModal onClose={() => setShowEditProfile(false)} />
      )}

      {/* Left Sidebar / Header Area */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-8 relative z-20">
        <div className="sticky top-12 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              {profile?.displayName ? `Hello, ${profile.displayName.split(' ')[0]}!` : 'Welcome back!'}
            </h1>
            
            {profile?.department && profile?.academic_level && profile?.semester ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1.5 rounded-lg text-sm font-bold w-fit">
                    {profile.department}
                  </div>
                  <button 
                    onClick={() => setShowEditProfile(true)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Edit Academic Profile"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1.5 rounded-lg text-sm font-bold w-fit">
                    {profile.academic_level} Level
                  </div>
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1.5 rounded-lg text-sm font-bold w-fit">
                    {activeSemester}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 items-start">
                <p className="text-slate-500 dark:text-zinc-400 font-medium">
                  Set up your academic profile to get personalized courses.
                </p>
                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                >
                  Setup Profile
                </button>
              </div>
            )}
          </div>

          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
            <button 
              onClick={() => setActiveTab('your-courses')}
              className={`flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === 'your-courses' 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl shadow-slate-900/10' 
                  : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Sparkles size={20} className={activeTab === 'your-courses' ? 'text-amber-400' : ''} />
              Your Courses
            </button>
          </nav>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 relative z-20">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                activeTab === 'explore'
                  ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Globe size={16} />
              Explore All
            </button>
            <NotificationCenter />
            <button 
              onClick={onProfileClick}
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm bg-blue-100 dark:bg-blue-900/30 hover:scale-105 transition-transform"
            >
              <img 
                src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {activeTab === 'your-courses' ? 'No curriculum courses found' : 'No courses found'}
            </h3>
            <p className="text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
              {activeTab === 'your-courses' 
                ? `We couldn't find any courses matching your profile (${profile?.department}, ${profile?.academic_level} Level, ${activeSemester}). Check your profile or explore the catalog.`
                : "Try adjusting your search terms to find what you're looking for."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {activeTab === 'your-courses' && (
                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:scale-105 transition-transform"
                >
                  Edit Academic Profile
                </button>
              )}
              <button 
                onClick={() => setActiveTab('explore')}
                className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform"
              >
                Explore All Courses
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col h-full hover:shadow-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                      {course.scope === 'GLOBAL' ? 'Global Course' : 
                       course.scope === 'FACULTY' ? `${course.faculties?.join(', ')} Faculty` :
                       course.departments?.length === 1 ? course.departments[0] : 
                       `${course.departments?.length || 0} Departments`}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                    {course.id}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {course.title}
                </h3>
                
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 flex-grow line-clamp-3">
                  {course.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-zinc-800/50">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400">
                        <Users size={14} />
                        {course.level ? `L ${course.level}` : 'L 100'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400">
                        <Calendar size={14} />
                        {course.semester === '2nd Semester' ? 'Sem 2' : 'Sem 1'}
                      </div>
                    </div>
                    {(() => {
                      const lastStudied = Object.entries(progress.topicLastStudied || {})
                        .filter(([key]) => key.startsWith(course.id))
                        .map(([, date]) => new Date(date))
                        .sort((a, b) => b.getTime() - a.getTime())[0];
                      
                      if (!lastStudied) return null;
                      
                      return (
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Clock size={10} />
                          Last studied {formatDistanceToNow(lastStudied)} ago
                        </div>
                      );
                    })()}
                  </div>
                  
                  <button 
                    onClick={() => {
                      addLastAccessedCourse(course.id);
                      onSelectCourse(course.id as CourseId);
                    }}
                    className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                  >
                    {(() => {
                      const isEnrolled = activeTab === 'your-courses' || enrolledCourses.includes(course.id as CourseId);
                      if (!isEnrolled) return 'Enroll Now';
                      
                      const hasProgress = course.syllabus?.some(module => 
                        module.subTopics?.some(topic => 
                          (progress.mastery?.[`${module.id}-${topic.id}`] || 0) > 0 || 
                          progress.topicLastStudied?.[`${module.id}-${topic.id}`]
                        )
                      );
                      
                      return hasProgress ? 'Continue Learning' : 'Start Learning';
                    })()}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
