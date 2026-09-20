import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDemoReel } from '../context/DemoReelContext';
import { Play, Pause, SkipForward, Square, X, Video, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DemoDirectorHUD() {
  const {
    isRecording,
    isPaused,
    currentScenario,
    currentStepIndex,
    currentStep,
    elapsedSeconds,
    skipToNextStep,
    pauseDemoReel,
    resumeDemoReel,
    stopAndSaveReel,
    cancelDemoReel
  } = useDemoReel();

  if (!isRecording || !currentScenario) return null;

  const totalSteps = currentScenario.steps.length;
  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / totalSteps) * 100));
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.aside 
        role="region"
        aria-label="Demo Reel Director"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-4xl w-[95%] sm:w-auto"
      >
        <div className="bg-slate-900/95 dark:bg-black/95 text-white backdrop-blur-xl border border-rose-500/40 rounded-3xl p-3 sm:p-4 shadow-2xl shadow-rose-950/40 flex flex-col sm:flex-row items-center gap-4">
          
          {/* Left: Recording Status & Timer */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/50 px-3 py-1.5 rounded-2xl">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 ${isPaused ? 'hidden' : ''}`}></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black tracking-widest text-rose-300 uppercase">
                {isPaused ? 'PAUSED' : 'REC'}
              </span>
            </div>

            <div className="font-mono text-sm font-bold text-slate-200">
              {formatTime(elapsedSeconds)} <span className="text-slate-500">/ ~{formatTime(currentScenario.totalDurationSec)}</span>
            </div>
          </div>

          {/* Center: Current Step & Narrative */}
          <div className="flex-1 min-w-[200px] text-center sm:text-left border-y sm:border-y-0 sm:border-x border-slate-700/60 py-2 sm:py-0 px-0 sm:px-4 w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                Step {currentStepIndex + 1}/{totalSteps}
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[240px]">
                {currentStep?.title || currentScenario.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[320px] mt-0.5">
              {currentStep?.subtitle || 'Executing automated demonstration sequence...'}
            </p>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isPaused ? (
              <button
                onClick={resumeDemoReel}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                title="Resume Recording"
              >
                <Play size={15} />
                <span className="hidden md:inline">Resume</span>
              </button>
            ) : (
              <button
                onClick={pauseDemoReel}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                title="Pause Recording"
              >
                <Pause size={15} />
                <span className="hidden md:inline">Pause</span>
              </button>
            )}

            <button
              onClick={skipToNextStep}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 transition-all text-xs font-bold flex items-center gap-1.5"
              title="Skip to Next Step"
            >
              <SkipForward size={15} />
              <span className="hidden md:inline">Next</span>
            </button>

            <button
              onClick={stopAndSaveReel}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              title="Finish & Save Reel"
            >
              <Square size={14} fill="currentColor" />
              <span>Finish Reel</span>
            </button>

            <button
              onClick={cancelDemoReel}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Cancel Demo"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Mini progress line at bottom */}
        <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
