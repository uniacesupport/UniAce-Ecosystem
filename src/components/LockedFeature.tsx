import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { PlanType } from '../types';
import { SubscriptionService, PlanLimits } from '../services/subscription';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';

interface LockedFeatureProps {
  plan: PlanType;
  feature: keyof PlanLimits;
  children: React.ReactNode;
  onUpgrade: () => void;
  message?: string;
  className?: string;
}

export default function LockedFeature({ feature, children, onUpgrade, message, className = "" }: Omit<LockedFeatureProps, 'plan'>) {
  const { user, profile } = useAuth();
  const { planType } = usePremiumStatus();
  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  const hasAccess = isAdmin || SubscriptionService.canUseFeature(planType, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative group ${className}`}>
      <div className="filter blur-[2px] pointer-events-none opacity-50 select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 dark:bg-slate-900/10 backdrop-blur-[1px] rounded-3xl z-20 p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 max-w-xs"
        >
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Locked Feature</h3>
          <p className="text-sm text-slate-500 dark:text-blue-300 mb-6 font-medium">
            {message || `This feature is available on higher plans. Upgrade now to unlock full access!`}
          </p>
          <button
            onClick={onUpgrade}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 group/btn"
          >
            <Sparkles size={18} className="group-hover/btn:rotate-12 transition-transform" />
            Upgrade Plan
          </button>
        </motion.div>
      </div>
    </div>
  );
}
