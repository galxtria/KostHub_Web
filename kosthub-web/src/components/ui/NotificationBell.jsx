import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell as BellIcon, CheckCheck } from 'lucide-react';
import api from '../../api/axios';

/**
 * Lonceng notifikasi fungsional: badge unread, dropdown daftar,
 * klik item = tandai dibaca + navigasi.
 */
export default function NotificationBell({ variant = 'desktop' }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef(null);

  const load = async () => {
    try {
      const r = await api.get('/notifications');
      setItems(r.data.data || []);
      setUnread(r.data.unread_count || 0);
    } catch {
      /* abaikan — lonceng tetap tampil tanpa badge */
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read_at) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      try { await api.post(`/notifications/${n.id}/read`); } catch { /* abaikan */ }
    }
    if (n.link) nav(n.link);
  };

  const readAll = async () => {
    try {
      await api.post('/notifications/read-all');
      setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
      setUnread(0);
    } catch { /* abaikan */ }
  };

  if (variant === 'mobile') {
    return (
      <div className="relative" ref={boxRef}>
        <button
          onClick={() => { setOpen((v) => !v); if (!open) load(); }}
          className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-soft border border-slate-100"
          title="Notifikasi"
        >
          <BellIcon className="w-5 h-5 text-kost-700" />
          {unread > 0 && <span className="absolute top-2 right-2 min-w-4 h-4 px-1 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
        </button>
        {open && <Dropdown items={items} unread={unread} onItem={openItem} onReadAll={readAll} align="right" />}
      </div>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
        title="Notifikasi"
      >
        <BellIcon className="w-5 h-5" />
        {unread > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && <Dropdown items={items} unread={unread} onItem={openItem} onReadAll={readAll} align="right" />}
    </div>
  );
}

function Dropdown({ items, unread, onItem, onReadAll, align }) {
  return (
    <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} w-[320px] max-w-[85vw] bg-white border border-slate-100 rounded-2xl shadow-soft-lg overflow-hidden z-50 animate-fade-in`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-bold text-slate-800">Notifikasi {unread > 0 && <span className="text-kost-600">({unread} baru)</span>}</p>
        {unread > 0 && (
          <button onClick={onReadAll} className="inline-flex items-center gap-1 text-[11px] font-bold text-kost-700 hover:underline">
            <CheckCheck className="w-3.5 h-3.5" /> Tandai dibaca
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center px-4 py-8">Belum ada notifikasi.</p>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              onClick={() => onItem(n)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!n.read_at ? 'bg-kost-50/40' : ''}`}
            >
              <p className="text-[13px] font-bold text-slate-800 leading-snug flex items-center gap-1.5">
                {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-kost-600 shrink-0" />}
                <span className="truncate">{n.judul}</span>
              </p>
              {n.pesan && <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-0.5 ml-3">{n.pesan}</p>}
              <p className="text-[10px] text-slate-300 mt-1 ml-3">{String(n.created_at || '').slice(0, 16).replace('T', ' ')}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
