import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, Award, BookOpen, CheckCircle2, AlertCircle, Loader2, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AIService } from '../services/ai';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Module, UserProgress } from '../types';

interface AdaptiveRecalibratorModalProps {
  topicId: string;
  score: number;
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  syllabus: Module[];
  onViewStudyPlan?: () => void;
}

export const AdaptiveRecalibratorModal: React.FC<AdaptiveRecalibratorModalProps> = ({
  topicId,
  score,
  isOpen,
  onClose,
  progress,
  syllabus,
  onViewStudyPlan
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'generating' | 'success_booster' | 'fast_track_offer' | 'fast_track_success' | 'no_plan'>('idle');
  const [boosterData, setBoosterData] = useState<{ focus: string; tasks: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topic = syllabus.flatMap(m => m.subTopics).find(st => st.id === topicId);
  const topicTitle = topic?.title || topicId;

  useEffect(() => {
    if (isOpen) {
      evaluatePerformance();
    } else {
      // Reset state on close
      setStep('idle');
      setBoosterData(null);
      setError(null);
    }
  }, [isOpen]);

  const evaluatePerformance = async () => {
    if (!user) return;
    
    try {
      // Check if they have an active study plan first
      const docRef = doc(db, 'study_plans', user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setStep('no_plan');
        return;
      }

      if (score < 60) {
        // Trigger Booster Lesson Injection automatically
        triggerBoosterInjection();
      } else if (score === 100) {
        // Offer Fast Track
        setStep('fast_track_offer');
      } else {
        // Decent score, no major remediation or fast-track needed
        onClose();
      }
    } catch (err) {
      console.error('Error evaluating performance or fetching study plan:', err);
      // Fallback gracefully so we don't block the UI with an unhandled exception
      setError('Could not verify study plan. Please make sure you are online.');
      setStep('no_plan');
    }
  };

  const triggerBoosterInjection = async () => {
    if (!user) return;
    setLoading(true);
    setStep('generating');
    setError(null);

    try {
      const booster = await AIService.generateBoosterLesson(topicTitle, score);
      setBoosterData(booster);

      // Save to active study plan in Firestore
      const docRef = doc(db, 'study_plans', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const activePlan = docSnap.data();
        const updatedSchedule = [
          {
            day: "AI Booster Session",
            focus: booster.focus,
            tasks: booster.tasks
          },
          ...(activePlan.dailySchedule || [])
        ];

        await setDoc(docRef, {
          ...activePlan,
          dailySchedule: updatedSchedule,
          tips: [
            `Booster Tip: Reinforce "${topicTitle}" foundations before proceeding to next modules.`,
            ...(activePlan.tips || [])
          ]
        });
        setStep('success_booster');
      } else {
        setStep('no_plan');
      }
    } catch (err) {
      console.error('Booster Injection failed:', err);
      setError('Failed to generate booster lesson. Your plan remains intact.');
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const acceptFastTrack = async () => {
    if (!user || !progress || !syllabus) return;
    setLoading(true);
    setError(null);

    try {
      const advancedPlan = await AIService.generateFastTrackPlan(progress, syllabus, topicTitle);
      
      // Save updated fast-track plan in Firestore
      const docRef = doc(db, 'study_plans', user.uid);
      await setDoc(docRef, advancedPlan);
      
      setStep('fast_track_success');
    } catch (err) {
      console.error('Fast-track generation failed:', err);
      setError('Failed to transition to advanced track. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 flex flex-col p-8"
        >
          {step === 'generating' && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
                <Cpu size={32} className="animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Analyzing Weak Spots...</h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
                  We noticed a mastery score of <span className="font-bold text-red-500">{score}%</span> on <span className="font-semibold text-slate-800 dark:text-slate-200">"{topicTitle}"</span>. The AI is dynamically engineering a custom foundational booster lesson to update your active Study Plan.
                </p>
              </div>
            </div>
          )}

          {step === 'success_booster' && boosterData && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Study Plan Recalibrated!</h3>
                  <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Booster Lesson Injected</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">{boosterData.focus}</span>
                </div>
                <ul className="space-y-3">
                  {(boosterData?.tasks || []).map((task, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-400 font-medium">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed text-center">
                This personalized booster session has been seamlessly inserted at the top of your **AI Study Plan** on your dashboard to help reinforce your understanding before you tackle tougher modules.
              </p>

              <button
                onClick={() => {
                  if (onViewStudyPlan) {
                    onViewStudyPlan();
                  } else {
                    onClose();
                  }
                }}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-slate-100 dark:shadow-none"
              >
                VIEW STUDY PLAN
              </button>
            </div>
          )}

          {step === 'fast_track_offer' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-100 dark:shadow-none">
                  <Award size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Perfect Mastery Unlocked! 🏆</h3>
                  <p className="text-slate-500 dark:text-zinc-400 text-sm">
                    Amazing job! You scored a flawless <span className="font-bold text-emerald-500">100%</span> on <span className="font-semibold text-slate-800 dark:text-slate-200">"{topicTitle}"</span>.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 text-center space-y-3">
                <h4 className="font-black text-slate-800 dark:text-zinc-200 text-sm">Fast-Track Academic Offer</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Would you like the AI Study Architect to dynamically recalibrate your entire Study Plan? We will fast-track you past basic introductory lessons and inject challenging, advanced topics to keep your learning curve optimized!
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Keep Current Plan
                </button>
                <button
                  onClick={acceptFastTrack}
                  disabled={loading}
                  className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} fill="currentColor" />
                      YES, FAST-TRACK ME!
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'fast_track_success' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
                <Sparkles size={32} fill="currentColor" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Academic Path Advanced!</h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
                  Your AI Study Architect has successfully fast-tracked your plan. Introductory modules for <span className="font-semibold text-slate-800 dark:text-slate-200">"{topicTitle}"</span> have been replaced with advanced tracks and high-intensity exercises!
                </p>
              </div>

              <button
                onClick={() => {
                  if (onViewStudyPlan) {
                    onViewStudyPlan();
                  } else {
                    onClose();
                  }
                }}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform shadow-lg"
              >
                VIEW NEW STUDY PLAN
              </button>
            </div>
          )}

          {step === 'no_plan' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-3xl flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">No Active Study Plan Found</h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
                  We evaluated your score, but you haven't generated your personalized Study Plan yet. Go to the **AI Study Plan** view on your dashboard to initialize your core schedule!
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform"
              >
                GOT IT
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
