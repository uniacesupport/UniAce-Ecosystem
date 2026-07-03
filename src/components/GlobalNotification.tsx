import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Zap, MessageCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function GlobalNotification() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<{ id?: string; message: string; active: boolean; whatsappLink?: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!db || !user) {
      setIsVisible(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'notifications', 'global_alert'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as { id?: string; message: string; active: boolean; whatsappLink?: string };
        
        // Check if this specific alert has been dismissed
        const dismissedId = localStorage.getItem('dismissed_global_alert_id');
        
        if (data.active && data.id !== dismissedId) {
          setNotification(data);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    }, (error) => {
      console.warn("GlobalNotification: Listener permission error (likely not authenticated yet):", error);
      setIsVisible(false);
    });

    return () => unsub();
  }, [user]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (notification?.id) {
      localStorage.setItem('dismissed_global_alert_id', notification.id);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl"
        >
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-amber-500/20 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="bg-amber-500 p-2 rounded-xl shrink-0">
                <Zap size={20} className="text-slate-900" fill="currentColor" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-0.5">Global Announcement</p>
                <p className="text-sm font-bold text-white leading-tight">{notification.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {notification.whatsappLink && (
                <a 
                  href={notification.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  <MessageCircle size={16} />
                  JOIN WHATSAPP
                </a>
              )}
              <button 
                onClick={handleDismiss}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
