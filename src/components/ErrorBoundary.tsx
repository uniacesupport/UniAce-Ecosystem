import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || String(this.state.error) || '';
      const isFirestoreError = errorMessage.includes('permission-denied') || 
                               errorMessage.includes('offline') ||
                               errorMessage.includes('Backend didn\'t respond');

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isFirestoreError ? 'Connection Issue' : 'Something went wrong'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {isFirestoreError 
                  ? "We're having trouble reaching the database. This could be a temporary network issue or a configuration problem."
                  : "An unexpected error occurred. Our team has been notified."}
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-left overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Error Details</p>
                <p className="text-xs font-mono text-red-500 dark:text-red-400 break-all line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-slate-900/20"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
            
            <p className="text-[10px] text-slate-400 font-medium">
              If the problem persists, please check your internet connection or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
