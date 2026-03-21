import { motion } from 'motion/react';
import { Achievement } from '../../types';
import { Award, Flame, Zap, Footprints, Brain, Lock, CheckCircle2 } from 'lucide-react';

interface BadgesProps {
  achievements: Achievement[];
}

const BADGE_ICONS: Record<string, any> = {
  'Footprints': Footprints,
  'Flame': Flame,
  'Zap': Zap,
  'Award': Award,
  'Brain': Brain,
};

export default function Badges({ achievements }: BadgesProps) {
  // We need a list of all possible badges to show locked ones too
  // For now, let's just show unlocked ones or maybe import BADGES from service
  // Ideally, we should import BADGES from service, but let's keep it simple first
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {achievements.map((achievement, index) => {
        const Icon = BADGE_ICONS[achievement.icon] || Award;
        
        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
              <Icon size={24} />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{achievement.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{achievement.description}</p>
            <div className="mt-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-500" />
              Unlocked
            </div>
          </motion.div>
        );
      })}
      
      {achievements.length === 0 && (
        <div className="col-span-full py-8 text-center text-slate-400">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock size={24} />
          </div>
          <p>No badges earned yet. Keep learning!</p>
        </div>
      )}
    </div>
  );
}
