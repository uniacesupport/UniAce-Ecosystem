import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Module, SubTopic, Flashcard, SRSData } from '../types';
import { AIService } from '../services/ai';
import MarkdownRenderer from './MarkdownRenderer';
import { useUserProgress } from '../hooks/useUserProgress';

interface FlashcardsProps {
  module: Module;
  subTopic?: SubTopic;
  onClose: () => void;
}

export default function Flashcards({ module, subTopic, onClose }: FlashcardsProps) {
  const { progress, updateSRSData } = useUserProgress();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      setIsLoading(true);
      try {
        // In a real app, we'd fetch existing cards from the backend and filter by due date.
        // For this demo, we generate new ones if none exist for this module/subtopic.
        const generatedCards = await AIService.generateFlashcards(module, subTopic, 10);
        setCards(generatedCards);
      } catch (error) {
        console.error("Failed to generate flashcards:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCards();
  }, [module, subTopic]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = (rating: 1 | 2 | 3 | 4) => {
    const currentCard = cards[currentIndex];
    const srsData = progress.srsData?.[currentCard.id] || {
      cardId: currentCard.id,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      nextReviewDate: new Date().toISOString()
    };

    // SuperMemo-2 Algorithm implementation
    let nextInterval = 1;
    let nextRepetition = srsData.repetition;
    let nextEfactor = srsData.efactor;

    if (rating >= 3) {
      if (srsData.repetition === 0) {
        nextInterval = 1;
      } else if (srsData.repetition === 1) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(srsData.interval * srsData.efactor);
      }
      nextRepetition += 1;
    } else {
      nextRepetition = 0;
      nextInterval = 1;
    }

    nextEfactor = srsData.efactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (nextEfactor < 1.3) nextEfactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    updateSRSData(currentCard.id, {
      cardId: currentCard.id,
      interval: nextInterval,
      repetition: nextRepetition,
      efactor: nextEfactor,
      nextReviewDate: nextReviewDate.toISOString()
    });

    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 shadow-2xl">
          <Loader2 size={48} className="animate-spin text-emerald-500" />
          <p className="text-slate-500 dark:text-zinc-400 font-bold animate-pulse">Generating your flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500 text-white">
              <Brain size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white leading-none">SRS Flashcards</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-[10px] uppercase tracking-wider mt-1 font-bold">{module.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
          {!sessionComplete ? (
            <div className="w-full max-w-lg space-y-8">
              <div className="flex justify-between items-center text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span>{Math.round(((currentIndex) / cards.length) * 100)}%</span>
              </div>
              
              <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
                />
              </div>

              <div className="relative w-full h-80 perspective-1000">
                <motion.div
                  className="w-full h-full relative preserve-3d cursor-pointer"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  onClick={handleFlip}
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="text-xl font-bold text-slate-950 dark:text-white markdown-body">
                      <MarkdownRenderer content={cards[currentIndex]?.front || ''} />
                    </div>
                    <p className="absolute bottom-6 text-slate-500 dark:text-zinc-400 text-sm font-medium">Click to flip</p>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-100 dark:border-purple-900/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg rotate-y-180">
                    <div className="text-lg text-slate-950 dark:text-white markdown-body">
                      <MarkdownRenderer content={cards[currentIndex]?.back || ''} />
                    </div>
                  </div>
                </motion.div>
              </div>

              <AnimatePresence>
                {isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-4 gap-2"
                  >
                    <button onClick={() => handleRating(1)} className="py-3 bg-red-100 text-red-700 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors">Again</button>
                    <button onClick={() => handleRating(2)} className="py-3 bg-orange-100 text-orange-700 rounded-xl font-bold text-sm hover:bg-orange-200 transition-colors">Hard</button>
                    <button onClick={() => handleRating(3)} className="py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-200 transition-colors">Good</button>
                    <button onClick={() => handleRating(4)} className="py-3 bg-blue-100 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-200 transition-colors">Easy</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">Session Complete!</h3>
              <p className="text-slate-500 dark:text-zinc-400">You've reviewed all cards for this session.</p>
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Return to Study
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
