import React, { useState } from 'react';
import { Activity, ShieldAlert, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { RateLimitInfo } from '../types';

interface RateLimitStatusProps {
  rateLimitInfo: RateLimitInfo | null;
  onSimulateRateLimit: () => Promise<void>;
}

export const RateLimitStatus: React.FC<RateLimitStatusProps> = ({
  rateLimitInfo,
  onSimulateRateLimit
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setIsSimulating(true);
    setTestResult(null);
    try {
      await onSimulateRateLimit();
      setTestResult('Executed 20 rapid requests to test Express rate limiter response headers.');
    } catch (err: any) {
      setTestResult(err.message || 'Rate limit triggered successfully (HTTP 429).');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg text-slate-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white">Express API Rate Limiting</h4>
              <span className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-full text-cyan-400 font-mono">
                X-RateLimit Enforcement
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Remaining: <strong className="text-cyan-300">{rateLimitInfo?.remaining ?? 150}</strong> / {rateLimitInfo?.limit ?? 150} calls/min
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleTest}
            disabled={isSimulating}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSimulating ? 'Testing...' : 'Test Rate Limiter (429)'}</span>
          </button>
        </div>

      </div>

      {testResult && (
        <div className="mt-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>{testResult}</span>
        </div>
      )}
    </div>
  );
};
