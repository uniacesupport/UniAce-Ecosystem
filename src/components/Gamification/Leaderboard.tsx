import { motion } from 'motion/react';
import { LeaderboardEntry } from '../../types';
import { Trophy, Medal, Crown, User } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-amber-500" size={24} />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leaderboard</h2>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.userId === currentUserId;
          const rank = index + 1;
          
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                isCurrentUser 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-md scale-[1.02]' 
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex-shrink-0 w-8 text-center font-black text-slate-400 text-lg">
                {rank === 1 ? <Crown className="text-amber-500 mx-auto" size={24} /> :
                 rank === 2 ? <Medal className="text-slate-400 mx-auto" size={24} /> :
                 rank === 3 ? <Medal className="text-amber-700 mx-auto" size={24} /> :
                 rank}
              </div>

              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-white dark:border-slate-600 shadow-sm">
                {entry.photoURL ? (
                  <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <h3 className={`font-bold truncate ${isCurrentUser ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {entry.displayName}
                  {isCurrentUser && <span className="ml-2 text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Level {Math.floor(entry.xp / 1000) + 1}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-black text-slate-900 dark:text-white">{entry.xp.toLocaleString()} XP</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1">
                  {entry.streak} Day Streak
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
