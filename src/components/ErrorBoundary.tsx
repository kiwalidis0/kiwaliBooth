import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearSessionFromDb } from '../utils/sessionStorageDb';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleResetAndRestart = async (): Promise<void> => {
    try {
      await clearSessionFromDb();
      localStorage.removeItem('kb_custom_theme');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error clearing storage in ErrorBoundary:', e);
    }
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50 dark:bg-[#0F0F12] text-stone-900 dark:text-stone-100 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-2xl border border-stone-200 dark:border-stone-800 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-rose-100 dark:bg-rose-950/60 text-rose-500 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              📸
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-fredoka font-bold tracking-tight">
                Oops, the booth stuttered!
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                An unexpected error occurred while rendering the photo studio. Don&apos;t worry, your device is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left text-xs bg-stone-100 dark:bg-stone-950 p-3 rounded-xl overflow-x-auto text-stone-600 dark:text-stone-400 font-mono max-h-28">
                {this.state.error.message || 'Unknown error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl font-fredoka font-semibold text-sm bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
              >
                Try Reloading
              </button>
              <button
                type="button"
                onClick={this.handleResetAndRestart}
                className="flex-1 py-3 px-4 rounded-xl font-fredoka font-semibold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                Clear Data &amp; Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
