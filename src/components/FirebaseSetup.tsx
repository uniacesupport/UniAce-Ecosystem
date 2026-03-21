import React, { useState } from 'react';
import { Shield, Save, Info, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function FirebaseSetup() {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    // Save to localStorage so the app can use it as a fallback
    try {
      localStorage.setItem('firebase_config_fallback', JSON.stringify(config));
    } catch (e) {
      console.warn('localStorage access denied, cannot save config locally');
    }
    window.location.reload();
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Basic validation
      if (!config.apiKey || !config.projectId) {
        throw new Error('API Key and Project ID are required to test.');
      }

      // We can't easily test the full config without initializing Firebase,
      // but we can try a simple fetch to see if the project exists.
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`, {
        method: 'GET'
      });
      
      if (response.status === 404) {
        throw new Error(`Project ID "${config.projectId}" not found or Firestore not enabled.`);
      }

      setTestResult({ success: true, message: 'Project ID found! Other settings will be tested after saving.' });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Firebase Setup</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure your backend to continue</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 items-start">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Paste your Web App configuration from the Firebase Console. 
                <a 
                  href="https://console.firebase.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-1 font-bold underline"
                >
                  Open Console <ExternalLink size={10} />
                </a>
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex gap-3 items-start">
              <Shield className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div className="space-y-2">
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  <strong>Backend Setup Required:</strong> AI Chat and Sparks require setting **Secrets** in the AI Studio editor sidebar:
                </p>
                <ul className="text-[10px] text-amber-600 dark:text-amber-400 space-y-1 list-disc ml-4">
                  <li><code>GEMINI_API_KEY</code></li>
                  <li><code>FIREBASE_SERVICE_ACCOUNT</code> (Paste the entire JSON key file)</li>
                </ul>
                <div className="flex gap-2">
                  <a 
                    href="/api/debug" 
                    target="_blank" 
                    className="text-[10px] bg-white dark:bg-slate-900 px-2 py-1 rounded border border-amber-200 dark:border-amber-800 font-bold"
                  >
                    Check Backend Status
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                { label: 'API Key', name: 'apiKey', placeholder: 'AIzaSyA...' },
                { label: 'Auth Domain', name: 'authDomain', placeholder: 'project.firebaseapp.com' },
                { label: 'Project ID', name: 'projectId', placeholder: 'your-project-id' },
                { label: 'Storage Bucket', name: 'storageBucket', placeholder: 'project.appspot.com' },
                { label: 'Messaging Sender ID', name: 'messagingSenderId', placeholder: '123456789' },
                { label: 'App ID', name: 'appId', placeholder: '1:1234:web:abcd' },
                { label: 'Measurement ID (Optional)', name: 'measurementId', placeholder: 'G-ABCDEF...' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    name={field.name}
                    placeholder={field.placeholder}
                    value={(config as any)[field.name]}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 mt-4"
            >
              <Save size={18} />
              Save Configuration
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-[10px] text-slate-400">
            These settings are stored locally in your browser for this session.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
