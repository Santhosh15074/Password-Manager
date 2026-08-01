import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  Clock, 
  Sparkles, 
  ExternalLink,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { DecryptedVaultItem } from '../types';
import { performSecurityAudit } from '../lib/security';

interface SecurityAuditViewProps {
  items: DecryptedVaultItem[];
  onFixItem: (item: DecryptedVaultItem) => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  items,
  onFixItem
}) => {
  const audit = performSecurityAudit(items);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner & Overall Score */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Vault Security Inspector</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Vault Health & Vulnerability Report
          </h2>
          <p className="text-xs text-slate-400 max-w-lg">
            Analyzes your stored credentials for weak passwords, cross-site reuse, stale age, and known breached password patterns.
          </p>
        </div>

        {/* Big Score Gauge Badge */}
        <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${getScoreColor(audit.overallScore)} shrink-0 min-w-[160px]`}>
          <span className="text-4xl font-extrabold tracking-tight">
            {audit.overallScore}<span className="text-xl">/100</span>
          </span>
          <span className="text-xs font-semibold mt-1">
            {audit.overallScore >= 85 ? 'Excellent Vault Health' :
             audit.overallScore >= 60 ? 'Needs Attention' : 'Critical Security Risks'}
          </span>
        </div>

      </div>

      {/* Audit Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Weak Passwords Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Weak Passwords</span>
            <AlertTriangle className={`w-5 h-5 ${audit.weakCount > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-100">{audit.weakCount}</div>
          <p className="text-[11px] text-slate-500">
            Passwords with low entropy or fewer than 12 characters.
          </p>
        </div>

        {/* Reused Passwords Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reused Passwords</span>
            <RefreshCw className={`w-5 h-5 ${audit.reusedCount > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-100">{audit.reusedCount}</div>
          <p className="text-[11px] text-slate-500">
            Same password reused across multiple accounts.
          </p>
        </div>

        {/* Stale Passwords Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Old / Stale (&gt;90 days)</span>
            <Clock className={`w-5 h-5 ${audit.oldCount > 0 ? 'text-cyan-400' : 'text-slate-600'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-100">{audit.oldCount}</div>
          <p className="text-[11px] text-slate-500">
            Credentials unchanged for more than 90 days.
          </p>
        </div>

        {/* Compromised Passwords Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Breached Patterns</span>
            <ShieldAlert className={`w-5 h-5 ${audit.compromisedCount > 0 ? 'text-rose-500' : 'text-slate-600'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-100">{audit.compromisedCount}</div>
          <p className="text-[11px] text-slate-500">
            Matches known leaked passwords (HIBP simulation).
          </p>
        </div>

      </div>

      {/* Actionable Findings Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Key className="w-4 h-4 text-indigo-400" />
          <span>Recommended Security Fixes</span>
        </h3>

        {/* Reused Password Groups */}
        {audit.reusedGroups.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              🚨 Reused Passwords ({audit.reusedGroups.length} groups)
            </h4>
            {audit.reusedGroups.map((group, gIdx) => (
              <div key={gIdx} className="bg-slate-950 p-4 rounded-xl border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Reused across <strong className="text-rose-400 font-bold">{group.items.length} services</strong>:</span>
                  <span className="font-mono text-slate-500">
                    Password: ••••••••
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {group.items.map(item => (
                    <div key={item.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-xs font-semibold text-slate-200 block truncate">{item.title}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{item.username}</span>
                      </div>
                      <button
                        onClick={() => onFixItem(item)}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-semibold rounded-md border border-indigo-500/30 transition-all cursor-pointer shrink-0"
                      >
                        Fix
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Weak Passwords List */}
        {audit.weakItems.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              ⚠️ Weak Passwords ({audit.weakItems.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {audit.weakItems.map(item => (
                <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-xs font-semibold text-slate-200 block truncate">{item.title}</span>
                    <span className="text-[10px] text-amber-400/90 block truncate">{item.username}</span>
                  </div>
                  <button
                    onClick={() => onFixItem(item)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer shrink-0"
                  >
                    Upgrade
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Clean Message */}
        {audit.reusedGroups.length === 0 && audit.weakItems.length === 0 && (
          <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-slate-800/80 p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-200">Vault Security in Great Shape!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              No weak or reused passwords detected in your vault entries. Excellent cryptographic hygiene!
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
