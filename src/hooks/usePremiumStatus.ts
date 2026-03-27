import { useAuth } from '../context/AuthContext';

export const usePremiumStatus = () => {
  const { profile } = useAuth();

  if (!profile) {
    return { isPremium: false, isTrialActive: false, daysRemaining: 0 };
  }

  const isPremium = profile.plan_type !== 'free';
  
  // System-wide trial start date (March 19, 2026) to ensure all existing users get a trial
  const TRIAL_SYSTEM_START_DATE = new Date('2026-03-19T00:00:00Z');
  const userCreatedAt = new Date(profile.created_at || new Date().toISOString());
  
  // Use the later of the two dates as the trial start point
  const trialStartDate = userCreatedAt < TRIAL_SYSTEM_START_DATE ? TRIAL_SYSTEM_START_DATE : userCreatedAt;
  
  const now = new Date();
  const diffInMs = now.getTime() - trialStartDate.getTime();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  
  const isTrialActive = diffInMs < sevenDaysInMs;
  const daysRemaining = Math.max(0, Math.ceil((sevenDaysInMs - diffInMs) / (24 * 60 * 60 * 1000)));
  const hoursRemaining = Math.max(0, Math.ceil((sevenDaysInMs - diffInMs) / (60 * 60 * 1000)));

  // If trial is active, they get 'scholar' plan benefits
  const effectivePlan = isTrialActive ? 'scholar' : profile.plan_type;

  return {
    isPremium: isPremium || isTrialActive,
    isTrialActive,
    daysRemaining,
    hoursRemaining,
    planType: effectivePlan
  };
};
