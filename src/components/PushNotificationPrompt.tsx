import { Bell, X, AlertCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function PushNotificationPrompt() {
  const { permissionStatus: pushPermission, requestNotificationPermission: requestPushPermission } = useNotifications();
  const pushSupported = 'Notification' in window;
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Show prompt if push is supported but permission is not granted
    if (pushSupported && pushPermission === 'default') {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [pushSupported, pushPermission]);

  const handleEnable = async () => {
    setIsRequesting(true);
    const success = await requestPushPermission();
    if (success) {
      setIsVisible(false);
    }
    setIsRequesting(false);
  };

  if (!pushSupported || pushPermission === 'granted') return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-24 lg:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[60]"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Bell size={24} className="animate-bounce" />
                </div>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Enable Push Notifications?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Get instant alerts for new course materials, quiz results, and smart missions even when you're not in the app.
                </p>
              </div>

              {pushPermission === 'denied' ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-2xl flex items-start gap-3 mb-4">
                  <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-widest">Action Required: Unblock Notifications</p>
                    <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                      Your browser has blocked notifications for this site. To receive alerts, please click the **Lock Icon** (🔒) in your address bar and set **Notifications** to **Allow**.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleEnable}
                    disabled={isRequesting}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isRequesting ? 'Enabling...' : 'Enable Now'}
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                  >
                    Later
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
