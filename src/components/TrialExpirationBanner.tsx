import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { useAuth } from '../context/AuthContext';

export const TrialExpirationBanner = () => {
  const { isTrialActive, daysRemaining, hoursRemaining } = usePremiumStatus();
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  const isAdminEmail = user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
  const isStaff = ['admin', 'moderator', 'tutor'].includes(profile?.role || '') || isAdminEmail;
  const isFreePlan = profile?.plan_type === 'free';

  if (!isTrialActive || daysRemaining > 2 || !isVisible || isStaff || !isFreePlan) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white p-4 rounded-xl flex items-center justify-between shadow-lg mb-6">
      <div className="flex items-center gap-3">
        <AlertTriangle size={24} />
        <div>
          <h4 className="font-bold">Trial Ending Soon!</h4>
          <p className="text-sm text-amber-50">
            Your premium trial ends in {hoursRemaining <= 24 ? `${hoursRemaining} hours` : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`}. Upgrade now to keep your access.
          </p>
        </div>
      </div>
      <button onClick={() => setIsVisible(false)} className="text-white hover:text-amber-100">
        <X size={20} />
      </button>
    </div>
  );
};
