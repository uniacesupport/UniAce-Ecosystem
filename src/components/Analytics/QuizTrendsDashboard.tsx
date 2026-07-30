import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface QuizTrendsProps {
  quizHistory?: { date: string; score: number; courseId: string; topicId?: string }[];
  activeCourseId?: string;
}

export default function QuizTrendsDashboard({ quizHistory = [], activeCourseId }: QuizTrendsProps) {
  const chartData = useMemo(() => {
    // Filter by active course if provided, otherwise show all
    const relevantHistory = activeCourseId 
      ? quizHistory.filter(q => q.courseId === activeCourseId)
      : quizHistory;

    // Group by date or just sort chronologically
    return relevantHistory
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((q, i) => {
        const d = new Date(q.date);
        return {
          name: `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`,
          score: q.score,
          topicId: q.topicId || 'Unknown'
        };
      });
  }, [quizHistory, activeCourseId]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-blue-950/30 p-8 rounded-[2rem] border border-slate-200 dark:border-blue-800 text-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Quiz Trends</h3>
        <p className="text-slate-500 dark:text-blue-300">Complete some quizzes to see your progress trends over time!</p>
      </div>
    );
  }

  // Calculate some basic stats
  const averageScore = Math.round(chartData.reduce((acc, val) => acc + val.score, 0) / chartData.length);
  const highestScore = Math.max(...chartData.map(d => d.score));
  const recentScore = chartData[chartData.length - 1].score;
  const trend = chartData.length > 1 ? recentScore - chartData[chartData.length - 2].score : 0;

  return (
    <div className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-8 rounded-[2.5rem] shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Quiz Trends</h3>
          <p className="text-slate-500 dark:text-blue-300 text-sm font-medium">Your historical quiz performance over time</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-50 dark:bg-blue-950 p-3 rounded-2xl border border-slate-100 dark:border-blue-800 text-center px-4">
            <div className="text-xs font-bold text-slate-400 dark:text-blue-400 uppercase tracking-wider mb-1">Avg Score</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{averageScore}%</div>
          </div>
          <div className="bg-slate-50 dark:bg-blue-950 p-3 rounded-2xl border border-slate-100 dark:border-blue-800 text-center px-4">
            <div className="text-xs font-bold text-slate-400 dark:text-blue-400 uppercase tracking-wider mb-1">Best</div>
            <div className="text-xl font-black text-emerald-500 dark:text-emerald-400">{highestScore}%</div>
          </div>
          <div className="bg-slate-50 dark:bg-blue-950 p-3 rounded-2xl border border-slate-100 dark:border-blue-800 text-center px-4">
            <div className="text-xs font-bold text-slate-400 dark:text-blue-400 uppercase tracking-wider mb-1">Recent</div>
            <div className="flex items-center gap-1 justify-center">
              <span className="text-xl font-black text-slate-900 dark:text-white">{recentScore}%</span>
              {trend !== 0 && (
                <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {trend > 0 ? '+' : ''}{trend}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-blue-800" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }} 
              tickLine={false} 
              axisLine={false}
              stroke="currentColor" 
              className="text-slate-400 dark:text-blue-400"
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12 }} 
              tickLine={false} 
              axisLine={false}
              stroke="currentColor" 
              className="text-slate-400 dark:text-blue-400"
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                backgroundColor: 'var(--tw-bg-opacity, white)'
              }}
              itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: number) => [`${value}%`, 'Score']}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
