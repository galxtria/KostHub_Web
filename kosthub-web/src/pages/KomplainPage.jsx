import { useEffect, useState } from 'react';
import { Wrench, Plus, ImagePlus, X } from 'lucide-react';
import api, { imgSrc } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const KATEGORI = [
  { key: 'kerusakan', label: 'Kerusakan fasilitas' },
  { key: 'kebersihan', label: 'Kebersihan' },
  { key: 'keamanan', label: 'Keamanan' },
  { key: 'tagihan', label: 'Tagihan' },
  { key: 'lainnya', label: 'Lainnya' },
];

const STATUS_STYLE = {
  baru: 'badge-verif',
  diproses: 'badge-belum',
  selesai: 'badge-lunas',
};

export default function KomplainPage() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ room_id: '', kategori: 'kerusakan', judul: '', deskripsi: '' });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const reloadList = () => {
    api.get('/my/complaints')
      .then((r) => setList(r.data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/my/complaints').then((r) => r.data.data || []).catch(() => []),
      api.get('/my/contracts').then((r) => r.data.data || []).catch(() => []),
    ])
      .then(([complaints, contracts]) => {
        setList(complaints);
        const seen = new Map();
        contracts.forEach((c) => {
          if (c.room && !seen.has(c.room.id)) seen.set(c.room.id, c.room);
        });
        const opts = [...seen.values()];
        setRooms(opts);
        const aktif = contracts.find((c) => c.status === 'aktif');
        if (aktif?.room_id) setForm((p) => ({ ...p, room_id: String(aktif.room_id) }));
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.room_id) fd.append('room_id', form.room_id);
      fd.append('kategori', form.kategori);
      fd.append('judul', form.judul);
      fd.append('deskripsi', form.deskripsi);
      if (foto) fd.append('foto', foto);
      await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Laporan terkirim. Pemilik akan menindaklanjuti.');
      setShowForm(false);
      setForm((p) => ({ ...p, kategori: 'kerusakan', judul: '', deskripsi: '' }));
      setFoto(null);
      setFotoPreview(null);
      reloadList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim laporan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-box"><Wrench className="w-5 h-5" /></div>
          <div>
            <h2 className="page-title">Lapor Kerusakan</h2>
            <p className="page-subtitle">Sampaikan keluhan, pemilik akan menindaklanjuti</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Buat Laporan
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4 animate-fade-in">
          <h3 className="text-base font-bold font-heading text-slate-800">Laporan Baru</h3>
          {rooms.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kamar Terkait (opsional)</label>
              <select className="input" value={form.room_id} onChange={(e) => set('room_id', e.target.value)}>
                <option value="">Umum / tidak spesifik kamar</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.kost?.nama || 'Kost'} • Kamar {r.nomor_kamar}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {KATEGORI.map((k) => (
                <button
                  key={k.key} type="button" onClick={() => set('kategori', k.key)}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-colors ${
                    form.kategori === k.key
                      ? 'bg-kost-700 border-kost-700 text-white shadow-soft'
                      : 'border-slate-200 text-slate-600 hover:border-kost-400 hover:text-kost-700'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Judul</label>
            <input className="input" placeholder="cth. AC kamar tidak dingin" value={form.judul} onChange={(e) => set('judul', e.target.value)} required maxLength={150} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Deskripsi</label>
            <textarea className="input" rows={3} placeholder="Jelaskan detail masalahnya..." value={form.deskripsi} onChange={(e) => set('deskripsi', e.target.value)} required maxLength={2000} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Foto (opsional)</label>
            {fotoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={fotoPreview} alt="Bukti" className="w-full aspect-[16/9] object-cover" />
                <button
                  type="button" onClick={() => { setFoto(null); setFotoPreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-rose-500 hover:bg-white shadow-soft"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full px-4 py-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-kost-400 hover:bg-kost-50/50 transition-colors cursor-pointer">
                <ImagePlus className="w-5 h-5 text-kost-600" />
                <span className="text-sm text-slate-500 font-medium">Tambahkan foto bukti</span>
                <input
                  type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFoto(f);
                    setFotoPreview(f ? URL.createObjectURL(f) : null);
                  }}
                />
              </label>
            )}
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? <><span className="spinner" /> Mengirim...</> : 'Kirim Laporan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Batal</button>
          </div>
        </form>
      )}

      <div>
        <h3 className="text-base font-bold font-heading text-slate-800 mb-3">Riwayat Laporan</h3>
        {loading ? (
          <div className="space-y-3"><SkeletonCard lines={2} /><SkeletonCard lines={2} /></div>
        ) : list.length === 0 ? (
          <EmptyState title="Belum ada laporan" message="Laporan kerusakan atau keluhan Anda akan tercatat di sini." />
        ) : (
          <div className="space-y-3">
            {list.map((c) => (
              <div key={c.id} className="card !p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.judul}</p>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {c.kategori}
                      {c.room && ` • ${c.room.kost?.nama || ''} Kamar ${c.room.nomor_kamar}`}
                      {` • ${String(c.created_at || '').slice(0, 10)}`}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${STATUS_STYLE[c.status] || 'badge-verif'}`}>{c.status}</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{c.deskripsi}</p>
                {c.foto_url && (
                  <img src={imgSrc(c.foto_url)} alt="Bukti laporan" className="mt-2.5 rounded-xl w-full aspect-[16/9] object-cover border border-slate-100" loading="lazy" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
