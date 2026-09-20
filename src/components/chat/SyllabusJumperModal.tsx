import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Layers, CheckCircle2, ChevronRight, Search, Sparkles } from 'lucide-react';
import { Course, CourseId, UserProgress } from '../../types';

interface SyllabusJumperModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Record<string, Course>;
  activeCourseId: CourseId | null;
  activeModuleTitle?: string;
  activeSubTopicTitle?: string;
  progress?: UserProgress;
  onSelectTopicContext: (courseId: CourseId, moduleTitle: string, subTopicTitle: string, subTopicContent?: string) => void;
}

export const SyllabusJumperModal: React.FC<SyllabusJumperModalProps> = ({
  isOpen,
  onClose,
  courses,
  activeCourseId,
  activeModuleTitle,
  activeSubTopicTitle,
  progress,
  onSelectTopicContext,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<CourseId>(activeCourseId || Object.keys(courses)[0] || '');
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (activeCourseId && courses[activeCourseId]) {
        setSelectedCourseId(activeCourseId);
      } else if (Object.keys(courses).length > 0 && (!selectedCourseId || !courses[selectedCourseId])) {
        setSelectedCourseId(Object.keys(courses)[0] as CourseId);
      }
    }
  }, [isOpen, activeCourseId, courses]);

  if (!isOpen) return null;

  const currentCourse = courses[selectedCourseId] || Object.values(courses)[0];
  const syllabus = currentCourse?.syllabus || [];

  const filteredModules = syllabus.map(mod => {
    const matchingSubTopics = mod.subTopics.filter(sub => 
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...mod,
      subTopics: matchingSubTopics,
      matches: matchingSubTopics.length > 0
    };
  }).filter(mod => mod.matches || mod.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Syllabus Unit Navigator
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Jump tutor context directly to any curriculum topic
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search & Course Selector */}
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 space-y-3">
            {/* Course Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {Object.values(courses).map(c => {
                const isSelected = c.id === selectedCourseId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCourseId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>{c.id}</span>
                    <span className="opacity-70 font-normal truncate max-w-[120px]">{c.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, formulas, or module names..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Units / Subtopics List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredModules.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-medium">No curriculum topics found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredModules.map((module, mIdx) => (
                <div key={module.id || mIdx} className="bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-3 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        Module {mIdx + 1}: {module.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                      {module.subTopics.length} Units
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {module.subTopics.map((sub) => {
                      const isActive = activeCourseId === selectedCourseId && activeSubTopicTitle === sub.title;
                      const masteryScore = progress?.mastery?.[sub.id] ?? 0;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onSelectTopicContext(selectedCourseId, module.title, sub.title, sub.content);
                            onClose();
                          }}
                          className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between group ${
                            isActive 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-xs'
                              : 'bg-white dark:bg-zinc-900 border-slate-200/70 dark:border-zinc-800 hover:border-emerald-500/80 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              {isActive && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                              <span className="text-xs font-semibold truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                {sub.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-12 bg-slate-200 dark:bg-zinc-700 rounded-full h-1 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all" 
                                  style={{ width: `${masteryScore}%` }} 
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                                {masteryScore}%
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Context note */}
          <div className="p-3.5 bg-slate-100/70 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-500" />
              Selecting a topic updates AI study memory and curriculum grounding.
            </span>
            <button 
              onClick={onClose}
              className="px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SyllabusJumperModal;
