import { useState, useEffect } from 'react';
import { SubTopic, QuizQuestion } from '../types';
import { AIService } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, CheckCircle2, XCircle, Loader2, ArrowRight, Zap } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface QuickCheckProps {
  subTopic: SubTopic;
  onCorrect: () => void;
}

export default function QuickCheck({ subTopic, onCorrect }: QuickCheckProps) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const loadQuestion = async () => {
      setLoading(true);
      try {
        const q = await AIService.generateQuickCheck(subTopic);
        setQuestion(q);
      } catch (error) {
        console.error("Failed to load quick check:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [subTopic.id]);

  const handleAnswer = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
    const correct = answer === question?.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);
    if (correct) {
      onCorrect();
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Generating a quick knowledge check...</p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
          <div className="bg-zinc-900 dark:bg-zinc-800 p-1.5 rounded-lg text-white">
            <Brain size={16} />
          </div>
          <h3>Quick Knowledge Check</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          <Zap size={12} className="text-amber-500 fill-amber-500" />
          <span>Earn +20 XP</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed">
          <MarkdownRenderer content={question.question} />
        </div>

        <div className="grid gap-3">
          {question.options?.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isAnswerCorrect = option === question.correctAnswer;
            
            let buttonClass = "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700";
            if (showExplanation) {
              if (isAnswerCorrect) buttonClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400";
              else if (isSelected) buttonClass = "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500/50 text-red-700 dark:text-red-400";
              else buttonClass = "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 opacity-50";
            } else if (isSelected) {
              buttonClass = "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900";
            }

            return (
              <button
                key={index}
                disabled={showExplanation}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all flex items-center justify-between border-2 ${buttonClass}`}
              >
                <div className="text-sm sm:text-base flex-1">
                  <MarkdownRenderer content={option} />
                </div>
                {showExplanation && isAnswerCorrect && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
                {showExplanation && isSelected && !isAnswerCorrect && <XCircle size={18} className="text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-zinc-200"
            >
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Explanation</p>
                <div className="text-sm text-zinc-600 leading-relaxed">
                  <MarkdownRenderer content={question.explanation} />
                </div>
              </div>

              {isCorrect ? (
                <div className="bg-emerald-500 text-white p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 size={20} />
                    <span>Correct! You've mastered this concept.</span>
                  </div>
                  <div className="flex items-center gap-1 font-black">
                    <Zap size={16} fill="currentColor" />
                    <span>+20 XP</span>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-100 text-zinc-600 p-4 rounded-xl flex items-center gap-2 font-medium">
                  <XCircle size={20} className="text-red-500" />
                  <span>Don't worry! Review the content above and try again.</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
