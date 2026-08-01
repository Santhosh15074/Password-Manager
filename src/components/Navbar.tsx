import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  Cpu, 
  LogOut, 
  Clock, 
  Download,
  Activity,
  User as UserIcon
} from 'lucide-react';
import { User, RateLimitInfo } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'vault' | 'generator' | 'audit' | 'inspector';
  setActiveTab: (tab: 'vault' | 'generator' | 'audit' | 'inspector') => void;
  onLock: () => void;
  onLogout: () => void;
  onOpenExportImport: () => void;
  autoLockMinutes: number;
  setAutoLockMinutes: (min: number) => void;
  rateLimitInfo: RateLimitInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLock,
  onLogout,
  onOpenExportImport,
  autoLockMinutes,
  setAutoLockMinutes,
  rateLimitInfo
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Aegis Vault
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Zero-Knowledge
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Client-Side AES-256-GCM & PBKDF2
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
              <button
                id="tab-nav-vault"
                onClick={() => setActiveTab('vault')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'vault'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Vault</span>
              </button>

              <button
                id="tab-nav-generator"
                onClick={() => setActiveTab('generator')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'generator'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <KeyRound className="w-4 h-4 rotate-45" />
                <span>Generator</span>
              </button>

              <button
                id="tab-nav-audit"
                onClick={() => setActiveTab('audit')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'audit'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Security Audit</span>
              </button>

              <button
                id="tab-nav-inspector"
                onClick={() => setActiveTab('inspector')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'inspector'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Crypto Inspector</span>
              </button>
            </nav>
          )}

          {/* Right Controls */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* Rate limit status pills */}
              {rateLimitInfo && (
                <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>API: {rateLimitInfo.remaining}/{rateLimitInfo.limit}</span>
                </div>
              )}

              {/* Auto-Lock Selector */}
              <div className="relative group">
                <div className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Auto-Lock:</span>
                  <select
                    id="select-autolock-time"
                    value={autoLockMinutes}
                    onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                    className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer text-slate-200"
                  >
                    <option value={1} className="bg-slate-900">1m</option>
                    <option value={5} className="bg-slate-900">5m</option>
                    <option value={15} className="bg-slate-900">15m</option>
                    <option value={30} className="bg-slate-900">30m</option>
                    <option value={0} className="bg-slate-900">Off</option>
                  </select>
                </div>
              </div>

              {/* Export / Backup */}
              <button
                id="btn-nav-export"
                onClick={onOpenExportImport}
                title="Backup or Import Vault"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Lock Button */}
              <button
                id="btn-nav-lock"
                onClick={onLock}
                title="Lock Vault Now"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>

              {/* Logout Button */}
              <button
                id="btn-nav-logout"
                onClick={onLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Bar */}
        {user && (
          <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex flex-col items-center text-xs py-1 ${activeTab === 'vault' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
            >
              <KeyRound className="w-4 h-4 mb-0.5" />
              Vault
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex flex-col items-center text-xs py-1 ${activeTab === 'generator' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
            >
              <KeyRound className="w-4 h-4 mb-0.5 rotate-45" />
              Generator
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex flex-col items-center text-xs py-1 ${activeTab === 'audit' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
            >
              <ShieldAlert className="w-4 h-4 mb-0.5" />
              Audit
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex flex-col items-center text-xs py-1 ${activeTab === 'inspector' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
            >
              <Cpu className="w-4 h-4 mb-0.5" />
              Inspector
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
