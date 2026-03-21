import { UserProgress, Module } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { motion } from 'motion/react';

interface AnalyticsChartsProps {
  progress: UserProgress;
  syllabus: Module[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsCharts({ progress, syllabus }: AnalyticsChartsProps) {
  // Process data for charts
  const moduleData = (syllabus || []).map(module => {
    const subTopics = module.subTopics || [];
    const totalMastery = subTopics.reduce((acc, st) => acc + (progress.mastery[st.id] || 0), 0);
    const avgMastery = subTopics.length > 0 ? Math.round(totalMastery / subTopics.length) : 0;
    
    const totalStudyTime = subTopics.reduce((acc, st) => acc + (progress.studyTime[st.id] || 0), 0);
    const studyTimeHours = Math.round((totalStudyTime / 3600) * 10) / 10; // Round to 1 decimal

    return {
      name: module.title.split('. ')[1] || module.title, // Shorten name if possible
      mastery: avgMastery,
      studyTime: studyTimeHours,
      fullTitle: module.title
    };
  });

  // Filter out modules with 0 data to keep charts clean, unless all are 0
  const activeModules = moduleData.filter(m => m.mastery > 0 || m.studyTime > 0);
  const chartData = activeModules.length > 0 ? activeModules : moduleData;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mastery by Module Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-6 rounded-[2.5rem] shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Module Mastery Levels</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="mastery" name="Mastery %" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.mastery >= 80 ? '#10B981' : entry.mastery >= 50 ? '#F59E0B' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Study Time Distribution Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-6 rounded-[2.5rem] shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Study Time Allocation</h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="studyTime"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} hrs`, 'Study Time']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {chartData.reduce((acc, curr) => acc + curr.studyTime, 0).toFixed(1)}h
              </div>
              <div className="text-xs text-slate-500 dark:text-blue-400 font-bold uppercase">Total</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Efficiency Radar Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-blue-900 border border-slate-200 dark:border-blue-800 p-8 rounded-[2.5rem] shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Learning Efficiency Analysis</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600 dark:text-blue-300">Mastery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600 dark:text-blue-300">Effort (Time)</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Mastery"
                dataKey="mastery"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
              <Radar
                name="Study Effort (Normalized)"
                dataKey={(entry) => Math.min((entry.studyTime / (Math.max(...chartData.map(d => d.studyTime)) || 1)) * 100, 100)} 
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'Study Effort (Normalized)' ? 'Relative Effort' : `${value}%`, 
                  name === 'Study Effort (Normalized)' ? 'Effort' : name
                ]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-slate-500 dark:text-blue-300 text-sm mt-4 max-w-2xl mx-auto">
          Compare your mastery level (Green) against your study effort (Blue). 
          <br/>
          <span className="font-bold text-emerald-600">High Mastery + Low Effort</span> = Efficient Learning.
          <br/>
          <span className="font-bold text-amber-600">Low Mastery + High Effort</span> = Needs Review Strategy.
        </p>
      </motion.div>
    </div>
  );
}
