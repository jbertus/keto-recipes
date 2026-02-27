
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import '@/index.css';

// Robust Error Boundary to catch render crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Critical Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1120] text-white p-4 text-center">
          <div className="max-w-md w-full bg-[#131B2D] p-8 rounded-lg border border-slate-800 shadow-xl">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Application Error</h1>
            <p className="text-slate-400 mb-6">
              We encountered an unexpected issue while loading the application.
            </p>
            <div className="bg-slate-950 p-4 rounded text-left overflow-auto max-h-40 mb-6 text-xs font-mono text-red-300">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors font-medium"
              type="button"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <HelmetProvider>
      <BrowserRouter>
        <SupabaseAuthProvider>
          <App />
        </SupabaseAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </ErrorBoundary>
);
