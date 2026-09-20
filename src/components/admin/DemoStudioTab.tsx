import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useDemoReel } from '../../context/DemoReelContext';
import { DEMO_SCENARIOS, DemoScenario } from '../../services/demoReelService';
import { 
  Video, Play, Sparkles, Download, Share2, Clock, CheckCircle2, ShieldCheck, 
  Smartphone, Monitor, Eye, Layers, ChevronRight, Zap, RefreshCw, AlertCircle, Film
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DemoStudioTab() {
  const {
    isRecording,
    startDemoReel,
    selectedScenarioId,
    setSelectedScenarioId,
    recordedVideoUrl,
    recordedBlob,
    recordedDuration,
    openPreviewModal,
    downloadReel,
    screenCaptureSupported
  } = useDemoReel();

  const [activeScenarioPreview, setActiveScenarioPreview] = useState<string>('full_ecosystem');
  const [isStarting, setIsStarting] = useState(false);

  const selectedScenario = DEMO_SCENARIOS[activeScenarioPreview] || DEMO_SCENARIOS.full_ecosystem;

  const handleLaunchRecording = async (scenarioId: string) => {
    setIsStarting(true);
    try {
      setSelectedScenarioId(scenarioId);
      const success = await startDemoReel(scenarioId);
      if (!success) {
        setIsStarting(false);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to start demo reel');
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Studio Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-8 sm:p-10 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Film size={200} />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
              <Video size={28} />
            </div>
            <span className="px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-widest">
              Live Demo Reel Engine
            </span>
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={14} /> Zero-Fallback Verified
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            🎬 Social Media & Partnership Demo Studio
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Generate high-definition social media demonstration videos on autopilot. The engine navigates through real university courses, triggers live AI tutor derivations with KaTeX mathematical proofs, and showcases smart quizzes while simultaneously capturing pristine screen recordings.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => handleLaunchRecording(activeScenarioPreview)}
              disabled={isRecording || isStarting}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-2.5 disabled:opacity-50"
            >
              <Play size={18} fill="currentColor" />
              <span>{isRecording ? 'Recording in Progress...' : 'Launch Demo Reel Recording'}</span>
            </button>

            {recordedVideoUrl && (
              <button
                onClick={openPreviewModal}
                className="px-6 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-sm transition-all flex items-center gap-2"
              >
                <Eye size={18} className="text-indigo-400" />
                <span>Review Last Recording ({recordedDuration}s)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Screen Capture Support Warning if in unsupported browser */}
      {!screenCaptureSupported && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0 text-amber-400" />
          <span>
            Note: Screen recording uses the standard browser <code className="bg-amber-950/60 px-1 py-0.5 rounded font-mono">getDisplayMedia</code> API. For the best experience, run in Google Chrome, Chromium, or Microsoft Edge.
          </span>
        </div>
      )}

      {/* Scenarios Deck */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="text-indigo-500" size={22} />
              Pre-Scripted Demo Scenarios
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select a tailored sequence optimized for specific social channels and marketing objectives.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {Object.keys(DEMO_SCENARIOS).length} Scenarios Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(DEMO_SCENARIOS).map((scenario: DemoScenario) => {
            const isSelected = activeScenarioPreview === scenario.id;

            return (
              <div
                key={scenario.id}
                onClick={() => setActiveScenarioPreview(scenario.id)}
                className={`p-6 sm:p-7 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 shadow-xl shadow-indigo-500/10'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar with Duration and Aspect Ratio */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-500" />
                      {scenario.totalDurationSec}s Reel
                    </span>

                    <span className="px-3 py-1 rounded-xl bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold uppercase">
                      {scenario.aspectRatioHint}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {scenario.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {scenario.tagline}
                    </p>
                  </div>

                  {/* Platform Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {scenario.recommendedFor.map((platform) => (
                      <span
                        key={platform}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>

                  {/* Step Timeline Pills */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Sequence Breakdown ({scenario.steps.length} Steps):
                    </span>
                    <div className="space-y-1">
                      {scenario.steps.map((step, idx) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                            {idx + 1}. {step.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {Math.round(step.durationMs / 1000)}s
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Launch Action */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {isSelected ? '✓ Selected Scenario' : 'Click to select'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchRecording(scenario.id);
                    }}
                    disabled={isRecording}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Record Reel</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zero-Fallback Technical Details & Architecture Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="p-3 w-fit rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={24} />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">
            100% Live Dynamic Data
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The demo reel navigates real accredited courses, live student profiles, active Firestore curriculums, and real KaTeX formula rendering with zero mock placeholders.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="p-3 w-fit rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Zap size={24} />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">
            Multi-Provider AI Solvers
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            AI queries during recordings are processed in real-time through the multi-model fallback queue (NVIDIA NIM, Groq, Gemini) with mathematical reasoning.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="p-3 w-fit rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <Share2 size={24} />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">
            Instant Social Export
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Outputs high-bitrate WebM video clips paired with pre-formatted copy for 𝕏 (Twitter), LinkedIn, TikTok, and WhatsApp status updates.
          </p>
        </div>
      </div>
    </div>
  );
}
