import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Building2, Layers, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Department, Level, Semester } from '../types';
import { useInstitution } from '../context/InstitutionContext';

const LEVELS: Level[] = ['100', '200', '300', '400', '500'];
const SEMESTERS: Semester[] = ['1st Semester', '2nd Semester'];

export default function AcademicProfileModal({ onClose }: { onClose?: () => void }) {
  const { departments: DEPARTMENTS } = useInstitution();
  const { profile, updateProfileData } = useAuth();
  const [department, setDepartment] = useState<Department | ''>((profile?.department as Department) || '');
  const [level, setLevel] = useState<Level | ''>((profile?.academic_level as Level) || '');
  const [semester, setSemester] = useState<Semester | ''>((profile?.semester as Semester) || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !level || !semester) return;

    setIsSubmitting(true);
    try {
      await updateProfileData({
        department,
        academic_level: level,
        semester
      });
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to update academic profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-zinc-800 relative"
      >
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-zinc-800 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
        <div className="p-8 text-center max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Academic Profile</h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8">Let's personalize your learning experience</p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <Building2 size={16} className="text-slate-400" />
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                required
                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all appearance-none"
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <Layers size={16} className="text-slate-400" />
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Level)}
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all appearance-none"
                >
                  <option value="" disabled>Select Level</option>
                  {LEVELS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as Semester)}
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all appearance-none"
                >
                  <option value="" disabled>Select Semester</option>
                  {SEMESTERS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !department || !level || !semester}
              className="w-full mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
