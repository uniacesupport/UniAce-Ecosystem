import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Key, 
  Loader2, 
  Save, 
  AlertCircle, 
  Play, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  Sliders, 
  Layers, 
  Info,
  Edit3
} from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sanitizeForFirestore } from '../services/courseService';

interface ApiKeyManagerModalProps {
  provider: string;
  onClose: () => void;
}

interface DiscoveredModel {
  id: string;
  name?: string;
  contextWindow?: number;
  description?: string;
  capabilities?: {
    chat?: boolean;
    vision?: boolean;
    streaming?: boolean;
  };
}

export default function ApiKeyManagerModal({ provider, onClose }: ApiKeyManagerModalProps) {
  const [keys, setKeys] = useState<{ 
    key: string; 
    isExhausted: boolean; 
    exhaustedAt?: number; 
    testStatus?: 'idle' | 'testing' | 'success' | 'error'; 
    testError?: string 
  }[]>([]);
  const [model, setModel] = useState('');
  const [fallbackModel, setFallbackModel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestingAny, setIsTestingAny] = useState(false);

  // Discovery State
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [isCustomModelMode, setIsCustomModelMode] = useState(false);
  const [isCustomFallbackMode, setIsCustomFallbackMode] = useState(false);
  const [primarySearch, setPrimarySearch] = useState('');
  const [fallbackSearch, setFallbackSearch] = useState('');
  const [isPrimaryDropdownOpen, setIsPrimaryDropdownOpen] = useState(false);
  const [isFallbackDropdownOpen, setIsFallbackDropdownOpen] = useState(false);

  useEffect(() => {
    fetchKeysAndDiscover();
  }, [provider]);

  const fetchKeysAndDiscover = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'system_settings', 'api_keys');
      const docSnap = await getDoc(docRef);
      
      let loadedModel = '';
      let loadedFallback = '';
      let loadedKeys: any[] = [];

      if (docSnap.exists()) {
        const data = docSnap.data();
        const providerData = data[provider] || { keys: [] };
        loadedKeys = providerData.keys || [];
        loadedModel = providerData.model || '';
        loadedFallback = providerData.fallbackModel || '';
        setKeys(loadedKeys);
        setModel(loadedModel);
        setFallbackModel(loadedFallback);
      } else {
        setKeys([]);
      }

      // Automatically trigger live model discovery
      await triggerModelDiscovery(false, undefined, loadedModel, loadedFallback);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys and configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerModelDiscovery = async (
    forceRefresh: boolean = false, 
    keyOverride?: string,
    currentModelValue?: string,
    currentFallbackValue?: string
  ) => {
    setIsDiscovering(true);
    setDiscoveryError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/fetch-provider-models', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          provider, 
          apiKeyOverride: keyOverride || (newKey.trim() || undefined),
          forceRefresh 
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        setDiscoveredModels(data.models);
        
        const currentM = currentModelValue !== undefined ? currentModelValue : model;
        const currentFb = currentFallbackValue !== undefined ? currentFallbackValue : fallbackModel;
        
        // If current model is not found in discovered list and is not empty, enable custom mode
        if (currentM && !data.models.some((m: DiscoveredModel) => m.id.toLowerCase() === currentM.toLowerCase())) {
          setIsCustomModelMode(true);
        }
        if (currentFb && !data.models.some((m: DiscoveredModel) => m.id.toLowerCase() === currentFb.toLowerCase())) {
          setIsCustomFallbackMode(true);
        }
      } else {
        setDiscoveryError(data.error || 'No live models returned from provider API.');
        // If discovery failed and models are already set, keep custom mode available
        setIsCustomModelMode(true);
        setIsCustomFallbackMode(true);
      }
    } catch (err: any) {
      console.error('Model discovery error:', err);
      setDiscoveryError(err.message || 'Failed to connect to model discovery endpoint.');
      setIsCustomModelMode(true);
      setIsCustomFallbackMode(true);
    } finally {
      setIsDiscovering(false);
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
      const addedKey = newKeysToAdd[0].key;
      setNewKey('');
      setError(duplicateFound ? 'Some keys were already present and skipped.' : null);
      
      // If no models were discovered, try discovering with the newly added key
      if (discoveredModels.length === 0) {
        triggerModelDiscovery(true, addedKey);
      }
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

  const handleTestKey = async (index: number) => {
    const keyToTest = keys[index].key;
    const newKeys = [...keys];
    newKeys[index].testStatus = 'testing';
    newKeys[index].testError = undefined;
    setKeys(newKeys);
    setIsTestingAny(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/test-api-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, key: keyToTest })
      });

      const data = await res.json();
      const updatedKeys = [...keys];
      if (data.success) {
        updatedKeys[index].testStatus = 'success';
      } else {
        updatedKeys[index].testStatus = 'error';
        updatedKeys[index].testError = data.error || 'Test failed';
      }
      setKeys(updatedKeys);
    } catch (err: any) {
      const updatedKeys = [...keys];
      updatedKeys[index].testStatus = 'error';
      updatedKeys[index].testError = err.message || 'Network error';
      setKeys(updatedKeys);
    } finally {
      setIsTestingAny(false);
    }
  };

  const isModelCollision = useMemo(() => {
    if (!model.trim() || !fallbackModel.trim()) return false;
    return model.trim().toLowerCase() === fallbackModel.trim().toLowerCase();
  }, [model, fallbackModel]);

  const filteredPrimaryModels = useMemo(() => {
    if (!primarySearch.trim()) return discoveredModels;
    const q = primarySearch.toLowerCase();
    return discoveredModels.filter(m => 
      m.id.toLowerCase().includes(q) || 
      (m.name && m.name.toLowerCase().includes(q))
    );
  }, [discoveredModels, primarySearch]);

  const filteredFallbackModels = useMemo(() => {
    if (!fallbackSearch.trim()) return discoveredModels;
    const q = fallbackSearch.toLowerCase();
    return discoveredModels.filter(m => 
      m.id.toLowerCase().includes(q) || 
      (m.name && m.name.toLowerCase().includes(q))
    );
  }, [discoveredModels, fallbackSearch]);

  const handleSave = async () => {
    if (!model.trim()) {
      setError('Primary model is required. Please select or enter a valid model identifier.');
      return;
    }

    if (isModelCollision) {
      setError('Primary Model and Fallback Model cannot be identical. Please select a distinct fallback model or leave it blank.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const docRef = doc(db, 'system_settings', 'api_keys');
      
      // Fetch current data to preserve other provider configurations
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists() ? docSnap.data() : {};

      // Filter and sanitize keys array to ensure no undefined values or non-persistent UI fields
      const sanitizedKeys = keys
        .filter(k => k && typeof k.key === 'string' && k.key.trim().length > 0)
        .map(k => {
          const item: { key: string; isExhausted: boolean; exhaustedAt?: number } = {
            key: k.key.trim(),
            isExhausted: Boolean(k.isExhausted)
          };
          if (typeof k.exhaustedAt === 'number' && !isNaN(k.exhaustedAt)) {
            item.exhaustedAt = k.exhaustedAt;
          }
          return item;
        });
      
      const payload = sanitizeForFirestore({
        ...currentData,
        [provider]: {
          keys: sanitizedKeys,
          model: (model || '').trim(),
          fallbackModel: (fallbackModel || '').trim()
        }
      });

      await setDoc(docRef, payload, { merge: true });
      
      onClose();
    } catch (err: any) {
      console.error('Error saving API keys:', err);
      setError(err?.message || 'Failed to save API keys and model configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm">
              <Key size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                {provider} Configuration
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-medium">
                  Zero-Fallback Policy
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage rotation keys and live admin-discovered models
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* General Error Banner */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Action Required</span>
                {error}
              </div>
            </div>
          )}

          {/* Model Collision Warning */}
          {isModelCollision && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-amber-700 dark:text-amber-300 text-sm">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Duplicate Model Detected</span>
                Primary Model and Fallback Model cannot be the same identifier ({model}). Please select a different fallback model or clear it.
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-9 h-9 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading credentials & discovering live models...</p>
            </div>
          ) : (
            <>
              {/* Live Model Catalog Section */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Model Catalog & Routing
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => triggerModelDiscovery(true)}
                      disabled={isDiscovering}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      title="Fetch live available models from provider API"
                    >
                      <RefreshCw size={13} className={isDiscovering ? 'animate-spin text-emerald-500' : ''} />
                      {isDiscovering ? 'Discovering...' : 'Fetch Live Models'}
                    </button>
                  </div>
                </div>

                {discoveryError && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <span>Live discovery warning: {discoveryError}</span>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                        You can manually type a custom model ID below or enter an API key above to refresh live models.
                      </p>
                    </div>
                  </div>
                )}

                {discoveredModels.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>Discovered <strong>{discoveredModels.length}</strong> live models directly from {provider} API</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Model Field */}
                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Primary Model <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomModelMode(!isCustomModelMode)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Edit3 size={11} />
                        {isCustomModelMode ? 'Pick from List' : 'Custom Model ID'}
                      </button>
                    </div>

                    {isCustomModelMode || discoveredModels.length === 0 ? (
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. gemini-2.5-flash or llama-3.3-70b-versatile"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                      />
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPrimaryDropdownOpen(!isPrimaryDropdownOpen);
                            setIsFallbackDropdownOpen(false);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono text-left"
                        >
                          <span className={model ? 'text-slate-900 dark:text-white truncate' : 'text-slate-400'}>
                            {model || 'Select Primary Model...'}
                          </span>
                          <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
                        </button>

                        {isPrimaryDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                              <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <Search size={14} className="text-slate-400" />
                                <input
                                  type="text"
                                  value={primarySearch}
                                  onChange={(e) => setPrimarySearch(e.target.value)}
                                  placeholder="Search model ID or name..."
                                  className="w-full bg-transparent text-xs focus:outline-none dark:text-white"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="py-1">
                              {filteredPrimaryModels.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-400">No matching models found</div>
                              ) : (
                                filteredPrimaryModels.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setModel(m.id);
                                      setIsPrimaryDropdownOpen(false);
                                      setPrimarySearch('');
                                    }}
                                    className={`w-full px-3.5 py-2 text-left text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex flex-col gap-0.5 transition-colors ${
                                      model === m.id ? 'bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    <span className="font-mono">{m.id}</span>
                                    {m.name && m.name !== m.id && (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">{m.name}</span>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fallback Model Field */}
                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Fallback Model (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomFallbackMode(!isCustomFallbackMode)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Edit3 size={11} />
                        {isCustomFallbackMode ? 'Pick from List' : 'Custom Model ID'}
                      </button>
                    </div>

                    {isCustomFallbackMode || discoveredModels.length === 0 ? (
                      <input
                        type="text"
                        value={fallbackModel}
                        onChange={(e) => setFallbackModel(e.target.value)}
                        placeholder="Leave blank or enter distinct fallback"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                      />
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFallbackDropdownOpen(!isFallbackDropdownOpen);
                            setIsPrimaryDropdownOpen(false);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono text-left"
                        >
                          <span className={fallbackModel ? 'text-slate-900 dark:text-white truncate' : 'text-slate-400'}>
                            {fallbackModel || 'None (No Provider Fallback)'}
                          </span>
                          <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
                        </button>

                        {isFallbackDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                              <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <Search size={14} className="text-slate-400" />
                                <input
                                  type="text"
                                  value={fallbackSearch}
                                  onChange={(e) => setFallbackSearch(e.target.value)}
                                  placeholder="Search fallback model..."
                                  className="w-full bg-transparent text-xs focus:outline-none dark:text-white"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setFallbackModel('');
                                  setIsFallbackDropdownOpen(false);
                                  setFallbackSearch('');
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 italic border-b border-slate-100 dark:border-slate-700"
                              >
                                None (Clear Fallback)
                              </button>
                              {filteredFallbackModels.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-400">No matching models found</div>
                              ) : (
                                filteredFallbackModels.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setFallbackModel(m.id);
                                      setIsFallbackDropdownOpen(false);
                                      setFallbackSearch('');
                                    }}
                                    className={`w-full px-3.5 py-2 text-left text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex flex-col gap-0.5 transition-colors ${
                                      fallbackModel === m.id ? 'bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-200'
                                    } ${m.id === model ? 'opacity-40 line-through' : ''}`}
                                  >
                                    <span className="font-mono">{m.id}</span>
                                    {m.name && m.name !== m.id && (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">{m.name}</span>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Key Input Form */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Add Provider API Key(s)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                    placeholder={`Enter ${provider} API key(s), separate multiple with commas...`}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                  />
                  <button
                    onClick={handleAddKey}
                    disabled={!newKey.trim()}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-sm shrink-0"
                  >
                    <Plus size={18} />
                    Add Key
                  </button>
                </div>
              </div>

              {/* Configured Keys List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    Configured Keys Pool ({keys.length})
                  </h3>
                  {keys.length > 1 && (
                    <span className="text-xs text-slate-400">
                      Automatic round-robin rotation active
                    </span>
                  )}
                </div>
                
                {keys.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Key className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-slate-500 font-medium">No API keys configured for this provider.</p>
                    <p className="text-xs text-slate-400 mt-1">Add a key above to enable dynamic routing and live discovery.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keys.map((k, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${k.isExhausted ? 'bg-red-500' : 'bg-emerald-500'}`} />
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
                            {k.testStatus === 'testing' ? (
                              <Loader2 size={16} className="text-indigo-500 animate-spin" />
                            ) : k.testStatus === 'success' ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <Check size={16} /> Verified
                              </span>
                            ) : k.testStatus === 'error' ? (
                              <button
                                onClick={() => handleTestKey(index)}
                                disabled={isTestingAny}
                                className="px-2 py-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                                title="Click to test again"
                              >
                                <AlertTriangle size={13} /> Retest
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTestKey(index)}
                                disabled={isTestingAny}
                                className="px-2.5 py-1 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center gap-1"
                                title="Test API Key Connectivity"
                              >
                                <Play size={12} /> Test
                              </button>
                            )}

                            {k.isExhausted && (
                              <button
                                onClick={() => handleResetExhaustion(index)}
                                className="px-2.5 py-1 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                              >
                                Reset
                              </button>
                            )}

                            <button
                              onClick={() => handleRemoveKey(index)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove Key"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {k.testStatus === 'error' && k.testError && (
                          <div className="mt-1 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 p-2.5 rounded-lg flex flex-col gap-1 shadow-inner font-mono leading-relaxed break-words">
                            <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wide">
                              <AlertTriangle size={12} className="text-rose-500" />
                              <span>Diagnostics Reason:</span>
                            </div>
                            <div className="text-[11px] select-text">
                              {k.testError}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {model ? (
              <span>Target: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{model}</strong></span>
            ) : (
              <span className="text-amber-600">Model selection required</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading || !model.trim() || isModelCollision}
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
    </div>
  );
}
