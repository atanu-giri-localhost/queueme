import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import logoIcon from '../../assets/queueme-icon.svg';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || '';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register, loginWithGoogle, authError, setAuthError } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleButtonRef = useRef(null);

  const handleClose = useCallback(() => {
    setAuthError(null);
    onClose();
  }, [onClose, setAuthError]);

  // Initialize Google Identity Services button
  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID) return;

    function initGoogle() {
      if (typeof window === 'undefined' || !window.google?.accounts?.id) {
        return false;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (response?.credential) {
            setGoogleLoading(true);
            try {
              await loginWithGoogle(response.credential);
              onClose();
            } catch (err) {
              console.error('Google sign-in error:', err);
            } finally {
              setGoogleLoading(false);
            }
          }
        },
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
          width: 340,
        });
      }
      return true;
    }

    if (!initGoogle()) {
      const interval = setInterval(() => {
        if (initGoogle()) {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isOpen, mode, loginWithGoogle, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    try {
      if (mode === 'register') {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      handleClose();
    } catch (err) {
      // Error is set in context
      console.warn('Authentication error:', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-6"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center p-2.5 shadow-inner">
            <img src={logoIcon} alt="QueueMe logo" className="w-full h-full object-contain" />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold text-zinc-100 tracking-tight">
            {mode === 'register' ? 'Create your QueueMe account' : 'Welcome back to QueueMe'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs">
            {mode === 'register'
              ? 'Save movies, articles, books, courses, and podcasts in your personal queue.'
              : 'Sign in to access your media backlog across all your devices.'}
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{authError}</span>
          </div>
        )}

        {/* Google OAuth Section */}
        <div className="space-y-3">
          {GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center justify-center min-h-[44px]">
              {googleLoading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Signing in with Google...</span>
                </div>
              ) : (
                <div ref={googleButtonRef} className="w-full flex justify-center" />
              )}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center space-y-1">
              <p className="text-xs font-medium text-zinc-300">Google OAuth Ready</p>
              <p className="text-[11px] text-zinc-500">
                Add your <code className="text-indigo-400 font-mono">VITE_GOOGLE_CLIENT_ID</code> in Step 4 to activate 1-click Google Sign-In.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-zinc-800" />
            <span className="absolute bg-zinc-950 px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              or with email
            </span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300 block">Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            className="w-full justify-center mt-2 shadow-lg shadow-indigo-950/40"
            icon={submitting ? Loader2 : ArrowRight}
          >
            {submitting ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center pt-2 border-t border-zinc-800/80">
          <p className="text-xs text-zinc-400">
            {mode === 'register' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'register' ? 'login' : 'register');
                setAuthError(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
            >
              {mode === 'register' ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
