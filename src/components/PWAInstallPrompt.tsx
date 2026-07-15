import { Download, X, Smartphone, Monitor, Zap, Shield, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if already installed
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!isStandaloneMode);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      const hasDeclined = localStorage.getItem('pwa_prompt_declined') === 'true';
      if (hasDeclined) return;
      setDeferredPrompt(e);
      const timer = setTimeout(() => {
        if (!isStandalone) {
          setIsVisible(true);
        }
      }, user ? 5000 : 2000);
      return () => clearTimeout(timer);
    };
    
    // Check if we are on iOS/Safari which doesn't support beforeinstallprompt easily
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Aggressive fallback for unauthenticated users (Landing page) if they haven't declined
    if (!user && !isStandalone && localStorage.getItem('pwa_prompt_declined') !== 'true') {
      setTimeout(() => setIsVisible(true), 1500);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsStandalone(true);
      console.log('UniAce was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone, user]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('pwa_prompt_declined', 'true');
    setIsVisible(false);
  };

  if (isStandalone || !deferredPrompt) return null;

  // If not authenticated (Landing Page), show a highly descriptive, wider banner
  if (!user) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
          >
            <div className="max-w-5xl mx-auto bg-slate-900/95 backdrop-blur-xl dark:bg-zinc-900/95 rounded-[2rem] shadow-2xl border border-slate-700 dark:border-zinc-800 p-6 md:p-8 overflow-hidden relative">
              {/* Decorative gradients */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
              
              <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors z-20"
              >
                <X size={20} />
              </button>

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="hidden md:flex flex-shrink-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Download size={40} className="text-white" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wide mb-3">
                    <Sparkles size={14} />
                    Recommended Experience
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                    Install UniAce Mastery Hub
                  </h3>
                  <p className="text-slate-300 md:text-lg mb-6 leading-relaxed max-w-2xl">
                    Get the ultimate study companion on your device. Enjoy blazing fast load times, offline access to your notes, and a distraction-free full-screen environment.
                  </p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 mb-6 md:mb-0">
                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                      <Zap size={18} className="text-amber-400" />
                      <span>Instant Loading</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                      <Shield size={18} className="text-blue-400" />
                      <span>Offline Access</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                      <Monitor size={18} className="text-emerald-400" />
                      <span>Full-Screen Focus</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleInstall}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    Install App <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={handleDecline}
                    className="px-6 py-4 text-slate-400 hover:text-slate-300 font-medium text-sm transition-colors whitespace-nowrap"
                  >
                    Don't show again
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-24 lg:bottom-8 left-4 right-4 md:left-8 md:right-auto md:w-96 z-[60]"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Download size={24} className="animate-bounce" />
                </div>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Install UniAce App?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Add UniAce to your home screen for a faster, full-screen experience and 1-tap access to your AI Tutor.
                </p>
              </div>
              <div className="flex items-center gap-4 mb-6 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={14} />
                  <span>Mobile Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Monitor size={14} />
                  <span>Desktop Support</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Install Now
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Later
                </button>
              </div>
              <button
                onClick={handleDecline}
                className="mt-4 w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Don't show again
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
