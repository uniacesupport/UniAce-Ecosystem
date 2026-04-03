import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface ErrorState {
  type: 'network' | 'auth' | 'general';
  message: string;
  code?: string;
}

export default function GlobalErrorInterceptor() {
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      // Handle Firebase Network Errors
      if (reason?.code === 'auth/network-request-failed' || 
          reason?.message?.includes('network-request-failed') ||
          reason?.message?.includes('Failed to fetch')) {
        
        // Prevent default browser error overlay if possible
        event.preventDefault();
        
        setError({
          type: 'network',
          message: 'Connection unstable. We are trying to reconnect...',
          code: 'auth/network-request-failed'
        });

        // Auto-clear after 5 seconds if it's just a transient network blip
        setTimeout(() => setError(prev => prev?.code === 'auth/network-request-failed' ? null : prev), 5000);
      }

      // Handle Firebase Unauthorized Domain
      if (reason?.code === 'auth/unauthorized-domain') {
        event.preventDefault();
        setError({
          type: 'auth',
          message: 'This domain is not authorized in Firebase. Please contact support.',
          code: 'auth/unauthorized-domain'
        });
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message.includes('Firebase') && event.message.includes('network')) {
        setError({
          type: 'network',
          message: 'Network issue detected. Retrying...',
          code: 'network-error'
        });
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    // Refresh the page or specific services
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[9999]"
        >
          <div className={`
            p-4 rounded-2xl shadow-2xl border backdrop-blur-md
            ${error.type === 'network' 
              ? 'bg-amber-50/90 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
              : 'bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-800'}
          `}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${error.type === 'network' ? 'bg-amber-100 dark:bg-amber-800/40' : 'bg-red-100 dark:bg-red-800/40'}`}>
                {error.type === 'network' ? (
                  <WifiOff size={20} className="text-amber-600 dark:text-amber-400" />
                ) : (
                  <ShieldAlert size={20} className="text-red-600 dark:text-red-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${error.type === 'network' ? 'text-amber-900 dark:text-amber-100' : 'text-red-900 dark:text-red-100'}`}>
                  {error.type === 'network' ? 'Network Interruption' : 'Security Alert'}
                </h4>
                <p className={`text-xs mt-1 ${error.type === 'network' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'}`}>
                  {error.message}
                </p>
                
                <div className="mt-4 flex items-center gap-3">
                  <button 
                    onClick={handleRetry}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${error.type === 'network' 
                        ? 'bg-amber-600 text-white hover:bg-amber-700' 
                        : 'bg-red-600 text-white hover:bg-red-700'}
                    `}
                  >
                    <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                    Reconnect
                  </button>
                  <button 
                    onClick={() => setError(null)}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setError(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
