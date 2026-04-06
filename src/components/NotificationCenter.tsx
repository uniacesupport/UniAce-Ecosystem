import { useState, useRef, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle, ExternalLink, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-[340px] sm:w-[400px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 z-50 overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 py-0.5 px-2 rounded-full text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1">
              {notifications.length === 0 ? (
                <div className="px-6 py-12 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Bell className="text-slate-300 dark:text-slate-600" size={32} />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-medium mb-1">All caught up!</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">You have no new notifications.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors relative group ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p 
                              onClick={() => {
                                if (!notif.read) markAsRead(notif.id);
                                if (notif.link) window.open(notif.link, '_blank');
                              }}
                              className={`text-sm font-medium truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
                            >
                              {notif.title}
                            </p>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {notif.link && (
                                <button onClick={() => window.open(notif.link, '_blank')} className="p-1 text-slate-400 hover:text-blue-500 rounded">
                                  <ExternalLink size={14} />
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} className="p-1 text-slate-400 hover:text-red-500 rounded">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between mt-2.5">
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {notif.createdAt?.toDate 
                                ? notif.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                : new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!notif.read && (
                              <span className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
