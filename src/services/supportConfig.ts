import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order?: number;
}

export interface TutorialItem {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  description: string;
  videoUrl?: string;
  category?: string;
}

export interface SupportConfig {
  faqs: FaqItem[];
  tutorials: TutorialItem[];
  contactEmail?: string;
  whatsappSupport?: string;
  lastUpdated?: string;
}

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq_1',
    question: "How do I earn Sparks?",
    answer: "Sparks are the currency of UniAce. You can earn them by completing daily challenges, achieving high scores in quizzes, or by purchasing them through the 'Top Up' section in the sidebar.",
    category: "General"
  },
  {
    id: 'faq_2',
    question: "Can I use UniAce offline?",
    answer: "Yes! UniAce supports basic offline mode. Your progress, XP, and bookmarks are saved locally on your device and will automatically sync with our servers once you're back online.",
    category: "Technical"
  },
  {
    id: 'faq_3',
    question: "How does the AI Math Tutor work?",
    answer: "Our AI Tutor uses advanced Gemini models to help you solve complex math problems. It can explain concepts, provide step-by-step solutions, and even analyze images of your handwritten work.",
    category: "AI Features"
  },
  {
    id: 'faq_4',
    question: "What is 'Mastery Percentage'?",
    answer: "Mastery is calculated based on your quiz performance and study consistency for each topic. Achieving 100% mastery means you've demonstrated a deep understanding of the subject matter.",
    category: "Academics"
  }
];

export const DEFAULT_TUTORIALS: TutorialItem[] = [
  {
    id: 'tut_1',
    title: "Getting Started with UniAce",
    duration: "2:30",
    thumbnail: "https://picsum.photos/seed/tutorial1/400/225",
    description: "Learn the basics of navigating the hub and setting up your first course."
  },
  {
    id: 'tut_2',
    title: "Mastering the AI Tutor",
    duration: "4:15",
    thumbnail: "https://picsum.photos/seed/tutorial2/400/225",
    description: "Tips and tricks for getting the most accurate help from our AI assistant."
  },
  {
    id: 'tut_3',
    title: "Understanding Performance Analytics",
    duration: "3:45",
    thumbnail: "https://picsum.photos/seed/tutorial3/400/225",
    description: "A deep dive into how we track your progress and identify knowledge gaps."
  },
  {
    id: 'tut_4',
    title: "Advanced Study Techniques",
    duration: "5:20",
    thumbnail: "https://picsum.photos/seed/tutorial4/400/225",
    description: "Discover scientifically proven methods to retain information longer and study more effectively."
  },
  {
    id: 'tut_5',
    title: "Preparing for Final Exams",
    duration: "6:10",
    thumbnail: "https://picsum.photos/seed/tutorial5/400/225",
    description: "A comprehensive guide to structuring your revision weeks before your final examinations."
  }
];

export const SupportService = {
  async getSupportConfig(): Promise<SupportConfig> {
    try {
      if (!db) return { faqs: DEFAULT_FAQS, tutorials: DEFAULT_TUTORIALS };
      const docRef = doc(db, 'system_config', 'support');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as SupportConfig;
        return {
          faqs: Array.isArray(data.faqs) && data.faqs.length > 0 ? data.faqs : DEFAULT_FAQS,
          tutorials: Array.isArray(data.tutorials) && data.tutorials.length > 0 ? data.tutorials : DEFAULT_TUTORIALS,
          contactEmail: data.contactEmail || 'uniace.support@gmail.com',
          whatsappSupport: data.whatsappSupport || ''
        };
      }
    } catch (e) {
      console.warn('Using default support config due to fetch error:', e);
    }
    return { faqs: DEFAULT_FAQS, tutorials: DEFAULT_TUTORIALS };
  },

  subscribeSupportConfig(callback: (config: SupportConfig) => void): () => void {
    if (!db) {
      callback({ faqs: DEFAULT_FAQS, tutorials: DEFAULT_TUTORIALS });
      return () => {};
    }
    const docRef = doc(db, 'system_config', 'support');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SupportConfig;
        callback({
          faqs: Array.isArray(data.faqs) && data.faqs.length > 0 ? data.faqs : DEFAULT_FAQS,
          tutorials: Array.isArray(data.tutorials) && data.tutorials.length > 0 ? data.tutorials : DEFAULT_TUTORIALS,
          contactEmail: data.contactEmail || 'uniace.support@gmail.com',
          whatsappSupport: data.whatsappSupport || ''
        });
        return;
      }
      callback({ faqs: DEFAULT_FAQS, tutorials: DEFAULT_TUTORIALS });
    }, (error) => {
      console.warn('Support snapshot error, fallback to defaults:', error);
      callback({ faqs: DEFAULT_FAQS, tutorials: DEFAULT_TUTORIALS });
    });
  },

  async saveSupportConfig(config: SupportConfig): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'system_config', 'support');
    await setDoc(docRef, {
      ...config,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }
};
