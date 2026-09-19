import { Brain, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import QuizGenerator from './QuizGenerator';
import { Module } from '../types';
import { useAuth } from '../context/AuthContext';
import { getModuleIcon } from '../utils/moduleIcons';

interface QuizHubProps {
  courseId?: string;
  onQuizComplete: (topicId: string, score: number) => void;
  syllabus: Module[];
}

export default function QuizHub({ courseId, onQuizComplete, syllabus }: QuizHubProps) {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4 lg:pl-4 xl:pl-0">
          <div className="flex items-center gap-3 text-emerald-500 font-bold uppercase tracking-widest text-xs">
            <Brain size={16} />
            <span>Quiz Center</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Master the Material.
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-lg">
            Select a module to generate a custom quiz. Test your understanding of the course concepts.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {(syllabus || []).map((module, i) => {
            const Icon = getModuleIcon(module.id, module.title, i);
            return (
              <motion.button
                key={module.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedModule(module)}
                className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] text-left hover:border-slate-900 dark:hover:border-white hover:shadow-xl transition-all duration-500 flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white p-5 rounded-2xl group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-500">
                    <Icon size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{module.title}</h3>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">
                      {(module.subTopics || []).length} Topics • Multiple Choice & Fill-in-the-blank
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-500 text-white p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <ArrowRight size={24} />
                </div>
              </motion.button>
            );
          })}
          {(!syllabus || syllabus.length === 0) && (
            <div className="p-8 text-center text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800">
              No modules found for this course.
            </div>
          )}
        </div>

        <div className="bg-slate-900 dark:bg-zinc-900 text-white p-10 rounded-[3rem] space-y-6 border dark:border-zinc-800">
          <h3 className="text-2xl font-bold">Why take quizzes?</h3>
          <ul className="space-y-4 text-slate-400 dark:text-zinc-400">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
              <span>Identify gaps in your understanding of course concepts.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
              <span>Practice solving problems under simulated exam conditions.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
              <span>Reinforce memory through active recall and immediate feedback.</span>
            </li>
          </ul>
        </div>
      </div>

      {selectedModule && (
        <QuizGenerator 
          courseId={courseId}
          module={selectedModule} 
          onClose={() => setSelectedModule(null)} 
          onComplete={(score) => onQuizComplete(selectedModule.id, score)}
          onNextTopic={(() => {
            const currentIndex = syllabus.findIndex(m => m.id === selectedModule.id);
            if (currentIndex < syllabus.length - 1) {
              return () => setSelectedModule(syllabus[currentIndex + 1]);
            }
            return undefined;
          })()}
        />
      )}
    </div>
  );
}
