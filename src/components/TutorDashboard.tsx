import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Link as LinkIcon, Copy, CheckCircle2, TrendingUp, AlertCircle, ArrowLeft, Loader2, MousePointerClick } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface TutorDashboardProps {
  onBack: () => void;
}

export default function TutorDashboard({ onBack }: TutorDashboardProps) {
  const { user } = useAuth();
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchAffiliateData();
  }, [user]);

  const fetchAffiliateData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (!db) return;
      // We assume the tutor's affiliate ID might match their tutor referral code or UID.
      const userRef = await getDoc(doc(db, 'users', user.uid));
      const refCode = userRef.exists() && userRef.data().referralCode ? userRef.data().referralCode : user.uid.substring(0, 6).toUpperCase();
      
      const affDoc = await getDoc(doc(db, 'affiliates', refCode));
      if (affDoc.exists()) {
        setAffiliateData({ id: affDoc.id, ...affDoc.data() });
      } else {
        // Fallback: the admin hasn't created the affiliate for them yet.
        setError("Your affiliate code hasn't been activated by an admin yet. Please reach out to support.");
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <ArrowLeft size={24} className="text-slate-700 dark:text-slate-200" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tutor Dashboard</h2>
          <p className="text-slate-500 font-medium">Track your referrals and earnings</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-3xl flex items-center gap-3 shadow-sm border border-red-100 dark:border-red-900/30">
          <AlertCircle size={28} />
          <p className="text-lg font-medium">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tracking Link Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Your Tracking Link</h3>
            <div className="flex gap-4">
              <div className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-mono text-lg flex items-center justify-between">
                <span>{window.location.origin}?ref={affiliateData?.id}</span>
                <button
                  onClick={() => copyToClipboard(affiliateData?.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-xl text-indigo-700 dark:text-indigo-400 font-bold transition-colors"
                >
                  {copiedCode === affiliateData?.id ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                  {copiedCode === affiliateData?.id ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 mt-4 text-sm">
              Share this link to earn 30% commission on every user who signs up and pays for a plan.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <MousePointerClick size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Link Clicks</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{affiliateData?.clicks || 0}</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Signups</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{affiliateData?.signups || 0}</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm ring-1 ring-emerald-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Paid Users</div>
                  <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{affiliateData?.paidConversions || 0}</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 text-white">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-400 text-emerald-900 px-2 py-0.5 rounded-full uppercase tracking-tighter">Balance</span>
                </div>
                <div className="mt-auto">
                  <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Pending Payout</div>
                  <div className="text-3xl font-black">₦{(affiliateData?.pendingBalance || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-indigo-100 mt-2 font-medium">Total Earned: ₦{(affiliateData?.totalEarned || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
