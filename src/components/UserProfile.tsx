import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit2, BarChart2, ChevronRight, Mail, User, BookMarked, Moon, Sun, HelpCircle, Star, LogOut, ShieldCheck, Zap, FileText, BookOpen, Settings, CreditCard, Clock, CheckCircle2, Camera, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { View } from '../types';
import { db, storage } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentRecord {
  id: string;
  amount: number;
  plan_type: string;
  reference: string;
  status: string;
  timestamp: Timestamp;
  sparks_added: number;
}

interface UserProfileProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

export default function UserProfile({ onBack, onNavigate }: UserProfileProps) {
  const { user, logout, profile, updateProfileData } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme === 'dark';
      } catch (e) {
        console.warn('localStorage access denied, using default theme');
      }
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch (e) {}
    } else {
      root.classList.remove('dark');
      try {
        localStorage.setItem('theme', 'light');
      } catch (e) {}
    }
  }, [isDarkMode]);

  const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const currentAvatar = profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`;
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [selectedTheme, setSelectedTheme] = useState(profile?.themeColor || 'blue');
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themes = [
    { id: 'blue', name: 'Blue', color: 'bg-blue-500', lightColor: 'bg-blue-100', text: 'text-blue-600' },
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500', lightColor: 'bg-emerald-100', text: 'text-emerald-600' },
    { id: 'purple', name: 'Purple', color: 'bg-purple-500', lightColor: 'bg-purple-100', text: 'text-purple-600' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-500', lightColor: 'bg-rose-100', text: 'text-rose-600' },
    { id: 'amber', name: 'Amber', color: 'bg-amber-500', lightColor: 'bg-amber-100', text: 'text-amber-600' },
  ];

  const activeTheme = themes.find(t => t.id === (profile?.themeColor || 'blue')) || themes[0];

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.uid || !db) return;
      
      setIsLoadingPayments(true);
      try {
        const q = query(
          collection(db, 'payments'),
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const records: PaymentRecord[] = [];
        querySnapshot.forEach((doc) => {
          records.push({ id: doc.id, ...doc.data() } as PaymentRecord);
        });
        setPayments(records);
      } catch (error: any) {
        console.error("Error fetching payments:", error);
        // Don't show error to user if it's just a permission issue on an empty collection
        // but log it for debugging
      } finally {
        setIsLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [user?.uid]);

  const avatars = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=Robot1`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=Robot2`,
    `https://api.dicebear.com/7.x/micah/svg?seed=Micah1`,
    `https://api.dicebear.com/7.x/micah/svg?seed=Micah2`,
  ];

  const handleSaveProfile = async () => {
    if (updateProfileData) {
      await updateProfileData({ 
        photoURL: selectedAvatar, 
        themeColor: selectedTheme,
        displayName: displayName || 'Scholar',
        bio: bio
      });
    }
    setIsEditingProfile(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid || !storage) return;

    // Basic validation
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setSelectedAvatar(downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const menuItems = [
    {
      icon: BarChart2,
      label: 'Performance Analysis',
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      onClick: () => onNavigate('mastery')
    },
    {
      icon: BookMarked,
      label: 'Bookmarks',
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      onClick: () => onNavigate('notebook')
    },
    {
      icon: isDarkMode ? Sun : Moon,
      label: 'Device Appearance',
      color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      onClick: () => setIsDarkMode(!isDarkMode),
      value: isDarkMode ? 'Dark Mode' : 'Light Mode'
    },
    {
      icon: HelpCircle,
      label: 'Help and Support',
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      onClick: () => onNavigate('help-support')
    },
    ...(isAdmin ? [
      {
        icon: ShieldCheck,
        label: 'Support Dashboard',
        color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        onClick: () => onNavigate('admin-support')
      },
      {
        icon: Settings,
        label: 'Admin Dashboard',
        color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        onClick: () => onNavigate('admin-dashboard')
      }
    ] : []),
    {
      icon: Star,
      label: 'Rate App',
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      onClick: () => alert('Thank you for rating us 5 stars!')
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between lg:pl-4 xl:pl-0">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-lg">Home</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Account</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Profile Card */}
        {!isEditingProfile ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-slate-600 shadow-md ${activeTheme.lightColor}`}>
                <img 
                  src={currentAvatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.displayName || user?.displayName || 'Scholar'}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email || 'No email linked'}</p>
                {profile?.bio && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic line-clamp-2">
                    "{profile.bio}"
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedAvatar(currentAvatar);
                setSelectedTheme(profile?.themeColor || 'blue');
                setIsEditingProfile(true);
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Edit2 size={20} />
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customize Profile</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className={`px-4 py-2 text-sm font-bold text-white ${activeTheme.color} rounded-xl shadow-sm hover:opacity-90 transition-opacity`}
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Display Name</label>
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Choose Avatar</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Upload Custom
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {avatars.map((avatar, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedAvatar === avatar 
                        ? `border-${activeTheme.id}-500 shadow-md scale-105` 
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                    } ${activeTheme.lightColor}`}
                  >
                    <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Theme Color</p>
              <div className="flex gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`w-10 h-10 rounded-full ${theme.color} flex items-center justify-center transition-transform ${
                      selectedTheme === theme.id ? 'scale-110 ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-' + theme.id + '-500' : 'hover:scale-105'
                    }`}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Subscription</h3>
            <button 
              onClick={() => onNavigate('pricing')}
              className={`text-sm font-bold ${activeTheme.text} hover:opacity-80`}
            >
              Manage
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                  {isAdmin ? 'Admin' : (profile?.plan_type || 'Free')}
                </p>
                {!isAdmin && profile?.subscription_status && profile.subscription_status !== 'none' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    profile.subscription_status === 'active' 
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {profile.subscription_status}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">AI Sparks</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{isAdmin ? 'Unlimited' : (profile?.ai_sparks || 0)}</p>
            </div>
            {profile?.subscription_start_date && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Started On</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {new Date(profile.subscription_start_date).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}
            {profile?.subscription_expiry && (
              <div className={`${profile?.subscription_start_date ? '' : 'col-span-2'} bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl`}>
                <p className="text-xs text-slate-500 dark:text-slate-400">Expires On</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {new Date(profile.subscription_expiry).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className={activeTheme.text} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment History</h3>
          </div>
          
          <div className="space-y-3">
            {isLoadingPayments ? (
              <div className="flex justify-center py-4">
                <div className={`w-6 h-6 border-2 ${activeTheme.color} border-t-transparent rounded-full animate-spin`} />
              </div>
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {payment.plan_type.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {payment.timestamp?.toDate().toLocaleDateString()} • Ref: {payment.reference.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">₦{payment.amount.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+{payment.sparks_added} Sparks</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard size={24} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No transactions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access (Mobile Only) */}
        <div className="lg:hidden space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Syllabus', icon: BookMarked, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', view: 'course-syllabus' },
              { label: 'Mastery', icon: BarChart2, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', view: 'mastery' },
              { label: 'Formulas', icon: HelpCircle, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', view: 'formulas' },
              { label: 'Quizzes', icon: Star, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', view: 'quizzes' },
              { label: 'Flashcards', icon: Zap, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400', view: 'flashcards' },
              { label: 'Past Qs', icon: FileText, color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400', view: 'past-questions' },
              { label: 'Notebook', icon: BookOpen, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400', view: 'notebook' },
              ...(isAdmin ? [{ label: 'Admin Dashboard', icon: Settings, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', view: 'admin-dashboard' }] : []),
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(item.view as View)}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-all active:scale-95"
              >
                <div className={`p-3 rounded-xl ${item.color} dark:bg-opacity-10`}>
                  <item.icon size={24} />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <button 
              key={index}
              onClick={item.onClick}
              className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${item.color} dark:bg-opacity-10`}>
                  <item.icon size={24} />
                </div>
                <div className="text-left">
                  <span className="block text-lg font-semibold text-slate-900 dark:text-white">{item.label}</span>
                  {item.value && <span className="text-xs text-slate-500 dark:text-slate-400">{item.value}</span>}
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
            </button>
          ))}

          <button 
            onClick={logout}
            className="w-full bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl flex items-center justify-between border border-red-100 dark:border-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group mt-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                <LogOut size={24} />
              </div>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">Log Out</span>
            </div>
            <ChevronRight size={20} className="text-red-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
