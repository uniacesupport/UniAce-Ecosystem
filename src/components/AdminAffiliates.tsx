import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Link as LinkIcon, Plus, Copy, CheckCircle2, TrendingUp, AlertCircle, X, Loader2, Save } from 'lucide-react';
import { doc, setDoc, getDocs, collection, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAffiliateCode, setNewAffiliateCode] = useState('');
  const [newAffiliateName, setNewAffiliateName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    setIsLoading(true);
    try {
      if (!db) return;
      const snapshot = await getDocs(collection(db, 'affiliates'));
      const data: any[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setAffiliates(data);
    } catch (e) {
      console.error(e);
      setError('Failed to load affiliates.');
    } finally {
      setIsLoading(false);
    }
  };

  const createAffiliate = async () => {
    const code = newAffiliateCode.trim().toUpperCase();
    if (!code || !newAffiliateName.trim()) {
      setError('Name and Referral Code are required.');
      return;
    }
    
    // Check if code exists
    if (affiliates.some(a => a.id === code)) {
      setError('This referral code already exists.');
      return;
    }

    setIsCreating(true);
    setError('');
    try {
      if (!db) throw new Error("Database not connected");
      await setDoc(doc(db, 'affiliates', code), {
        name: newAffiliateName.trim(),
        createdAt: serverTimestamp(),
        clicks: 0,
        signups: 0,
        paidConversions: 0,
        status: 'active'
      });
      setSuccess('Affiliate created successfully!');
      setNewAffiliateCode('');
      setNewAffiliateName('');
      setTimeout(() => setSuccess(''), 3000);
      fetchAffiliates();
    } catch (e) {
      console.error(e);
      setError('Failed to create affiliate.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tutor Affiliates</h2>
          <p className="text-slate-500 dark:text-zinc-400">Manage referral codes for partners and track conversions.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={20} />
          <p>{success}</p>
        </div>
      )}

      {/* Create Affiliate Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create New Affiliate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tutor/Partner Name</label>
            <input 
              type="text" 
              value={newAffiliateName}
              onChange={(e) => setNewAffiliateName(e.target.value)}
              placeholder="e.g. John Doe, Math Academy"
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custom Referral Code</label>
            <div className="relative">
              <input 
                type="text" 
                value={newAffiliateCode}
                onChange={(e) => setNewAffiliateCode(e.target.value.toUpperCase())}
                placeholder="e.g. TUTOR30"
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={createAffiliate}
              disabled={isCreating}
              className="w-full h-[50px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Create Link
            </button>
          </div>
        </div>
      </div>

      {/* Affiliates List */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Active Affiliates & Tutors</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : affiliates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No affiliates yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              Create a custom referral code above to start partnering with tutors.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <th className="pb-4 font-medium px-4">Partner Name</th>
                  <th className="pb-4 font-medium px-4">Referral Code</th>
                  <th className="pb-4 font-medium px-4 text-center">Tracking Link</th>
                  <th className="pb-4 font-medium px-4 text-center">Clicks</th>
                  <th className="pb-4 font-medium px-4 text-center">Users Joined</th>
                  <th className="pb-4 font-medium px-4 text-center">Paid Users</th>
                  <th className="pb-4 font-medium px-4 text-center">Total Earnings</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((aff) => (
                  <tr key={aff.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{aff.name}</p>
                      <p className="text-xs text-slate-500">
                        Added {aff.createdAt ? new Date(aff.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {aff.id}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => copyToClipboard(aff.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors"
                        >
                          {copiedCode === aff.id ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                          {copiedCode === aff.id ? 'Copied URL!' : 'Copy Link'}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <LinkIcon size={16} className="text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-white">{aff.clicks || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-white">{aff.signups || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp size={16} className="text-green-500" />
                        <span className="font-bold text-slate-900 dark:text-white">{aff.paidConversions || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-slate-900 dark:text-white">₦{(aff.totalEarned || 0).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
