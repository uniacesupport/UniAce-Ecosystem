import React, { useState } from 'react';
import { Zap, Key, Loader2, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { auth } from '../firebase';
import { motion } from 'motion/react';

export const ApiDebuggerPage = ({ onBack, showToast }: { onBack: () => void, showToast: (message: string, type: 'success' | 'error' | 'info') => void }) => {
  const [testKeyProvider, setTestKeyProvider] = useState<string>('gemini_direct');
  const [testKeyInput, setTestKeyInput] = useState('');
  const [testKeyResult, setTestKeyResult] = useState<any>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);

  const handleTestApiKey = async () => {
    if (!testKeyInput) {
      showToast("Please enter an API key to test", "error");
      return;
    }
    setIsTestingKey(true);
    setTestKeyResult(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/test-api-key', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: testKeyProvider, key: testKeyInput })
      });
      const data = await res.json();
      setTestKeyResult(data);
      if (data.success) {
        showToast("API Key test successful!", "success");
      } else {
        showToast("API Key test failed", "error");
      }
    } catch (error) {
      showToast("Error testing API key", "error");
    } finally {
      setIsTestingKey(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ChevronLeft size={20} /> Back to Dashboard
      </button>
      
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 max-w-2xl">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Key className="text-indigo-500" size={28} />
          API Key Debugger
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Provider</label>
            <select 
              value={testKeyProvider}
              onChange={(e) => setTestKeyProvider(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="gemini_direct">Gemini (Direct)</option>
              <option value="mistral_direct">Mistral (Direct)</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter (Gemini Flash)</option>
              <option value="cohere">Cohere</option>
              <option value="huggingface">Hugging Face</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">API Key to Test</label>
            <div className="relative">
              <input 
                type="password"
                value={testKeyInput}
                onChange={(e) => setTestKeyInput(e.target.value)}
                placeholder="Enter key to validate..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
              />
              <Key className="absolute right-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>
          <button 
            onClick={handleTestApiKey}
            disabled={isTestingKey}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {isTestingKey ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
            {isTestingKey ? 'Testing Key...' : 'Test & Debug Key'}
          </button>

          {testKeyResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border ${testKeyResult.success ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {testKeyResult.success ? <CheckCircle className="text-emerald-500" size={20} /> : <AlertCircle className="text-rose-500" size={20} />}
                <span className={`text-sm font-bold ${testKeyResult.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {testKeyResult.success ? 'Success' : 'Failed'}
                </span>
                {testKeyResult.latency && <span className="text-xs text-slate-400 ml-auto">Latency: {testKeyResult.latency}</span>}
              </div>
              {testKeyResult.success ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 italic">"{testKeyResult.message}"</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-bold">{testKeyResult.error}</p>
                  <p className="text-xs text-rose-500/70 break-all">{testKeyResult.details}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
