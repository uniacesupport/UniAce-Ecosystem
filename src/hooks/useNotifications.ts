import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch, addDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { useAuth } from '../context/AuthContext';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: any;
  link?: string;
}

enum OperationType {
  GET = 'get',
  LIST = 'list',
  WRITE = 'write',
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        const msg = await messaging();
        if (msg && user) {
          const token = await getToken(msg, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_PUBLIC_VAPID_KEY'
          });
          
          if (token) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { fcmToken: token });
            return true;
          }
        }
      } else if (permission === 'denied') {
        alert('Notifications are blocked. Please click the lock icon in your browser address bar to enable them.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    return false;
  };

  const handleFirestoreError = (error: any, operationType: OperationType, path: string) => {
    const errInfo = {
      error: error.message || String(error),
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const path = 'notifications';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid)
      // Removed orderBy('createdAt', 'desc') to avoid composite index requirement
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Sort client-side
      notifs.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("useNotifications: Error marking notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    try {
      const batch = writeBatch(db);
      let hasUpdates = false;
      
      unreadNotifications.forEach(notif => {
        const ref = doc(db, 'notifications', notif.id);
        batch.update(ref, { read: true });
        hasUpdates = true;
      });
      
      if (hasUpdates) {
        await batch.commit();
      }
    } catch (error) {
      console.error("useNotifications: Error marking all notifications as read", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => notifications.find(n => n.id === notificationId && !n.read) ? Math.max(0, prev - 1) : prev);
    
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notifRef);
    } catch (error) {
      console.error("useNotifications: Error deleting notification", error);
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    const notifsToDelete = [...notifications];
    setNotifications([]);
    setUnreadCount(0);
    
    try {
      const batch = writeBatch(db);
      let hasUpdates = false;
      
      notifsToDelete.forEach(notif => {
        const ref = doc(db, 'notifications', notif.id);
        batch.delete(ref);
        hasUpdates = true;
      });
      
      if (hasUpdates) {
        await batch.commit();
      }
    } catch (error) {
      console.error("useNotifications: Error clearing notifications", error);
    }
  };

  const sendNotification = async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', customId?: string) => {
    if (!user) return;

    try {
      const newNotifRef = customId ? doc(db, 'notifications', customId) : doc(collection(db, 'notifications'));
      await setDoc(newNotifRef, {
        userId: user.uid,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("useNotifications: Error sending notification", error);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications, sendNotification, permissionStatus, requestNotificationPermission };
}
