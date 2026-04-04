import React, { useState, useEffect } from 'react';
import { Zap, Key, Loader2, CheckCircle, AlertCircle, ChevronLeft, Send, History, Trash2, Copy, Code, Globe, Settings, Plus, X, Clock, Database, Shield, Search } from 'lucide-react';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface ApiRequest {
  id: string;
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  body: string;
  timestamp: number;
  status?: number;
  response?: any;
  duration?: number;
}

export const ApiDebuggerPage = ({ onBack, showToast }: { onBack: () => void, showToast: (message: string, type: 'success' | 'error' | 'info') => void }) => {
  // Original Key Testing State
  const [testKeyProvider, setTestKeyProvider] = useState<string>('gemini_direct');
  const [testKeyInput, setTestKeyInput] = useState('');
  const [testKeyResult, setTestKeyResult] = useState<any>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);

  // Advanced Debugger State
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('/api/admin/system-config');
  const [requestHeaders, setRequestHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [requestBody, setRequestBody] = useState('{\n  "test": true\n}');
  const [activeRequestTab, setActiveRequestTab] = useState<'body' | 'headers' | 'auth'>('body');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState<{ status: number; data: any; headers: any; duration: number } | null>(null);
  const [history, setHistory] = useState<ApiRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('uniace_api_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('uniace_api_history', JSON.stringify(history.slice(0, 20)));
  }, [history]);

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

  const executeRequest = async () => {
    setIsExecuting(true);
    setResponse(null);
    const startTime = Date.now();

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headersObj: Record<string, string> = {
        'Authorization': `Bearer ${idToken}`
      };
      requestHeaders.forEach(h => {
        if (h.key && h.value) headersObj[h.key] = h.value;
      });

      const options: RequestInit = {
        method,
        headers: headersObj,
      };

      if (method !== 'GET' && method !== 'HEAD' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k] = v; });

      const newResponse = {
        status: res.status,
        data,
        headers,
        duration
      };

      setResponse(newResponse);

      // Add to history
      const newHistoryItem: ApiRequest = {
        id: Date.now().toString(),
        method,
        url,
        headers: [...requestHeaders],
        body: requestBody,
        timestamp: Date.now(),
        status: res.status,
        response: data,
        duration
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));

      if (res.ok) {
        showToast(`Request successful (${res.status})`, "success");
      } else {
        showToast(`Request failed (${res.status})`, "error");
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setResponse({
        status: 0,
        data: { error: error.message || "Network Error", details: error.stack },
        headers: {},
        duration
      });
      showToast("Network error or request failed", "error");
    } finally {
      setIsExecuting(false);
    }
  };

  const addHeader = () => setRequestHeaders([...requestHeaders, { key: '', value: '' }]);
  const removeHeader = (index: number) => setRequestHeaders(requestHeaders.filter((_, i) => i !== index));
  const updateHeader = (index: number, field: 'key' | 'value', val: string) => {
    const newHeaders = [...requestHeaders];
    newHeaders[index][field] = val;
    setRequestHeaders(newHeaders);
  };

  const loadFromHistory = (item: ApiRequest) => {
    setMethod(item.method);
    setUrl(item.url);
    setRequestHeaders(item.headers);
    setRequestBody(item.body);
    showToast("Loaded from history", "info");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('uniace_api_history');
    showToast("History cleared", "info");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  };

  const presets = [
    { name: 'AI Status', method: 'GET', url: '/api/admin/ai-status' },
    { name: 'System Config', method: 'GET', url: '/api/admin/config' },
    { name: 'Debug Email', method: 'GET', url: '/api/admin/debug-email' },
    { name: 'AI Mode', method: 'GET', url: '/api/admin/ai-mode' },
    { name: 'RAG Content', method: 'GET', url: '/api/admin/rag-content' },
    { name: 'Struggle Analytics', method: 'GET', url: '/api/admin/struggle-analytics' },
    { name: 'Chat Analytics', method: 'GET', url: '/api/admin/chat-analytics' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showHistory ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <History size={18} />
            History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Request & Key Testing */}
        <div className="lg:col-span-7 space-y-8">
          {/* Advanced Request Builder */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="text-blue-500" size={20} />
                Request Builder
              </h3>
              <div className="flex items-center gap-2">
                {presets.map(p => (
                  <button 
                    key={p.name}
                    onClick={() => { setMethod(p.method); setUrl(p.url); }}
                    className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-blue-500 hover:border-blue-200 transition-all"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-3">
                <select 
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 font-bold text-sm text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
                <div className="flex-grow relative">
                  <input 
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter endpoint URL..."
                    className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
                <button 
                  onClick={executeRequest}
                  disabled={isExecuting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isExecuting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Send
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700">
                  {(['body', 'headers', 'auth'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveRequestTab(t)}
                      className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all relative ${activeRequestTab === t ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t}
                      {activeRequestTab === t && <motion.div layoutId="reqTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
                    </button>
                  ))}
                </div>

                <div className="min-h-[200px]">
                  {activeRequestTab === 'body' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JSON Body</span>
                        <button onClick={() => {
                          try {
                            setRequestBody(JSON.stringify(JSON.parse(requestBody), null, 2));
                          } catch (e) { showToast("Invalid JSON", "error"); }
                        }} className="text-[10px] text-indigo-500 hover:underline font-bold">Beautify</button>
                      </div>
                      <textarea 
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        className="w-full h-48 bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder='{ "key": "value" }'
                      />
                    </div>
                  )}

                  {activeRequestTab === 'headers' && (
                    <div className="space-y-3">
                      {requestHeaders.map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            placeholder="Key"
                            value={h.key}
                            onChange={(e) => updateHeader(i, 'key', e.target.value)}
                            className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-3 py-2 text-xs outline-none"
                          />
                          <input 
                            placeholder="Value"
                            value={h.value}
                            onChange={(e) => updateHeader(i, 'value', e.target.value)}
                            className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-3 py-2 text-xs outline-none"
                          />
                          <button onClick={() => removeHeader(i)} className="p-2 text-slate-400 hover:text-rose-500">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button onClick={addHeader} className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:underline">
                        <Plus size={14} /> Add Header
                      </button>
                    </div>
                  )}

                  {activeRequestTab === 'auth' && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <Shield size={20} />
                        <div>
                          <p className="text-sm font-bold">Bearer Token Authentication</p>
                          <p className="text-xs opacity-70">The system automatically injects your current Firebase ID Token into the Authorization header.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Original API Key Debugger (Integrated) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Key className="text-indigo-500" size={24} />
              Provider Key Validator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                  className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isTestingKey ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                  {isTestingKey ? 'Testing...' : 'Validate Provider Key'}
                </button>
              </div>

              <div className="flex flex-col justify-center">
                {testKeyResult ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-2xl border h-full flex flex-col justify-center ${testKeyResult.success ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800'}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {testKeyResult.success ? <CheckCircle className="text-emerald-500" size={20} /> : <AlertCircle className="text-rose-500" size={20} />}
                      <span className={`text-sm font-bold ${testKeyResult.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {testKeyResult.success ? 'Key is Valid' : 'Validation Failed'}
                      </span>
                    </div>
                    <p className={`text-xs ${testKeyResult.success ? 'text-emerald-600' : 'text-rose-600'} break-words`}>
                      {testKeyResult.success ? testKeyResult.message : testKeyResult.error}
                    </p>
                  </motion.div>
                ) : (
                  <div className="h-full border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                    <Settings className="text-slate-200 dark:text-slate-700 mb-2" size={32} />
                    <p className="text-xs text-slate-400">Select a provider and enter a key to run a live validation check.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Response & History */}
        <div className="lg:col-span-5 space-y-8">
          {/* Response Viewer */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="text-emerald-500" size={20} />
                Response
              </h3>
              {response && (
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${response.status >= 200 && response.status < 300 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    Status: {response.status}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock size={12} />
                    {response.duration}ms
                  </div>
                </div>
              )}
            </div>

            <div className="flex-grow p-6 overflow-hidden flex flex-col">
              {response ? (
                <div className="flex-grow flex flex-col space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Body</span>
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                      className="flex items-center gap-1 text-[10px] text-indigo-500 hover:underline font-bold"
                    >
                      <Copy size={12} /> Copy JSON
                    </button>
                  </div>
                  <div className="flex-grow bg-slate-900 rounded-2xl p-4 overflow-auto font-mono text-xs custom-scrollbar">
                    <pre className="text-emerald-400">
                      {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}
                    </pre>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Headers</span>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 max-h-[150px] overflow-auto">
                      {Object.entries(response.headers).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[10px] py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <span className="font-bold text-slate-500">{k}:</span>
                          <span className="text-slate-700 dark:text-slate-300 break-all ml-4 text-right">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                    <Send className="text-slate-200 dark:text-slate-700" size={32} />
                  </div>
                  <h4 className="font-bold text-slate-400">No Request Executed</h4>
                  <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Configure your request and hit Send to see the response here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Sidebar (Animated) */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="text-indigo-500" size={24} />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Request History</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={clearHistory} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Clear History">
                    <Trash2 size={20} />
                  </button>
                  <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-grow overflow-auto p-6 space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <History size={48} className="mb-4" />
                    <p className="font-bold">No history yet</p>
                    <p className="text-xs mt-1">Your recent requests will appear here.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase ${item.method === 'GET' ? 'text-blue-500' : item.method === 'POST' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {item.method}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate mb-2">
                        {item.url}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${item.status && item.status < 300 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {item.status || 'ERR'}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {item.duration}ms
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

