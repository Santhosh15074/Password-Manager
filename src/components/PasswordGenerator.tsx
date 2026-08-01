import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Zap, 
  Layers
} from 'lucide-react';
import { PasswordGenOptions } from '../types';
import { generatePassword, evaluatePasswordStrength } from '../lib/crypto';

export const PasswordGenerator: React.FC = () => {
  const [options, setOptions] = useState<PasswordGenOptions>({
    length: 20,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: true,
    isPassphrase: false,
    passphraseWordsCount: 4,
    passphraseSeparator: '-'
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const refreshPassword = () => {
    const pwd = generatePassword(options);
    setGeneratedPassword(pwd);
  };

  useEffect(() => {
    refreshPassword();
  }, [options]);

  const strength = evaluatePasswordStrength(generatedPassword);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-3">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Cryptographic Password & Passphrase Generator
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Uses browser-native Web Crypto API (<code className="text-indigo-300">window.crypto.getRandomValues</code>) for high-entropy secure values.
        </p>
      </div>

      {/* Generated Password Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 overflow-hidden">
          <div className="truncate font-mono text-lg sm:text-2xl text-slate-100 font-bold tracking-wider select-all">
            {generatedPassword}
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="btn-generator-refresh"
              onClick={refreshPassword}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl transition-all cursor-pointer"
              title="Regenerate Password"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              id="btn-generator-copy"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Strength Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Quality Grade
            </span>
            <span className={`text-sm font-bold block ${
              strength.score >= 75 ? 'text-emerald-400' :
              strength.score >= 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {strength.label}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Entropy
            </span>
            <span className="text-sm font-bold text-slate-200 block">
              {strength.entropyBits} bits
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Crack Estimate
            </span>
            <span className="text-sm font-bold text-slate-200 block truncate">
              {strength.crackTimeDisplay}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Character Length
            </span>
            <span className="text-sm font-bold text-indigo-400 block">
              {generatedPassword.length} chars
            </span>
          </div>
        </div>

      </div>

      {/* Generator Settings Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Passphrase Mode Switch */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Generation Mode</span>
            </h4>
            <p className="text-xs text-slate-400">
              Switch between random character password or memorable multi-word passphrase.
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="btn-mode-password"
              type="button"
              onClick={() => setOptions({ ...options, isPassphrase: false })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !options.isPassphrase ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Password
            </button>
            <button
              id="btn-mode-passphrase"
              type="button"
              onClick={() => setOptions({ ...options, isPassphrase: true })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                options.isPassphrase ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Memorable Passphrase
            </button>
          </div>
        </div>

        {!options.isPassphrase ? (
          /* Random Password Controls */
          <div className="space-y-5">
            {/* Length Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Password Length: <span className="text-indigo-400 font-mono text-sm font-bold">{options.length}</span>
                </label>
                <span className="text-[11px] text-slate-500">Min 8 • Max 64</span>
              </div>
              <input
                type="range"
                id="slider-password-length"
                min={8}
                max={64}
                value={options.length}
                onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Character Set Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  id="checkbox-opt-uppercase"
                  checked={options.useUppercase}
                  onChange={(e) => setOptions({ ...options, useUppercase: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">Uppercase Letters (A-Z)</span>
              </label>

              <label className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  id="checkbox-opt-lowercase"
                  checked={options.useLowercase}
                  onChange={(e) => setOptions({ ...options, useLowercase: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">Lowercase Letters (a-z)</span>
              </label>

              <label className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  id="checkbox-opt-numbers"
                  checked={options.useNumbers}
                  onChange={(e) => setOptions({ ...options, useNumbers: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">Numbers (0-9)</span>
              </label>

              <label className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  id="checkbox-opt-symbols"
                  checked={options.useSymbols}
                  onChange={(e) => setOptions({ ...options, useSymbols: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">Symbols (!@#$%^&*)</span>
              </label>

              <label className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 sm:col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="checkbox-opt-ambiguous"
                  checked={options.excludeAmbiguous}
                  onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">
                  Exclude Ambiguous Characters (<code className="text-amber-400">I, 1, l, O, 0</code>)
                </span>
              </label>
            </div>
          </div>
        ) : (
          /* Memorable Passphrase Controls */
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Word Count: <span className="text-indigo-400 font-mono text-sm font-bold">{options.passphraseWordsCount}</span>
                </label>
                <span className="text-[11px] text-slate-500">Min 3 • Max 8</span>
              </div>
              <input
                type="range"
                id="slider-passphrase-words"
                min={3}
                max={8}
                value={options.passphraseWordsCount}
                onChange={(e) => setOptions({ ...options, passphraseWordsCount: Number(e.target.value) })}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Word Separator
              </label>
              <input
                type="text"
                id="input-passphrase-separator"
                maxLength={3}
                value={options.passphraseSeparator}
                onChange={(e) => setOptions({ ...options, passphraseSeparator: e.target.value })}
                className="w-32 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
