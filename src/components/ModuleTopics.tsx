import { useState } from 'react';
import { Module, UserProgress } from '../types';
import { Book, ArrowLeft, ArrowRight, ChevronRight, GraduationCap, BrainCircuit, MessageSquare, Lock, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Flashcards from './Flashcards';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { LogService } from '../services/logService';
import PricingModal from './PricingModal';

interface ModuleTopicsProps {
  module: Module;
  onBack: () => void;
  onSubTopicSelect: (subTopicId: string) => void;
  onTakeQuiz: (subTopicId: string) => void;
  onOpenChat: () => void;
  progress: UserProgress;
}

export default function ModuleTopics({ module, onBack, onSubTopicSelect, onTakeQuiz, onOpenChat, progress }: ModuleTopicsProps) {
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('');
  const { user, profile } = useAuth();
  const { isPremium } = usePremiumStatus();
  
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  const isLocked = !isPremium && !isAdmin;

  const getMasteryLevel = (subTopicId: string) => {
    const mastery = progress.mastery?.[subTopicId] || 0;
    if (mastery >= 100) return { label: 'Master', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
    if (mastery >= 70) return { label: 'Adept', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    if (mastery >= 30) return { label: 'Apprentice', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' };
    if (mastery > 0) return { label: 'Novice', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50' };
    return { label: 'Unstarted', color: 'text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800/50' };
  };

  const handleSubTopicClick = (topicId: string, index: number) => {
    if (isLocked && index > 0) {
      LogService.log('info', 'user', 'locked_feature_click', { feature: 'subtopic', topicId, userId: user?.uid });
      setLockedFeatureName('Full Module Access');
      setShowPricingModal(true);
      return;
    }
    onSubTopicSelect(topicId);
  };

  const handleQuizClick = (e: React.MouseEvent, topicId: string, index: number) => {
    e.stopPropagation();
    if (isLocked && index > 0) {
      LogService.log('info', 'user', 'locked_feature_click', { feature: 'quiz', topicId, userId: user?.uid });
      setLockedFeatureName('Full Module Quizzes');
      setShowPricingModal(true);
      return;
    }
    onTakeQuiz(topicId);
  };

  const handleFlashcardsClick = () => {
    if (isLocked) {
      LogService.log('info', 'user', 'locked_feature_click', { feature: 'flashcards', userId: user?.uid });
      setLockedFeatureName('SRS Flashcards');
      setShowPricingModal(true);
      return;
    }
    setShowFlashcards(true);
  };

  const handleChatClick = () => {
    // We can let them open chat, but the chat component itself will check their Sparks balance
    onOpenChat();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="space-y-6 lg:pl-4 xl:pl-0">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-emerald-500 font-bold uppercase tracking-widest text-xs">
                <GraduationCap size={16} />
                <span>Module Overview</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {module.title}
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 text-lg">
                Explore the fundamental concepts and principles of {module.title.split('. ')[1]?.toLowerCase() || 'this module'}.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleChatClick}
                className="group flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md"
              >
                <MessageSquare size={20} />
                <span>AI Tutor</span>
              </button>
              <button
                onClick={handleFlashcardsClick}
                className="group flex items-center justify-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-600 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md"
              >
                <BrainCircuit size={20} />
                <span>SRS Flashcards</span>
                {isLocked && <Lock size={14} className="ml-1 opacity-70" />}
              </button>
            </div>
          </div>
        </header>

        {/* Topics List */}
        <div className="grid gap-4">
          {module.subTopics.map((topic, i) => {
            const isLockedTopic = isLocked && i > 0;
            const mastery = getMasteryLevel(topic.id);
            const masteryPercent = progress.mastery?.[topic.id] || 0;

            return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`group bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-6 rounded-3xl hover:border-slate-900 dark:hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex items-center justify-between ${isLockedTopic ? 'opacity-70 grayscale-[0.5]' : ''}`}
            >
              <div 
                className="flex items-center gap-5 flex-1 cursor-pointer"
                onClick={() => handleSubTopicClick(topic.id, i)}
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-100 dark:bg-blue-950 flex items-center justify-center text-slate-900 dark:text-white font-black text-sm group-hover:bg-slate-900 dark:group-hover:bg-blue-700 group-hover:text-white transition-colors ${isLockedTopic ? 'bg-slate-200 text-slate-400' : ''}`}>
                    {isLockedTopic ? <Lock size={18} /> : (i + 1)}
                  </div>
                  {masteryPercent >= 100 && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-blue-900">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {topic.title}
                    </h3>
                    {!isLockedTopic && masteryPercent > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mastery.bg} ${mastery.color} uppercase tracking-wider`}>
                        {mastery.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-slate-400 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">Topic {i + 1}</p>
                    {masteryPercent > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1 bg-slate-100 dark:bg-blue-950 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${masteryPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500">{masteryPercent}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleQuizClick(e, topic.id, i)}
                  className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4"
                >
                  <Book size={16} />
                  <span>Take Quiz</span>
                </button>
                <button 
                  onClick={() => handleSubTopicClick(topic.id, i)}
                  className="bg-slate-50 dark:bg-blue-950 p-2 rounded-xl text-slate-400 dark:text-blue-400 group-hover:bg-slate-900 dark:group-hover:bg-blue-700 group-hover:text-white transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )})}
        </div>

        {/* Learning Tip */}
        <div className="bg-slate-900 dark:bg-blue-900 text-white p-10 rounded-[3rem] relative overflow-hidden border dark:border-blue-800">
          <div className="relative z-10 space-y-4">
            <h3 className="text-xl font-bold">Ready to start?</h3>
            <p className="text-slate-400 dark:text-blue-300">
              Each topic contains detailed explanations, mathematical proofs, and solved examples to help you master the material.
            </p>
            <button 
              onClick={() => onSubTopicSelect(module.subTopics[0].id)}
              className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              Start from Topic 1
              <ArrowRight size={16} />
            </button>
          </div>
          <Book size={120} className="absolute -right-8 -bottom-8 text-white opacity-5" />
        </div>
      </div>

      {showFlashcards && (
        <Flashcards 
          module={module} 
          onClose={() => setShowFlashcards(false)} 
        />
      )}

      <PricingModal 
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        featureName={lockedFeatureName}
        onUpgradeClick={() => {
          window.dispatchEvent(new CustomEvent('navigate', { detail: 'pricing' }));
        }}
      />
    </div>
  );
}
