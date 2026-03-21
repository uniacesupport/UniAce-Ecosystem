import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

export type LogLevel = 'info' | 'warning' | 'error' | 'success';
export type LogCategory = 'user' | 'admin' | 'system' | 'ai';

export interface SystemLog {
  id?: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: string;
  userEmail?: string;
  timestamp: any;
}

export const LogService = {
  async log(level: LogLevel, category: LogCategory, message: string, details?: any) {
    try {
      const user = auth.currentUser;
      if (!user) return; // Only log when authenticated
      const logEntry: Omit<SystemLog, 'id'> = {
        level,
        category,
        message,
        details: details || null,
        userId: user.uid,
        userEmail: user.email || 'anonymous',
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'system_logs'), logEntry);
    } catch (error) {
      console.error('Failed to write system log:', error);
    }
  },

  async getLogs(count: number = 100, category?: LogCategory) {
    try {
      let q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(count));
      
      if (category) {
        q = query(collection(db, 'system_logs'), where('category', '==', category), orderBy('timestamp', 'desc'), limit(count));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
      return [];
    }
  }
};
