import { FileText, Search, Download, ExternalLink, GraduationCap, ArrowLeft, Brain, Clock, CheckCircle2, XCircle, Lightbulb, RotateCcw, Trophy, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { pastPapers, PastPaper } from '../data/pastQuestionsData';
import { CourseId } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import PricingModal from './PricingModal';

interface PastQuestionsProps {
  activeCourseId: CourseId | null;
}

export default function PastQuestions({ activeCourseId }: PastQuestionsProps) {
  const { user, profile } = useAuth();
  const { isPremium } = usePremiumStatus();
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  const isLocked = !isPremium && !isAdmin;

  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const filteredPapers = pastPapers.filter(paper => {
    const matchesCourse = activeCourseId ? paper.courseCode.replace(' ', '') === activeCourseId : true;
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.year.includes(searchQuery) ||
      paper.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  const handleOptionSelect = (questionId: string, option: string) => {
    if (submittedQuestions[questionId]) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuestion = (questionId: string) => {
    setSubmittedQuestions(prev => ({ ...prev, [questionId]: true }));
  };

  const toggleHint = (questionId: string) => {
    setShowHints(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setShowHints({});
    setSubmittedQuestions({});
    setShowResults(false);
    setIsStarted(false);
  };

  const calculateScore = () => {
    if (!selectedPaper) return 0;
    return selectedPaper.questions.reduce((acc, q) => {
      return acc + (userAnswers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);
  };

  if (selectedPaper) {
    const score = calculateScore();
    const totalQuestions = selectedPaper.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const attemptedCount = Object.keys(submittedQuestions).length;
    const progress = (attemptedCount / totalQuestions) * 100;

    if (!isStarted) {
      return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="lg:pl-4 xl:pl-0">
              <button 
                onClick={() => setSelectedPaper(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Repository
              </button>
            </div>

            <div className="bg-white border border-slate-200 p-12 rounded-[3rem] text-center space-y-8 shadow-sm">
              <div className="bg-emerald-100 text-emerald-600 p-6 rounded-3xl w-fit mx-auto">
                <Brain size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900">{selectedPaper.title}</h2>
                <p className="text-slate-500 text-lg">
                  You are about to start a practice session for {selectedPaper.courseCode}. 
                  This session includes {totalQuestions} questions with hints and detailed explanations.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</div>
                  <div className="font-bold text-slate-900">Untimed Practice</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Questions</div>
                  <div className="font-bold text-slate-900">{totalQuestions} MCQs</div>
                </div>
              </div>

              <button 
                onClick={() => setIsStarted(true)}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-xl hover:bg-emerald-500 transition-all shadow-xl shadow-slate-200"
              >
                Start Practice Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-slate-200 mb-8">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => {
                  setSelectedPaper(null);
                  resetQuiz();
                }}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
              >
                <ArrowLeft size={20} />
                Exit Practice
              </button>
              
              <div className="flex items-center gap-4">
                <div className="text-sm font-bold text-slate-500">
                  Progress: <span className="text-slate-900">{attemptedCount} / {totalQuestions}</span>
                </div>
                {attemptedCount === totalQuestions && !showResults && (
                  <button 
                    onClick={() => setShowResults(true)}
                    className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                  >
                    View Final Results
                  </button>
                )}
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>

          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 text-white p-10 rounded-[3rem] text-center space-y-6"
              >
                <Trophy size={64} className="mx-auto text-emerald-400" />
                <div className="space-y-2">
                  <h2 className="text-3xl font-black">Quiz Complete!</h2>
                  <p className="text-slate-400">You scored {score} out of {totalQuestions}</p>
                </div>
                <div className="text-6xl font-black text-emerald-400">{percentage}%</div>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={resetQuiz}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold transition-all"
                  >
                    <RotateCcw size={20} />
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {selectedPaper.questions.map((q, idx) => {
              const isSubmitted = submittedQuestions[q.id];
              const selectedOption = userAnswers[q.id];
              const isCorrect = selectedOption === q.correctAnswer;
              const showHint = showHints[q.id];

              return (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white border p-8 rounded-[2.5rem] shadow-sm space-y-6 transition-all ${
                    isSubmitted 
                      ? isCorrect 
                        ? 'border-emerald-500 ring-4 ring-emerald-50' 
                        : 'border-red-500 ring-4 ring-red-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Question {idx + 1}
                    </span>
                    {!isSubmitted && (
                      <button 
                        onClick={() => toggleHint(q.id)}
                        className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors ${showHint ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <Lightbulb size={14} />
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                      </button>
                    )}
                  </div>
                  
                  <div className="text-xl font-bold text-slate-900 leading-relaxed markdown-body">
                    <MarkdownRenderer content={q.question} />
                  </div>

                  <AnimatePresence>
                    {showHint && !isSubmitted && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-sm text-emerald-800 font-medium italic"
                      >
                        <div className="flex gap-2">
                          <Lightbulb size={16} className="shrink-0 mt-0.5" />
                          <p>{q.hint}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {q.type === 'multiple-choice' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options?.map((opt, i) => {
                        const isSelected = selectedOption === opt;
                        const isOptionCorrect = opt === q.correctAnswer;
                        
                        let optionStyles = "bg-slate-50 border-slate-100 text-slate-700";
                        if (isSubmitted) {
                          if (isOptionCorrect) optionStyles = "bg-emerald-50 border-emerald-500 text-emerald-900";
                          else if (isSelected) optionStyles = "bg-red-50 border-red-500 text-red-900";
                          else optionStyles = "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
                        } else if (isSelected) {
                          optionStyles = "bg-slate-900 border-slate-900 text-white";
                        }

                        return (
                          <button 
                            key={i} 
                            disabled={isSubmitted}
                            onClick={() => handleOptionSelect(q.id, opt)}
                            className={`p-4 rounded-2xl border text-left font-medium flex items-center gap-3 transition-all ${optionStyles} ${!isSubmitted && 'hover:border-slate-400'}`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isSelected ? 'bg-white text-slate-900' : 'bg-white border border-slate-200 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <div className="markdown-body text-inherit">
                              <MarkdownRenderer content={opt} />
                            </div>
                            {isSubmitted && isOptionCorrect && <CheckCircle2 size={16} className="ml-auto text-emerald-500" />}
                            {isSubmitted && isSelected && !isCorrect && <XCircle size={16} className="ml-auto text-red-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                    {!isSubmitted ? (
                      <button 
                        disabled={!selectedOption}
                        onClick={() => handleSubmitQuestion(q.id)}
                        className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <div className="w-full">
                        <div className={`flex items-center gap-2 font-bold text-sm uppercase tracking-widest mb-4 ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                          {isCorrect ? 'Correct!' : 'Incorrect'}
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Explanation</span>
                            {isLocked ? (
                              <div className="mt-2">
                                <button 
                                  onClick={() => setShowPricingModal(true)}
                                  className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-emerald-700 font-bold transition-colors"
                                >
                                  <Lock size={16} />
                                  Unlock AI Step-by-Step Solution
                                </button>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-700 leading-relaxed markdown-body">
                                <MarkdownRenderer content={q.explanation} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <PricingModal 
            isOpen={showPricingModal}
            onClose={() => setShowPricingModal(false)}
            featureName="AI Step-by-Step Solutions"
            onUpgradeClick={() => {
              setShowPricingModal(false);
              window.dispatchEvent(new CustomEvent('navigate', { detail: 'pricing' }));
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4 lg:pl-4 xl:pl-0">
          <div className="flex items-center gap-3 text-emerald-500 font-bold uppercase tracking-widest text-xs">
            <FileText size={16} />
            <span>Repository</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Past Questions.
          </h1>
          <p className="text-slate-500 text-lg">
            Access a collection of previous exam questions and solutions for {activeCourseId}. 
            Practice with real papers to master the course.
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by year or topic..."
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] text-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Papers List */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Available Papers</h4>
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper) => (
              <motion.div 
                key={paper.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedPaper(paper)}
                className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-slate-900 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-6">
                  <div className="bg-slate-100 p-4 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{paper.courseCode} - {paper.title}</h3>
                    <p className="text-slate-500">{paper.year} • {paper.questions.length} Questions • Solutions Included</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Logic for download could go here
                    }}
                    className="p-3 bg-slate-100 rounded-xl text-slate-900 hover:bg-slate-200 transition-colors"
                  >
                    <Download size={20} />
                  </button>
                  <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 group-hover:bg-emerald-500 transition-all">
                    Practice Now
                    <ArrowRight size={18} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 p-12 rounded-[3rem] text-center space-y-6 shadow-sm">
              <div className="bg-slate-100 p-6 rounded-3xl w-fit mx-auto text-slate-400">
                <FileText size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">No results found</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  We couldn\\'t find any papers matching your search. Try a different keyword.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Study Tips */}
        <div className="bg-slate-900 text-white p-10 rounded-[3rem] space-y-6">
          <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-widest text-xs">
            <GraduationCap size={16} />
            <span>Study Tips</span>
          </div>
          <h3 className="text-2xl font-bold">How to use past questions</h3>
          <ul className="space-y-4 text-slate-400">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
              <span>Simulate exam conditions by setting a timer.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
              <span>Identify recurring topics and question formats.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
              <span>Compare your solutions with the provided marking schemes.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
