import { SearchX } from 'lucide-react';

export default function EmptyState({ icon, title = 'Belum ada data', message = 'Data yang Anda cari belum tersedia.', action, actionLabel }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-kost-50 flex items-center justify-center mb-4">
        {icon && typeof icon === 'string' && icon.length <= 4 ? (
          <span className="text-3xl">{icon}</span>
        ) : (
          <SearchX className="w-8 h-8 text-kost-600" />
        )}
      </div>
      <h3 className="text-lg font-bold font-heading text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">{message}</p>
      {action && (
        <button onClick={action} className="btn-primary mt-6">
          {actionLabel || 'Tambah Baru'}
        </button>
      )}
    </div>
  );
}
