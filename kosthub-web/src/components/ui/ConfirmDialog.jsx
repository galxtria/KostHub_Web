import { Trash2, Info } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Hapus', variant = 'danger' }) {
  if (!open) return null;

  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';
  const Icon = variant === 'danger' ? Trash2 : Info;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center
            ${variant === 'danger' ? 'bg-rose-50' : 'bg-kost-50'}
          `}>
            <Icon className={`w-7 h-7 ${variant === 'danger' ? 'text-rose-600' : 'text-kost-700'}`} />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold font-heading text-center text-slate-800 mb-2">
          {title || 'Konfirmasi'}
        </h3>
        <p className="text-sm text-center text-slate-400 mb-6 leading-relaxed">
          {message || 'Apakah Anda yakin ingin melanjutkan? Tindakan ini tidak dapat dibatalkan.'}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Batal
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`${btnClass} flex-1`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
