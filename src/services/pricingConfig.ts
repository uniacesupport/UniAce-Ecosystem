import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface PricingPlan {
  id: string;
  name: string;
  price: number; // In Naira (NGN)
  sparks: string;
  duration: string;
  features: string[];
  popular?: boolean;
  badge?: string;
  paystackPlanCode?: string;
  enabled?: boolean;
}

export interface PricingConfig {
  plans: PricingPlan[];
  promoBanner?: {
    enabled: boolean;
    text: string;
    discountPercent?: number;
  };
  lastUpdated?: string;
}

export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'emergency_topup',
    name: 'Emergency Top-Up',
    price: 500,
    sparks: '500',
    duration: 'One-Time',
    features: [
      '500 AI Sparks',
      'Exam Readiness Prediction',
      'Standard Support',
      'Enhanced Precision Logic',
      'Distraction-Free Focus Mode'
    ],
    popular: false,
    enabled: true
  },
  {
    id: 'scholar',
    name: 'Scholar',
    price: 1500,
    sparks: '2,000',
    duration: '30 Days',
    features: [
      '2,000 AI Sparks',
      'Advanced Learning Analytics',
      'Exam Readiness Prediction',
      '30 Days Access',
      'Priority Support',
      'Enhanced Precision Logic',
      'Distraction-Free Focus Mode'
    ],
    popular: true,
    enabled: true
  },
  {
    id: 'semester',
    name: 'Semester Bundle',
    price: 4500,
    sparks: '6,000',
    duration: '120 Days',
    features: [
      '6,000 AI Sparks',
      'Advanced Learning Analytics',
      'Exam Readiness Prediction',
      '120 Days Access',
      'VIP Priority Support',
      'Enhanced Precision Logic',
      'Distraction-Free Focus Mode'
    ],
    popular: false,
    enabled: true
  }
];

export const PricingService = {
  async getPricingConfig(): Promise<PricingConfig> {
    try {
      if (!db) return { plans: DEFAULT_PRICING_PLANS };
      const docRef = doc(db, 'system_config', 'pricing');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as PricingConfig;
        if (data.plans && data.plans.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Using default pricing config due to fetch error:', e);
    }
    return { plans: DEFAULT_PRICING_PLANS };
  },

  subscribePricingConfig(callback: (config: PricingConfig) => void): () => void {
    if (!db) {
      callback({ plans: DEFAULT_PRICING_PLANS });
      return () => {};
    }
    const docRef = doc(db, 'system_config', 'pricing');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PricingConfig;
        if (data.plans && data.plans.length > 0) {
          callback(data);
          return;
        }
      }
      callback({ plans: DEFAULT_PRICING_PLANS });
    }, (error) => {
      console.warn('Pricing snapshot error, fallback to defaults:', error);
      callback({ plans: DEFAULT_PRICING_PLANS });
    });
  },

  async savePricingConfig(config: PricingConfig): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'system_config', 'pricing');
    await setDoc(docRef, {
      ...config,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }
};
