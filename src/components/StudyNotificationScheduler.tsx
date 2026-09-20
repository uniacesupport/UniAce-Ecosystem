import { useEffect, useState } from 'react';
import { Bell, Clock, Play, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import toast from 'react-hot-toast';

export default function StudyNotificationScheduler() {
  const { user } = useAuth();
  const { permissionStatus: pushPermission, requestNotificationPermission } = useNotifications();
  const [lastActive, setLastActive] = useState<number | null>(null);
  const [hoursSinceActive, setHoursSinceActive] = useState<number>(0);
  const [showTestWidget, setShowTestWidget] = useState(false);

  useEffect(() => {
    // Record activity on mount if logged in
    if (user) {
      const key = `uniace_last_active_${user.uid}`;
      const saved = localStorage.getItem(key);
      const now = Date.now();
      
      if (!saved) {
        localStorage.setItem(key, now.toString());
        setLastActive(now);
      } else {
        const parsed = parseInt(saved, 10);
        setLastActive(parsed);
        const elapsedHours = (now - parsed) / (1000 * 60 * 60);
        setHoursSinceActive(elapsedHours);

        // Check if 24 hours have elapsed
        if (elapsedHours >= 24) {
          triggerStudyReminder();
        }
      }

      // Automatically update activity timestamp every 5 minutes while the app is active
      const interval = setInterval(() => {
        localStorage.setItem(key, Date.now().toString());
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const triggerStudyReminder = async () => {
    if (!('Notification' in window)) return;

    const title = 'Time to study! 🎓';
    const body = "Hey there! It's been 24 hours since your last session. Keep your streak alive and stay on track with UniAce!";

    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: 'study-reminder',
            vibrate: [200, 100, 200],
            renotify: true,
            data: { url: window.location.origin }
          } as any);
          toast.success("Study push notification dispatched successfully via Service Worker!");
        } else {
          new Notification(title, { body });
          toast.success("Study reminder notification dispatched!");
        }
      } catch (err) {
        console.error("Failed to show service worker notification:", err);
        new Notification(title, { body });
      }
    } else {
      console.log("Notification permission not granted. Cannot dispatch study reminder.");
    }
  };

  const handleSimulate24hAbsence = () => {
    if (!user) return;
    const key = `uniace_last_active_${user.uid}`;
    // Subtract 25 hours to simulate absence
    const simulatedTime = Date.now() - (25 * 60 * 60 * 1000);
    localStorage.setItem(key, simulatedTime.toString());
    setLastActive(simulatedTime);
    setHoursSinceActive(25);
    
    toast.success("Simulated 24h absence! Checking scheduler...");
    
    if (Notification.permission !== 'granted') {
      toast("Please grant notification permissions first!", { icon: '🔔' });
      requestNotificationPermission();
    } else {
      triggerStudyReminder();
    }
  };

  const handleResetActivity = () => {
    if (!user) return;
    const key = `uniace_last_active_${user.uid}`;
    const now = Date.now();
    localStorage.setItem(key, now.toString());
    setLastActive(now);
    setHoursSinceActive(0);
    toast.success("Activity tracker reset to current time!");
  };

  // Toggle visible debug/test widget
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret key combination: Ctrl + Shift + N to show study reminder debugger
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyN') {
        setShowTestWidget(prev => !prev);
        toast.success(showTestWidget ? "Notification tester hidden" : "Notification tester activated!");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTestWidget]);

  return (
    <>
      {/* Test / Simulation UI Widget */}
      <AnimatePresence>
        {showTestWidget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            className="fixed bottom-24 right-4 z-50 max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Clock size={18} className="animate-pulse" />
                <h4 className="font-bold text-xs uppercase tracking-widest">Study Notification Center</h4>
              </div>
              <button 
                onClick={() => setShowTestWidget(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-semibold"
              >
                Hide
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl text-xs space-y-1.5 border border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Permission:</span>
                  <span className={`font-bold uppercase ${pushPermission === 'granted' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {pushPermission}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Last Active:</span>
                  <span className="font-bold">
                    {lastActive ? new Date(lastActive).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Hours Since Session:</span>
                  <span className="font-bold text-indigo-500">
                    {hoursSinceActive.toFixed(2)}h
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSimulate24hAbsence}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Play size={12} fill="currentColor" />
                  Simulate 24h & Trigger Push
                </button>
                <button
                  onClick={handleResetActivity}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all active:scale-95"
                >
                  <Check size={12} />
                  Reset Tracker
                </button>
              </div>
              
              <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs">N</kbd> anywhere to toggle this panel.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile/Dashboard Integration Tooltip/Indicator (for discovery) */}
      {user && pushPermission !== 'granted' && (
        <div className="fixed bottom-4 left-4 z-40">
          <button
            onClick={() => requestNotificationPermission()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg transition-all active:scale-95 animate-bounce"
          >
            <Bell size={12} />
            <span>Enable 24h Study Reminders</span>
          </button>
        </div>
      )}
    </>
  );
}
