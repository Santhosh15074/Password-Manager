import React, { useState } from 'react';
import { 
  Cpu, 
  Key, 
  Lock, 
  ShieldCheck, 
  Database, 
  Code, 
  Check, 
  Copy, 
  Sparkles, 
  ArrowRight,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';
import { deriveKeys, encryptData, generateRandomSaltHex } from '../lib/crypto';
import { User } from '../types';

interface CryptoInspectorProps {
  user: User | null;
}

export const CryptoInspector: React.FC<CryptoInspectorProps> = ({ user }) => {
  const [testPassword, setTestPassword] = useState('MySuperMasterPassword123!');
  const [testPayloadText, setTestPayloadText] = useState(
    JSON.stringify({
      title: 'Banking Portal',
      username: 'alice@aegis.io',
      password: 'StrongEncryptedPassword#2026',
      notes: 'PIN: 9876'
    }, null, 2)
  );

  const [isCalculating, setIsCalculating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [inspectionResult, setInspectionResult] = useState<{
    vaultSaltHex: string;
    authSaltHex: string;
    derivedMasterKeyHex: string;
    derivedAuthSecretHex: string;
    ivHex: string;
    ciphertextHex: string;
    authTagHex: string;
    serverPayloadJson: string;
    executionTimeMs: number;
  } | null>(null);

  const handleRunInspector = async () => {
    setIsCalculating(true);
    const startTime = performance.now();

    try {
      const vSalt = user?.vaultSalt || generateRandomSaltHex(16);
      const aSalt = user?.authSalt || generateRandomSaltHex(16);

      // Derive keys
      const derived = await deriveKeys(testPassword, vSalt, aSalt, 100000);

      // Encrypt payload
      const encrypted = await encryptData(testPayloadText, derived.masterKey);

      const endTime = performance.now();

      const mockServerRecord = {
        id: 'vitem_8f9a2c1b',
        userId: user?.id || 'usr_demo123',
        ciphertext: encrypted.ciphertextBase64,
        iv: encrypted.ivBase64,
        category: 'Logins',
        favorite: true,
        updatedAt: Date.now()
      };

      setInspectionResult({
        vaultSaltHex: vSalt,
        authSaltHex: aSalt,
        derivedMasterKeyHex: derived.masterKeyHex,
        derivedAuthSecretHex: derived.authSecretHex,
        ivHex: encrypted.ivHex,
        ciphertextHex: encrypted.ciphertextHex,
        authTagHex: encrypted.authTagHex,
        serverPayloadJson: JSON.stringify(mockServerRecord, null, 2),
        executionTimeMs: Math.round(endTime - startTime)
      });
    } catch (err) {
      console.error('Crypto calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Cpu className="w-4 h-4" />
          <span>Interactive Cryptography & Zero-Knowledge Inspector</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Client-Side Key Derivation & AES-256-GCM Pipeline
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl">
          Inspect how your Master Password derives 256-bit keys via PBKDF2 SHA-256 (100,000 rounds) and encrypts credentials into AES-256-GCM payloads before network transmission.
        </p>
      </div>

      {/* Input Test Bench */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Master Password Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            1. Test Master Password
          </label>
          <input
            type="text"
            id="input-crypto-test-password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-[11px] text-slate-500">
            Used as the secret seed input for PBKDF2 key derivation.
          </p>
        </div>

        {/* Unencrypted JSON Payload Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            2. Plaintext Credential JSON Payload
          </label>
          <textarea
            id="input-crypto-test-payload"
            value={testPayloadText}
            onChange={(e) => setTestPayloadText(e.target.value)}
            rows={4}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

      </div>

      {/* Run Simulation Button */}
      <div className="text-center">
        <button
          id="btn-run-crypto-simulation"
          onClick={handleRunInspector}
          disabled={isCalculating}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isCalculating ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Execute Zero-Knowledge Key Derivation & Encryption</span>
            </>
          )}
        </button>
      </div>

      {/* Live Results Panel */}
      {inspectionResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Cryptographic Output Breakdown ({inspectionResult.executionTimeMs} ms execution time)</span>
            </h3>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
              Web Crypto API Native
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Vault Salt Hex */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Vault Salt (16 Bytes / 128 Bits Hex)</span>
                <button onClick={() => handleCopy(inspectionResult.vaultSaltHex, 'vsalt')} className="text-slate-500 hover:text-slate-300">
                  {copiedKey === 'vsalt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-mono text-xs text-indigo-300 break-all select-all">
                {inspectionResult.vaultSaltHex}
              </p>
            </div>

            {/* Auth Salt Hex */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Auth Salt (16 Bytes / 128 Bits Hex)</span>
                <button onClick={() => handleCopy(inspectionResult.authSaltHex, 'asalt')} className="text-slate-500 hover:text-slate-300">
                  {copiedKey === 'asalt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-mono text-xs text-indigo-300 break-all select-all">
                {inspectionResult.authSaltHex}
              </p>
            </div>

            {/* Derived AES-GCM Master Key */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold text-emerald-400">Derived Master Key (256-bit AES-GCM) — NEVER SENT TO SERVER</span>
                <button onClick={() => handleCopy(inspectionResult.derivedMasterKeyHex, 'mkey')} className="text-slate-500 hover:text-slate-300">
                  {copiedKey === 'mkey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-mono text-xs text-emerald-300 break-all select-all">
                {inspectionResult.derivedMasterKeyHex}
              </p>
            </div>

            {/* Derived Auth Secret */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold text-cyan-400">Derived Auth Secret (PBKDF2 Server Token)</span>
                <button onClick={() => handleCopy(inspectionResult.derivedAuthSecretHex, 'asecret')} className="text-slate-500 hover:text-slate-300">
                  {copiedKey === 'asecret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-mono text-xs text-cyan-300 break-all select-all">
                {inspectionResult.derivedAuthSecretHex}
              </p>
            </div>

            {/* Initialization Vector (IV) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Initialization Vector (12-Byte IV)</span>
                <button onClick={() => handleCopy(inspectionResult.ivHex, 'iv')} className="text-slate-500 hover:text-slate-300">
                  {copiedKey === 'iv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-mono text-xs text-amber-300 break-all select-all">
                {inspectionResult.ivHex}
              </p>
            </div>

            {/* AES-GCM Auth Tag */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">GCM Authentication Tag (16-Byte Auth Tag)</span>
                <button onClick={() => handleCopy(inspectionResult.authTagHex, 'atag')} className="text-slate-500 hover:text-slate-300">
                  {copiedKey === 'atag' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-mono text-xs text-amber-300 break-all select-all">
                {inspectionResult.authTagHex}
              </p>
            </div>

          </div>

          {/* Exact Server Database Record Proof */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Exact Server Database Record (Zero-Knowledge Proof)</span>
              </h4>
              <button
                onClick={() => handleCopy(inspectionResult.serverPayloadJson, 'spayload')}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
              >
                {copiedKey === 'spayload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy JSON</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto select-all">
              {inspectionResult.serverPayloadJson}
            </pre>
            <p className="text-[11px] text-slate-500 italic">
              Notice that titles, usernames, passwords, and notes are completely absent from the server record. Only the Base64 encrypted ciphertext blob exists in the server database!
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
