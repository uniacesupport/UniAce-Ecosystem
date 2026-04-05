import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Key, Loader2, Save, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ApiKeyManagerModalProps {
  provider: string;
  onClose: () => void;
}

export default function ApiKeyManagerModal({ provider, onClose }: ApiKeyManagerModalProps) {
  const [keys, setKeys] = useState<{ key: string; isExhausted: boolean; exhaustedAt?: number }[]>([]);
  const [newKey, setNewKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, [provider]);

  const fetchKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'system_settings', 'api_keys');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const providerData = data[provider] || { keys: [] };
        setKeys(providerData.keys || []);
      } else {
        setKeys([]);
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    
    const inputKeys = newKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const newKeysToAdd: { key: string; isExhausted: boolean; exhaustedAt?: number }[] = [];
    let duplicateFound = false;

    for (const k of inputKeys) {
      if (keys.some(existing => existing.key === k)) {
        duplicateFound = true;
        continue;
      }
      newKeysToAdd.push({ key: k, isExhausted: false });
    }

    if (newKeysToAdd.length > 0) {
      setKeys([...keys, ...newKeysToAdd]);
      setNewKey('');
      setError(duplicateFound ? 'Some keys were already present and skipped.' : null);
    } else if (duplicateFound) {
      setError('All provided keys already exist.');
    }
  };

  const handleRemoveKey = (indexToRemove: number) => {
    setKeys(keys.filter((_, index) => index !== indexToRemove));
  };

  const handleResetExhaustion = (indexToReset: number) => {
    const newKeys = [...keys];
    newKeys[indexToReset].isExhausted = false;
    newKeys[indexToReset].exhaustedAt = undefined;
    setKeys(newKeys);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const docRef = doc(db, 'system_settings', 'api_keys');
      
      // Fetch current data to not overwrite other providers
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists() ? docSnap.data() : {};
      
      await setDoc(docRef, {
        ...currentData,
        [provider]: {
          keys: keys
        }
      });
      
      onClose();
    } catch (err) {
      console.error('Error saving API keys:', err);
      setError('Failed to save API keys.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{provider} API Keys</h2>
              <p className="text-xs text-slate-500">Manage keys for dynamic rotation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-500">Loading keys...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                  placeholder={`Enter ${provider} API key(s), separate multiple with commas...`}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
                <button
                  onClick={handleAddKey}
                  disabled={!newKey.trim()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Key
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Configured Keys ({keys.length})</h3>
                
                {keys.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Key className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-slate-500">No API keys configured for this provider.</p>
                    <p className="text-xs text-slate-400 mt-1">Add a key above to enable this AI service.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keys.map((k, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${k.isExhausted ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <div className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate">
                            {k.key.substring(0, 8)}...{k.key.substring(k.key.length - 4)}
                          </div>
                          {k.isExhausted && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold uppercase rounded-md shrink-0">
                              Rate Limited
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {k.isExhausted && (
                            <button
                              onClick={() => handleResetExhaustion(index)}
                              className="px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                            >
                              Reset Status
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveKey(index)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove Key"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
