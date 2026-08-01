import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Check, 
  Lock,
  FileCode
} from 'lucide-react';
import { DecryptedVaultItem, EncryptedVaultItem } from '../types';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  encryptedItems: EncryptedVaultItem[];
  decryptedItems: DecryptedVaultItem[];
  onImportItems: (importedDecrypted: Omit<DecryptedVaultItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  encryptedItems,
  decryptedItems,
  onImportItems
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportType, setExportType] = useState<'encrypted' | 'decrypted'>('encrypted');
  const [confirmWarningText, setConfirmWarningText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadEncrypted = () => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      itemsCount: encryptedItems.length,
      encryptedVaultItems: encryptedItems
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-encrypted-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDecryptedCSV = () => {
    if (confirmWarningText !== 'EXPORT') {
      alert('Please type "EXPORT" to confirm unencrypted export.');
      return;
    }

    const headers = ['Title', 'Username', 'Password', 'Category', 'URL', 'Notes', 'Tags'];
    const rows = decryptedItems.map(item => [
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.username || '').replace(/"/g, '""')}"`,
      `"${(item.password || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.url || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      `"${(item.tags ? item.tags.join(';') : '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-PLAINTEXT-passwords-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Reading file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        
        // Check if CSV
        if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter(l => l.trim());
          if (lines.length <= 1) {
            setImportStatus('Error: CSV file is empty or missing data rows.');
            return;
          }

          const parsed: Omit<DecryptedVaultItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [];
          for (let i = 1; i < lines.length; i++) {
            // Regex to parse CSV with quotes
            const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length >= 3) {
              parsed.push({
                title: cols[0] || 'Imported Entry',
                username: cols[1] || '',
                password: cols[2] || 'Password123!',
                category: (cols[3] as any) || 'Logins',
                url: cols[4] || '',
                notes: cols[5] || '',
                tags: cols[6] ? cols[6].split(';') : [],
                favorite: false
              });
            }
          }

          if (parsed.length > 0) {
            await onImportItems(parsed);
            setImportStatus(`Successfully imported and encrypted ${parsed.length} entries!`);
          } else {
            setImportStatus('Failed to parse valid rows from CSV.');
          }
        } else {
          setImportStatus('Error: Please upload a standard CSV export file.');
        }
      } catch (err: any) {
        setImportStatus(`Import Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Vault Backup & Import
              </h3>
              <p className="text-xs text-slate-400">
                Secure backup archives or import credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'export' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            Export Backup
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'import' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            Import CSV
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-4">
            
            {/* Export Format Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportType('encrypted')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  exportType === 'encrypted'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Encrypted JSON</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Zero-Knowledge safe backup. Passwords remain AES-256 encrypted.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportType('decrypted')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  exportType === 'decrypted'
                    ? 'bg-rose-950/40 border-rose-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Plaintext CSV</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Unencrypted passwords in plain CSV format. High security risk!
                </p>
              </button>
            </div>

            {exportType === 'encrypted' ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3">
                <p>
                  Exporting <strong>{encryptedItems.length} encrypted vault items</strong>. This file contains zero-knowledge ciphertexts that can be safely backed up to cold storage.
                </p>
                <button
                  onClick={handleDownloadEncrypted}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Encrypted JSON Backup</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-rose-950/30 rounded-xl border border-rose-500/30 text-xs text-rose-200 space-y-3">
                <div className="flex items-center space-x-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>WARNING: Plaintext Password Export</span>
                </div>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  Exporting plaintext passwords creates an unencrypted file on your computer disk. Anyone with access to your device can read your passwords.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Type "EXPORT" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmWarningText}
                    onChange={(e) => setConfirmWarningText(e.target.value)}
                    placeholder="EXPORT"
                    className="w-full px-3 py-2 bg-slate-950 border border-rose-500/40 rounded-xl text-white text-xs font-mono uppercase focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleDownloadDecryptedCSV}
                  disabled={confirmWarningText !== 'EXPORT'}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Unencrypted CSV</span>
                </button>
              </div>
            )}

          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3 text-center">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
              <div>
                <h4 className="font-bold text-white">Upload CSV File</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Expected CSV headers: <code className="text-indigo-300">Title, Username, Password, Category, URL, Notes, Tags</code>
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
            </div>

            {importStatus && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
                {importStatus}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
