import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { DecryptedVaultItem } from '../types';

interface DeleteModalProps {
  isOpen: boolean;
  item: DecryptedVaultItem | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirmDelete(item.id);
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete vault item');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Delete Credential
              </h3>
              <p className="text-xs text-slate-400">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
            <p>
              Are you sure you want to delete <strong className="text-white font-semibold">{item.title}</strong>
              {item.username ? <span className="text-slate-400"> ({item.username})</span> : ''}?
            </p>
            <p className="text-[11px] text-slate-400">
              This entry will be permanently removed from your zero-knowledge encrypted vault.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-delete"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Credential</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
