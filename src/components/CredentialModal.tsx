import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  User as UserIcon, 
  Globe, 
  FileText, 
  Tag as TagIcon, 
  Star, 
  Sparkles, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Check
} from 'lucide-react';
import { CategoryType, DecryptedVaultItem } from '../types';
import { evaluatePasswordStrength, generatePassword } from '../lib/crypto';

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<DecryptedVaultItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  editingItem?: DecryptedVaultItem | null;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem
}) => {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<CategoryType>('Logins');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [favorite, setFavorite] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setUsername(editingItem.username || '');
      setPassword(editingItem.password || '');
      setCategory(editingItem.category || 'Logins');
      setUrl(editingItem.url || '');
      setNotes(editingItem.notes || '');
      setTagsInput(editingItem.tags ? editingItem.tags.join(', ') : '');
      setFavorite(Boolean(editingItem.favorite));
    } else {
      setTitle('');
      setUsername('');
      setPassword(generatePassword({
        length: 18,
        useUppercase: true,
        useLowercase: true,
        useNumbers: true,
        useSymbols: true,
        excludeAmbiguous: true,
        isPassphrase: false,
        passphraseWordsCount: 4,
        passphraseSeparator: '-'
      }));
      setCategory('Logins');
      setUrl('');
      setNotes('');
      setTagsInput('');
      setFavorite(false);
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const strength = evaluatePasswordStrength(password);

  const handleGenerateFresh = () => {
    const newPwd = generatePassword({
      length: 18,
      useUppercase: true,
      useLowercase: true,
      useNumbers: true,
      useSymbols: true,
      excludeAmbiguous: true,
      isPassphrase: false,
      passphraseWordsCount: 4,
      passphraseSeparator: '-'
    });
    setPassword(newPwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !password) return;

    setIsSaving(true);

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    await onSave({
      title: title.trim(),
      username: username.trim(),
      password,
      category,
      url: url.trim(),
      notes: notes.trim(),
      tags: parsedTags,
      favorite
    }, editingItem?.id);

    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {editingItem ? 'Edit Credential' : 'Add New Credential'}
              </h3>
              <p className="text-xs text-slate-400">
                Encrypted client-side before sending to server
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title & Favorite */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Title / Service Name *
              </label>
              <input
                type="text"
                id="input-credential-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. GitHub, AWS Console, Netflix"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                id="select-credential-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              >
                <option value="Logins">Logins</option>
                <option value="Credit Cards">Credit Cards</option>
                <option value="Secure Notes">Secure Notes</option>
                <option value="API Keys">API Keys</option>
                <option value="Personal IDs">Personal IDs</option>
              </select>
            </div>
          </div>

          {/* Username / Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Username / Account Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-credential-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. user@domain.com or admin_user"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Password Input & Generator Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Password *
              </label>
              <button
                type="button"
                id="btn-inline-generate-password"
                onClick={handleGenerateFresh}
                className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Strong Password</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="input-credential-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate password"
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter Bar */}
            {password && (
              <div className="mt-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Strength: <strong className={
                    strength.score >= 75 ? 'text-emerald-400' :
                    strength.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }>{strength.label}</strong></span>
                  <span className="text-slate-500">{strength.entropyBits} bits entropy ({strength.crackTimeDisplay})</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength.score >= 75 ? 'bg-emerald-500' :
                      strength.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(10, strength.score)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Website URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-credential-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/login"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tags (comma separated)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <TagIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-credential-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="work, social, high-priority"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Secure Notes / Instructions
            </label>
            <textarea
              id="input-credential-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Recovery codes, 2FA backup keys, security questions..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Favorite Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="checkbox-credential-favorite"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="checkbox-credential-favorite" className="text-xs text-slate-300 cursor-pointer flex items-center space-x-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Mark as Favorite</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-save-credential"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Update Credential' : 'Encrypt & Save'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
