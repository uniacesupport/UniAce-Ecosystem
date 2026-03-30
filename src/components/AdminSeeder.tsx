import React, { useState } from 'react';
import { CourseService } from '../services/courseService';
import { db } from '../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminSeeder({ onComplete }: { onComplete?: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const [showConfirm, setShowConfirm] = useState(false);

  const seedData = async () => {
    setShowConfirm(false);
    setStatus('loading');
    setMessage('Migration is disabled. Courses should be managed via the Admin Dashboard.');
    
    setTimeout(() => {
      setStatus('error');
      if (onComplete) onComplete();
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Database Migration</h3>
          <p className="text-sm text-gray-500">Sync hardcoded syllabus to Firestore safely.</p>
        </div>
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={status === 'loading'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              status === 'loading' 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
            }`}
          >
            <Play className="w-4 h-4" />
            {status === 'loading' ? 'Migrating...' : 'Start Migration'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={seedData}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-lg shadow-red-500/20"
            >
              Confirm Sync
            </button>
          </div>
        )}
      </div>

      {status !== 'idle' && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          status === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
          'bg-blue-50 text-blue-700 border border-blue-100'
        }`}>
          {status === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
          {status === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
          {status === 'loading' && <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
          
          <div className="flex-1">
            <p className="font-medium">{message}</p>
            {status === 'loading' && (
              <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
