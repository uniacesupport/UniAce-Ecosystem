import React, { useState } from 'react';
import { BookOpen, ChevronDown, Check, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { Course, CourseId, UserProfile } from '../types';
import { isCourseEligibleForUser } from '../utils/courseEligibility';
import { useAppStore } from '../lib/store';
import { formatDistanceToNow } from 'date-fns';

interface CourseContextBarProps {
  courses: Record<string, Course>;
  activeCourseId: CourseId | null;
  onSelectCourse: (courseId: CourseId) => void;
  profile: UserProfile | null;
  activeSemester: string;
  enrolledCourses?: CourseId[];
  titleLabel?: string;
}

export default function CourseContextBar({
  courses,
  activeCourseId,
  onSelectCourse,
  profile,
  activeSemester,
  enrolledCourses = [],
  titleLabel = "Active Course"
}: CourseContextBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { lastAccessedCourses } = useAppStore();

  const activeCourse = activeCourseId ? courses[activeCourseId] : null;

  // Filter program courses using shared eligibility engine
  const availableCourses = Object.values(courses).filter(c => 
    isCourseEligibleForUser(c, profile, activeSemester, enrolledCourses) || enrolledCourses.includes(c.id as CourseId)
  );

  return (
    <div className="relative mb-6">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {titleLabel}
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {activeCourse ? (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400">{activeCourse.id}:</span>
                  <span className="truncate max-w-[280px] sm:max-w-[400px]">{activeCourse.title}</span>
                </>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle size={16} />
                  No Active Course Selected
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition-colors"
          >
            <span>{activeCourse ? 'Switch Course' : 'Select a Course'}</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-full sm:w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden py-2 divide-y divide-slate-100 dark:divide-zinc-800">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Your Program Courses ({availableCourses.length})
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {availableCourses.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                    No active courses found for this level & semester.
                  </div>
                ) : (
                  availableCourses.map((c) => {
                    const isSelected = c.id === activeCourseId;
                    const isRecentlyAccessed = lastAccessedCourses.includes(c.id);

                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectCourse(c.id as CourseId);
                          setIsOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors ${
                          isSelected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-xs font-bold truncate">
                            {c.id}: {c.title}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                            {c.level ? `Level ${c.level}` : 'L100'} • {c.semester || activeSemester}
                            {isRecentlyAccessed && (
                              <span className="text-emerald-500 font-medium ml-1">• Recently Studied</span>
                            )}
                          </span>
                        </div>
                        {isSelected && <Check size={16} className="text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
