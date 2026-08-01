import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Star, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Tag, 
  ShieldCheck, 
  Key, 
  CreditCard, 
  FileText, 
  Code, 
  UserCheck,
  Clock,
  Filter,
  Sparkles
} from 'lucide-react';
import { CategoryType, DecryptedVaultItem } from '../types';
import { evaluatePasswordStrength } from '../lib/crypto';

interface VaultListProps {
  items: DecryptedVaultItem[];
  onAddNew: () => void;
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
  onToggleFavorite: (item: DecryptedVaultItem) => void;
}

export const VaultList: React.FC<VaultListProps> = ({
  items,
  onAddNew,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All' | 'Favorites'>('All');
  const [unmaskedIds, setUnmaskedIds] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<{ id: string; field: 'username' | 'password' } | null>(null);
  const [clipboardTimer, setClipboardTimer] = useState<number>(0);

  // Self-clearing clipboard feedback & timer
  useEffect(() => {
    if (copiedField && copiedField.field === 'password') {
      setClipboardTimer(15);
      const interval = setInterval(() => {
        setClipboardTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCopiedField(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [copiedField]);

  const handleCopy = (text: string, id: string, field: 'username' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField({ id, field });
    if (field === 'username') {
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const toggleMask = (id: string) => {
    setUnmaskedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = items.filter(item => {
    // Category match
    if (selectedCategory === 'Favorites' && !item.favorite) return false;
    if (selectedCategory !== 'All' && selectedCategory !== 'Favorites' && item.category !== selectedCategory) return false;

    // Search query match
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(q);
    const usernameMatch = item.username?.toLowerCase().includes(q);
    const urlMatch = item.url?.toLowerCase().includes(q);
    const tagsMatch = item.tags?.some(t => t.toLowerCase().includes(q));
    const notesMatch = item.notes?.toLowerCase().includes(q);

    return titleMatch || usernameMatch || urlMatch || tagsMatch || notesMatch;
  });

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'Logins': return <Key className="w-4 h-4 text-cyan-400" />;
      case 'Credit Cards': return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'Secure Notes': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'API Keys': return <Code className="w-4 h-4 text-purple-400" />;
      case 'Personal IDs': return <UserCheck className="w-4 h-4 text-indigo-400" />;
      default: return <Key className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="input-vault-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault by title, username, URL, tags..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Add Credential Button */}
        <button
          id="btn-add-credential"
          onClick={onAddNew}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {(['All', 'Favorites', 'Logins', 'Credit Cards', 'Secure Notes', 'API Keys', 'Personal IDs'] as const).map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat === 'Favorites' && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
              <span>{cat}</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-950/60 rounded-full border border-slate-800 text-slate-400">
                {cat === 'All'
                  ? items.length
                  : cat === 'Favorites'
                  ? items.filter(i => i.favorite).length
                  : items.filter(i => i.category === cat).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Credentials List Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed p-8">
          <div className="inline-flex p-4 bg-slate-800/60 rounded-2xl text-slate-400 mb-3">
            <Key className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Credentials Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No entries match "${searchQuery}". Try clearing your search filters.`
              : 'Your encrypted vault is empty. Click below to add your first password or account entry.'}
          </p>
          <button
            onClick={onAddNew}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Credential</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isUnmasked = unmaskedIds[item.id] || false;
            const strength = evaluatePasswordStrength(item.password);
            const isCopyingPassword = copiedField?.id === item.id && copiedField.field === 'password';
            const isCopyingUsername = copiedField?.id === item.id && copiedField.field === 'username';

            return (
              <div
                key={item.id}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 font-bold text-slate-200 text-base shadow-inner">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-slate-100 text-sm tracking-tight truncate max-w-[150px] sm:max-w-[180px]">
                            {item.title}
                          </h4>
                          {item.url && (
                            <a
                              href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-indigo-400 transition-colors"
                              title="Open Website"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Favorite Star & Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onToggleFavorite(item)}
                        className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                        title={item.favorite ? 'Unmark Favorite' : 'Mark Favorite'}
                      >
                        <Star className={`w-4 h-4 ${item.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                        title="Edit Credential"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-delete-${item.id}`}
                        onClick={() => onDelete(item)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Credential"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Username Row */}
                  <div className="mt-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                        Username / Account
                      </span>
                      <span className="text-xs text-slate-200 font-mono font-medium truncate block">
                        {item.username || '—'}
                      </span>
                    </div>
                    {item.username && (
                      <button
                        onClick={() => handleCopy(item.username, item.id, 'username')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                        title="Copy Username"
                      >
                        {isCopyingUsername ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Password Row */}
                  <div className="mt-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div className="truncate pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Password
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          strength.score >= 75 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          strength.score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {strength.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-200 font-mono font-medium truncate block tracking-widest mt-0.5">
                        {isUnmasked ? item.password : '••••••••••••••••'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => toggleMask(item.id)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                        title={isUnmasked ? 'Hide Password' : 'Show Password'}
                      >
                        {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleCopy(item.password, item.id, 'password')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 hover:text-white transition-all relative cursor-pointer"
                        title="Copy Password to Clipboard"
                      >
                        {isCopyingPassword ? (
                          <div className="flex items-center space-x-1 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{clipboardTimer}s</span>
                          </div>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notes Preview if available */}
                  {item.notes && (
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2 italic px-1">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Tags & Timestamp */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                    {item.tags && item.tags.length > 0 ? (
                      item.tags.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-600">No tags</span>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px]">
                    Updated {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
