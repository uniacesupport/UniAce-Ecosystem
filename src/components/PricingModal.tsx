import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Lock, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onUpgradeClick: () => void;
  type?: 'hard-stop' | 'volume-stop' | 'default';
}

export default function PricingModal({ isOpen, onClose, featureName, onUpgradeClick, type = 'default' }: PricingModalProps) {
  const isVolumeStop = type === 'volume-stop';
  const isHardStop = type === 'hard-stop';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isHardStop ? undefined : onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className={`relative p-8 text-center overflow-hidden ${isVolumeStop ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              {!isHardStop && (
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-2 rounded-full"
                >
                  <X size={20} />
                </button>
              )}
              
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner border border-white/30">
                {isVolumeStop ? <Zap className="text-white" size={32} /> : <Lock className="text-white" size={32} />}
              </div>
              
              <h2 className="text-2xl font-black text-white mb-2">
                {isVolumeStop ? 'Not enough Sparks!' : `Unlock ${featureName ? featureName : 'Premium Features'}`}
              </h2>
              <p className="text-white/90 font-medium">
                {isVolumeStop 
                  ? 'Get an Emergency Top-Up to continue your deep analysis.' 
                  : 'Upgrade to Scholar to access this feature and ace your exams.'}
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-4 mb-8">
                {(isVolumeStop ? [
                  '500 AI Sparks Instantly',
                  'Continue your current analysis',
                  'No subscription required',
                  'Exam Readiness Prediction',
                  'Enhanced Precision Logic'
                ] : [
                  'Unlimited AI Tutor Chat',
                  'Full Access to All Lecture Notes',
                  '15-Question AI Quizzes',
                  'AI Step-by-Step Past Question Solutions',
                  'Unlimited Flashcard Generation',
                  'Enhanced Precision Logic',
                  'Distraction-Free Focus Mode'
                ]).map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`${isVolumeStop ? 'bg-amber-100' : 'bg-emerald-100'} p-1 rounded-full`}>
                      <CheckCircle2 size={16} className={isVolumeStop ? 'text-amber-600' : 'text-emerald-600'} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  onClose();
                  onUpgradeClick();
                }}
                className={`w-full py-4 ${isVolumeStop ? 'bg-amber-500' : 'bg-slate-900'} text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-lg`}
              >
                {isVolumeStop ? <Zap size={20} fill="currentColor" /> : <Sparkles size={20} className="text-amber-400" />}
                {isVolumeStop ? 'Get Emergency Top-Up' : 'View Scholar Plans'}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform opacity-70" />
              </button>
              
              <p className="text-center text-xs text-slate-500 dark:text-zinc-500 mt-4 font-medium">
                {isVolumeStop ? 'Only ₦500 for 500 Sparks' : 'Plans start at just ₦1,500 / 30 Days.'}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
