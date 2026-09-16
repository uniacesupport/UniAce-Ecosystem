import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, XCircle, Award, Loader2, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { QuizQuestion, CourseId } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import { sanitizeLatex } from '../../services/aiCourseGenerator';
import { callAI } from '../../services/ai';
import { jsonrepair } from 'jsonrepair';

interface MiniQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCourseId: CourseId | null;
  activeModuleTitle?: string;
  activeSubTopicTitle?: string;
  subTopicContent?: string;
  onQuizCompleted?: (scorePercentage: number) => void;
}

export const MiniQuizModal: React.FC<MiniQuizModalProps> = ({
  isOpen,
  onClose,
  activeCourseId,
  activeModuleTitle,
  activeSubTopicTitle,
  subTopicContent,
  onQuizCompleted,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateQuiz();
    } else {
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setError(null);
    }
  }, [isOpen, activeSubTopicTitle]);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `
Generate a quick 3-question university-level diagnostic check for:
Course: ${activeCourseId || 'Academic Subject'}
Module: ${activeModuleTitle || 'Core Module'}
Topic: ${activeSubTopicTitle || 'General Topic'}
Content Extract: ${(subTopicContent || '').substring(0, 4000)}

Requirements:
- Exactly 3 multiple-choice questions.
- High university-level academic rigor with proper LaTeX for formulas.
- Provide 4 distinct options (A, B, C, D) per question.
- Specify the single correctAnswer (exact text of one option), an explanation, and a hint.

Return JSON in this format:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text with $LaTeX$",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation with $LaTeX$",
      "hint": "Helpful hint"
    }
  ]
}
      `;

      const response = await callAI(prompt, 'You are an expert university examiner. Output only valid JSON.', 'json', 2000, 'quiz', 'quiz_generation');
      
      let parsedData: { questions: QuizQuestion[] };
      try {
        parsedData = JSON.parse(response.text);
      } catch (e) {
        const repaired = jsonrepair(response.text);
        parsedData = JSON.parse(repaired);
      }

      if (parsedData?.questions && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
        setQuestions(parsedData.questions.slice(0, 3));
      } else {
        throw new Error("Unable to parse quiz questions from AI response.");
      }
    } catch (err: any) {
      console.error("Failed to generate mini quiz:", err);
      setError(err.message || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const userAns = (selectedAnswers[idx] || '').trim().toLowerCase();
      const rightAns = (q.correctAnswer || '').trim().toLowerCase();
      if (userAns === rightAns || userAns.startsWith(rightAns) || rightAns.startsWith(userAns)) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const score = calculateScore();
    if (onQuizCompleted) {
      onQuizCompleted(score);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>3-Question Topic Check</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-xs">
                  {activeSubTopicTitle || activeModuleTitle || activeCourseId || 'Academic Check'}
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

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={32} className="text-emerald-500 animate-spin" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Generating 3 practice problems with university rigor...
                </p>
                <span className="text-xs text-slate-400">Validating LaTeX and answer derivations</span>
              </div>
            ) : error ? (
              <div className="py-12 text-center space-y-4">
                <p className="text-sm text-red-500 font-medium">{error}</p>
                <button
                  onClick={generateQuiz}
                  className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  Retry Generation
                </button>
              </div>
            ) : questions.length > 0 && currentQ ? (
              <div className="space-y-6">
                {/* Progress bar */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <div className="flex gap-1.5">
                    {questions.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-7 h-1.5 rounded-full transition-all ${
                          idx === currentIndex
                            ? 'bg-emerald-500'
                            : selectedAnswers[idx]
                            ? 'bg-emerald-200 dark:bg-emerald-900/60'
                            : 'bg-slate-200 dark:bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Question Text */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 text-sm font-medium text-slate-900 dark:text-white">
                  <MarkdownRenderer content={sanitizeLatex(currentQ.question)} />
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {(currentQ.options || []).map((opt, oIdx) => {
                    const isSelected = selectedAnswers[currentIndex] === opt;
                    const isCorrect = (currentQ.correctAnswer || '').trim().toLowerCase() === opt.trim().toLowerCase();
                    
                    let styleClass = "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-emerald-500/80 text-slate-800 dark:text-zinc-200";
                    
                    if (isSubmitted) {
                      if (isCorrect) {
                        styleClass = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-semibold";
                      } else if (isSelected && !isCorrect) {
                        styleClass = "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-950 dark:text-red-200";
                      }
                    } else if (isSelected) {
                      styleClass = "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20";
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full p-3.5 rounded-xl text-left text-xs border transition-all flex items-center justify-between ${styleClass}`}
                      >
                        <div className="flex-1 pr-2">
                          <MarkdownRenderer content={sanitizeLatex(opt)} />
                        </div>
                        {isSubmitted && isCorrect && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
                        {isSubmitted && isSelected && !isCorrect && <XCircle size={16} className="text-red-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on Submission */}
                {isSubmitted && currentQ.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-xs space-y-1.5"
                  >
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <HelpCircle size={13} /> Explanation:
                    </span>
                    <div className="text-slate-700 dark:text-zinc-300">
                      <MarkdownRenderer content={sanitizeLatex(currentQ.explanation)} />
                    </div>
                  </motion.div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer Navigation */}
          {!loading && !error && questions.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-30"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <span>Next Question</span>
                    <ArrowRight size={14} />
                  </button>
                ) : !isSubmitted ? (
                  <button
                    onClick={handleSubmit}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Award size={15} />
                    <span>Submit Answers</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      Score: {calculateScore()}%
                    </span>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MiniQuizModal;
