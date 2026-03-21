import { UserProgress, Module, CourseId, LeaderboardEntry } from '../types';
import { motion } from 'motion/react';
import { Trophy, Zap, Flame, Target, Clock, Award, ChevronRight, Activity, Loader2, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AIService } from '../services/ai';
import { GamificationService, LEVELS } from '../services/gamification';
import Badges from './Gamification/Badges';
import Leaderboard from './Gamification/Leaderboard';
import AnalyticsCharts from './Analytics/AnalyticsCharts';
import { useAuth } from '../context/AuthContext';
import LockedFeature from './LockedFeature';

interface MasteryCenterProps {
  progress: UserProgress;
  onBack: () => void;
  activeCourseId: CourseId | null;
  syllabus: Module[];
}

interface ReadinessPrediction {
  probability: number;
  analysis: string;
  weakestArea: string;
}

export default function MasteryCenter({ progress, onBack, activeCourseId, syllabus }: MasteryCenterProps) {
  const { user, profile } = useAuth();

  const [readiness, setReadiness] = useState<ReadinessPrediction | null>(null);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const totalTopics = (syllabus || []).reduce((acc, m) => acc + (m.subTopics || []).length, 0);
  const masteredTopics = Object.values(progress.mastery).filter(m => m >= 80).length;
  const masteryPercentage = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0;
  const totalStudyTime = Object.values(progress.studyTime).reduce((acc, t) => acc + t, 0);
  const hours = Math.floor(totalStudyTime / 3600);
  const minutes = Math.floor((totalStudyTime % 3600) / 60);

  const currentLevel = GamificationService.calculateLevel(progress.xp);
  const nextLevel = GamificationService.getNextLevel(progress.xp);
  const xpForNextLevel = nextLevel ? nextLevel.xp - currentLevel.xp : 0;
  const progressToNextLevel = nextLevel ? ((progress.xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100 : 100;

  useEffect(() => {
    const fetchData = async () => {
      const lb = await GamificationService.getLeaderboard();
      setLeaderboard(lb);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchReadiness = async () => {
      if (!activeCourseId || syllabus.length === 0) return;
      
      setIsLoadingReadiness(true);
      try {
        const prediction = await AIService.predictExamReadiness(progress, syllabus);
        setReadiness(prediction);
      } catch (error) {
        console.error('Failed to fetch readiness prediction:', error);
      } finally {
        setIsLoadingReadiness(false);
      }
    };

    fetchReadiness();
  }, [activeCourseId, progress.mastery, progress.studyTime]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-blue-950 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 lg:pl-4 xl:pl-0">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-500 font-bold uppercase tracking-widest text-xs">
              <Award size={16} />
              <span>Personal Mastery Center</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Your Learning Journey.
            </h1>
            <p className="text-slate-500 dark:text-blue-300 text-lg max-w-2xl">
              Track your progress, view your knowledge heatmap, and celebrate your achievements.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-4 rounded-3xl flex items-center gap-4 shadow-sm">
              <div className="bg-amber-500 p-3 rounded-2xl text-white">
                <Flame size={24} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{progress.streak}</div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-blue-400 uppercase tracking-wider">Day Streak</div>
              </div>
            </div>
            <div className="bg-slate-900 dark:bg-blue-900 text-white p-4 rounded-3xl flex items-center gap-4 shadow-xl border dark:border-blue-800">
              <div className="bg-emerald-500 p-3 rounded-2xl text-white">
                <Zap size={24} />
              </div>
              <div>
                <div className="text-2xl font-black">{progress.xp}</div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-blue-400 uppercase tracking-wider">Total XP</div>
              </div>
            </div>
          </div>
        </header>

        {/* Level Progress */}
        <section className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Level {currentLevel.level}: {currentLevel.title}
                <Star className="text-amber-400 fill-amber-400" size={24} />
              </h2>
              <p className="text-slate-500 dark:text-blue-300 text-sm">
                {nextLevel ? `${Math.round(nextLevel.xp - progress.xp)} XP to Level ${nextLevel.level}` : 'Max Level Reached!'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-emerald-500">{Math.round(progressToNextLevel)}%</div>
            </div>
          </div>
          <div className="h-4 bg-slate-100 dark:bg-blue-950 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextLevel}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Predictive Performance Analytics */}
            <LockedFeature 
              feature="hasExamReadiness" 
              onUpgrade={() => onBack()} // This is a placeholder, should probably go to pricing
              message="Unlock AI-powered exam readiness predictions with Exam Cram plan!"
            >
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="text-indigo-500" size={24} />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Predictive Performance Analytics</h2>
                </div>
                
                <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-8 rounded-[3rem] shadow-sm relative overflow-hidden">
                  {isLoadingReadiness ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 size={40} className="animate-spin text-indigo-500" />
                      <p className="text-slate-500 dark:text-blue-300 font-medium animate-pulse">AI is analyzing your readiness...</p>
                    </div>
                  ) : readiness ? (
                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                      <div className="relative flex-shrink-0">
                        <svg className="w-48 h-48 transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="transparent"
                            className="text-slate-100 dark:text-blue-950"
                          />
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 88}
                            strokeDashoffset={2 * Math.PI * 88 * (1 - readiness.probability / 100)}
                            className={`${
                              readiness.probability >= 80 ? 'text-emerald-500' :
                              readiness.probability >= 50 ? 'text-amber-500' : 'text-red-500'
                            } transition-all duration-1000 ease-out`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-slate-900 dark:text-white">{readiness.probability}%</span>
                          <span className="text-xs font-bold text-slate-400 dark:text-blue-400 uppercase tracking-wider">Pass Prob.</span>
                        </div>
                      </div>
                      
                      <div className="space-y-6 flex-1">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Exam Readiness</h3>
                          <p className="text-slate-600 dark:text-blue-200 text-lg leading-relaxed">
                            {readiness.analysis}
                          </p>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-blue-950 p-4 rounded-2xl border border-slate-100 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Target size={16} className="text-amber-500" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Weakest Area to Focus On:</span>
                          </div>
                          <p className="text-slate-600 dark:text-blue-300 font-medium">{readiness.weakestArea}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-500 dark:text-blue-300 text-lg">Not enough data to predict readiness. Keep studying!</p>
                    </div>
                  )}
                  
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                </div>
              </section>
            </LockedFeature>

            {/* Knowledge Heatmap */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Heatmap</h2>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-blue-400">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-100 dark:bg-blue-950 rounded-sm" /> 0%</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-200 rounded-sm" /> 50%</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm" /> 100%</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-8 rounded-[3rem] shadow-sm">
                {syllabus.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-blue-300">
                    <p className="text-lg font-medium">Select a course to view detailed mastery analysis.</p>
                    <button 
                      onClick={onBack}
                      className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-colors"
                    >
                      Go to Courses
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {syllabus.map(module => (
                      <div key={module.id} className="space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                          {module.title.split('. ')[1]}
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                          {module.subTopics.map(st => {
                            const mastery = progress.mastery[st.id] || 0;
                            let color = 'bg-slate-100 dark:bg-blue-950';
                            if (mastery > 0) color = 'bg-emerald-100';
                            if (mastery > 40) color = 'bg-emerald-200';
                            if (mastery > 70) color = 'bg-emerald-400';
                            if (mastery >= 90) color = 'bg-emerald-600';

                            return (
                              <motion.div
                                key={st.id}
                                whileHover={{ scale: 1.1 }}
                                className={`aspect-square rounded-lg ${color} cursor-help relative group`}
                              >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 dark:bg-blue-500 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  <div className="font-bold">{st.title}</div>
                                  <div className="text-emerald-400 dark:text-white">Mastery: {mastery}%</div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Advanced Analytics Charts */}
            {syllabus.length > 0 && (
              <LockedFeature 
                feature="hasAdvancedAnalytics" 
                onUpgrade={() => onBack()}
                message="Unlock deep dive analytics and learning efficiency charts with Scholar plan!"
              >
                <section className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Deep Dive Analytics</h2>
                  <AnalyticsCharts progress={progress} syllabus={syllabus} />
                </section>
              </LockedFeature>
            )}

            {/* Badges Section */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Badges & Achievements</h2>
              <Badges achievements={progress.achievements} />
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Leaderboard */}
            <Leaderboard entries={leaderboard} currentUserId={user?.uid} />

            {/* Stats Cards */}
            <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-8 rounded-[2.5rem] space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 text-blue-500 p-3 rounded-2xl w-fit">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-slate-400 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">Course Mastery</h3>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{masteryPercentage}%</div>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-blue-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000" 
                  style={{ width: `${masteryPercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-8 rounded-[2.5rem] space-y-4">
              <div className="bg-emerald-50 dark:bg-blue-950 text-emerald-500 p-3 rounded-2xl w-fit">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-slate-400 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">Total Study Time</h3>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{hours}h {minutes}m</div>
              </div>
              <p className="text-slate-400 dark:text-blue-400 text-xs">Across all modules and subtopics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
