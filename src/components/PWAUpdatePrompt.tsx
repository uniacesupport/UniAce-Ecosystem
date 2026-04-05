import { RefreshCw, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-24 lg:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[70]"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-indigo-200 dark:border-indigo-900/50 p-5 overflow-hidden relative group">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  {needRefresh ? (
                    <RefreshCw size={20} className="animate-spin-slow" />
                  ) : (
                    <Sparkles size={20} className="animate-pulse" />
                  )}
                </div>
                <button 
                  onClick={close}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1 mb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {needRefresh ? 'New Version Available!' : 'App Ready Offline'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {needRefresh 
                    ? 'We\'ve added new features and improvements. Update now to see them!' 
                    : 'UniAce is now cached and ready to work even without an internet connection.'}
                </p>
              </div>

              {needRefresh ? (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  Update & Reload
                </button>
              ) : (
                <button
                  onClick={close}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Awesome!
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
