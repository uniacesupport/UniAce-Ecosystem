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
      if (!user) return; // Only log when authenticated
      
      const logRef = doc(collection(db, 'system_logs'));
      const logEntry: SystemLog = {
        id: logRef.id,
        level,
        category,
        message,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        userId: user.uid,
        userEmail: user.email || 'anonymous',
        timestamp: serverTimestamp(),
      };

      await setDoc(logRef, logEntry);
    } catch (error) {
      if (error instanceof Error && error.message.includes('insufficient permissions')) {
        const errInfo = {
          error: error.message,
          operationType: 'create',
          path: 'system_logs',
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData.map(provider => ({
              providerId: provider.providerId,
              displayName: provider.displayName,
              email: provider.email,
              photoUrl: provider.photoURL
            })) || []
          }
        };
        console.error('Firestore Error: ', JSON.stringify(errInfo));
        throw new Error(JSON.stringify(errInfo));
      }
      console.error('Failed to write system log:', error);
    }
  },

  async getLogs(count: number = 100, category?: string) {
    try {
      let q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(count));
      
      if (category && category !== 'all') {
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
  },

  subscribeToLogs(callback: (logs: SystemLog[]) => void, count: number = 100, category?: string) {
    let q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(count));
    
    if (category && category !== 'all') {
      q = query(collection(db, 'system_logs'), where('category', '==', category), orderBy('timestamp', 'desc'), limit(count));
    }

    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];
      callback(logs);
    }, (error) => {
      console.error('Failed to subscribe to logs:', error);
    });
  }
};
