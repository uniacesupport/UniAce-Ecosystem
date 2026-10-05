import { db, auth } from '../firebase';
import { collection, doc, setDoc, serverTimestamp, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';

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
      const token = user ? await user.getIdToken(true) : null;
      
      // Call backend API for logging
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          level,
          category,
          message,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
          userId: user?.uid || 'system',
          userEmail: user?.email || 'system'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to write system log via API:', error);
    }
  },

  async getLogs(count: number = 100, category?: string) {
    try {
      const fetchLimit = category && category !== 'all' ? Math.max(count * 3, 300) : count;
      const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(fetchLimit));

      const querySnapshot = await getDocs(q);
      const allLogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];

      if (category && category !== 'all') {
        return allLogs.filter(l => l.category === category).slice(0, count);
      }
      return allLogs.slice(0, count);
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
      return [];
    }
  },

  subscribeToLogs(callback: (logs: SystemLog[]) => void, count: number = 100, category?: string) {
    const fetchLimit = category && category !== 'all' ? Math.max(count * 3, 300) : count;
    const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(fetchLimit));

    return onSnapshot(q, (snapshot) => {
      const allLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];
      const filtered = category && category !== 'all'
        ? allLogs.filter(l => l.category === category).slice(0, count)
        : allLogs.slice(0, count);
      callback(filtered);
    }, (error) => {
      console.error('Failed to subscribe to logs:', error);
    });
  }
};
