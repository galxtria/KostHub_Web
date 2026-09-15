import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page, last_page, from, to, total } = meta;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, current_page - Math.floor(maxVisible / 2));
  let end = Math.min(last_page, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < last_page) {
    if (end < last_page - 1) pages.push('...');
    pages.push(last_page);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-xs text-slate-400">
        Menampilkan <span className="font-semibold text-slate-700">{from}–{to}</span> dari{' '}
        <span className="font-semibold text-slate-700">{total}</span> data
      </p>

      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-100 shadow-card px-1.5 py-1.5">
        {/* Prev */}
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className="p-2 rounded-lg text-slate-500
                     hover:bg-slate-100
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-slate-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`
                min-w-[36px] h-9 rounded-lg text-sm font-semibold
                transition-all duration-200
                ${p === current_page
                  ? 'bg-kost-700 text-white shadow-soft'
                  : 'text-slate-500 hover:bg-slate-100'
                }
              `}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className="p-2 rounded-lg text-slate-500
                     hover:bg-slate-100
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
