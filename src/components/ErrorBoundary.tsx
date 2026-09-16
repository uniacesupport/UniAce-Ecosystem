import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw, ChevronDown } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((reset: () => void, error: Error | null) => ReactNode);
  onReset?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught error${this.props.componentName ? ` in ${this.props.componentName}` : ''}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.handleReset, this.state.error);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 min-h-[360px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/40">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-sm">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Something went wrong in this view
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                UniAce encountered a temporary glitch loading this section, but your learning data and progress remain completely safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Home size={16} />
                Return to Hub
              </button>
              <button
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
            </div>

            {this.state.error && (
              <div className="pt-2 text-left">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 mx-auto transition-colors"
                >
                  <span>{this.state.showDetails ? 'Hide technical details' : 'Show technical details'}</span>
                  <ChevronDown size={12} className={`transform transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`} />
                </button>
                {this.state.showDetails && (
                  <pre className="mt-3 p-3 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 text-[11px] rounded-xl overflow-x-auto max-h-36 font-mono whitespace-pre-wrap">
                    {this.state.error.message || String(this.state.error)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

