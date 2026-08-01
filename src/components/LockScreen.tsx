import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Cpu,
  Layers
} from 'lucide-react';
import { evaluatePasswordStrength } from '../lib/crypto';

interface LockScreenProps {
  onLogin: (username: string, masterPassword: string) => Promise<void>;
  onRegister: (username: string, masterPassword: string) => Promise<void>;
  onQuickDemo: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onLogin,
  onRegister,
  onQuickDemo,
  isLoading,
  errorMessage
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const pwdStrength = evaluatePasswordStrength(masterPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim()) {
      setLocalError('Please enter a valid username or email.');
      return;
    }

    if (!masterPassword) {
      setLocalError('Master password cannot be empty.');
      return;
    }

    if (mode === 'register') {
      if (masterPassword.length < 8) {
        setLocalError('Master password must be at least 8 characters long.');
        return;
      }
      if (masterPassword !== confirmPassword) {
        setLocalError('Master passwords do not match.');
        return;
      }
      await onRegister(username.trim(), masterPassword);
    } else {
      await onLogin(username.trim(), masterPassword);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mb-4">
          <ShieldCheck className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Aegis Zero-Knowledge Vault
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Client-side encrypted credential vault locked by your Master Password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              id="btn-lockscreen-tab-login"
              onClick={() => { setMode('login'); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="btn-lockscreen-tab-register"
              onClick={() => { setMode('register'); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create New Vault
            </button>
          </div>

          {/* Quick Demo Option Button */}
          <div className="mb-6 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-medium text-indigo-200">Instant Test Drive</span>
              </div>
              <button
                type="button"
                id="btn-quick-demo"
                onClick={onQuickDemo}
                disabled={isLoading}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-all flex items-center space-x-1"
              >
                <span>Launch Demo Vault</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Auto-creates a demo vault pre-loaded with sample encrypted entries.
            </p>
          </div>

          {(errorMessage || localError) && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{localError || errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vault Username or Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="input-auth-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. security.engineer@aegis.io"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Master Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Master Password
                </label>
                {mode === 'register' && masterPassword && (
                  <span className={`text-[11px] font-bold ${
                    pwdStrength.score >= 75 ? 'text-emerald-400' :
                    pwdStrength.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {pwdStrength.label} ({pwdStrength.entropyBits} bits entropy)
                  </span>
                )}
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showMasterPassword ? 'text' : 'password'}
                  id="input-auth-masterpassword"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowMasterPassword(!showMasterPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter Bar on Register */}
              {mode === 'register' && masterPassword && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pwdStrength.score >= 75 ? 'bg-emerald-500' :
                        pwdStrength.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(10, pwdStrength.score)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password on Register */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Master Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <input
                    type={showMasterPassword ? 'text' : 'password'}
                    id="input-auth-confirmpassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>{mode === 'login' ? 'Unlock Vault' : 'Initialize Encrypted Vault'}</span>
                </>
              )}
            </button>
          </form>

          {/* Zero-Knowledge Security Callout */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-start space-x-2.5 text-slate-400 text-xs">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-200">Zero-Knowledge Architecture:</strong> Key derivation (100,000 rounds PBKDF2 SHA-256) and AES-256-GCM encryption run strictly in your browser. The server only sees ciphertext.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
