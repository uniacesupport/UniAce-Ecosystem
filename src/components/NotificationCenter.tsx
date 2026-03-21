import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Info, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useNotifications, Notification } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    permissionStatus: pushPermission,
    requestNotificationPermission: requestPushPermission
  } = useNotifications();
  const pushSupported = 'Notification' in window;
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'error': return <X className="text-red-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    await requestPushPermission();
    setIsRequesting(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            {/* Push Notification Status */}
            {pushSupported && pushPermission !== 'granted' && (
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${pushPermission === 'denied' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Push: {pushPermission === 'denied' ? 'Blocked' : 'Disabled'}
                    </span>
                  </div>
                  <button 
                    onClick={handleRequestPermission}
                    disabled={isRequesting}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-widest disabled:opacity-50"
                  >
                    {pushPermission === 'denied' ? 'How to Unblock' : isRequesting ? 'Enabling...' : 'Enable Now'}
                  </button>
                </div>
                {pushPermission === 'denied' && (
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 leading-tight">
                    Click the lock icon 🔒 in your address bar to allow notifications.
                  </p>
                )}
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="text-slate-300 dark:text-zinc-600" size={24} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif.id);
                        if (notif.link) window.open(notif.link, '_blank');
                      }}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors relative group cursor-pointer ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">{getIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold truncate ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              {notif.title}
                            </p>
                            {notif.link && <ExternalLink size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                              {notif.createdAt?.toDate 
                                ? notif.createdAt.toDate().toLocaleDateString() 
                                : new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                            {!notif.read && (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 text-center">
              <button className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium">
                View all notifications
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
