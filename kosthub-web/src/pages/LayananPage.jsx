import { useEffect, useState } from 'react';
import { Headset, Megaphone, Pencil, Trash2, Plus, X } from 'lucide-react';
import api, { imgSrc } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const STATUS = ['baru', 'diproses', 'selesai'];
const STATUS_STYLE = { baru: 'badge-verif', diproses: 'badge-belum', selesai: 'badge-lunas' };
const emptyForm = { kost_id: '', judul: '', isi: '', berlaku_sampai: '' };

export default function LayananPage() {
  const toast = useToast();
  const [tab, setTab] = useState('keluhan');

  // Keluhan
  const [keluhan, setKeluhan] = useState([]);
  const [loadingK, setLoadingK] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Pengumuman
  const [pengumuman, setPengumuman] = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [kosts, setKosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadKeluhan = () => {
    setLoadingK(true);
    api.get('/complaints', { params: filterStatus ? { status: filterStatus } : {} })
      .then((r) => setKeluhan(r.data.data || []))
      .catch(() => toast.error('Gagal memuat keluhan'))
      .finally(() => setLoadingK(false));
  };

  const loadPengumuman = () => {
    setLoadingP(true);
    Promise.all([
      api.get('/announcements/all').then((r) => r.data.data || []).catch(() => []),
      api.get('/kosts', { params: { per_page: 100 } }).then((r) => r.data.data || []).catch(() => []),
    ])
      .then(([a, k]) => { setPengumuman(a); setKosts(k); })
      .finally(() => setLoadingP(false));
  };

  useEffect(() => { loadKeluhan(); }, [filterStatus]);
  useEffect(() => { if (tab === 'pengumuman') loadPengumuman(); }, [tab]);

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/complaints/${id}`, { status });
      toast.success(`Keluhan ditandai "${status}"`);
      loadKeluhan();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const deleteKeluhan = async () => {
    try {
      await api.delete(`/complaints/${deleteTarget.id}`);
      toast.success('Keluhan dihapus');
      setDeleteTarget(null);
      loadKeluhan();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setForm({
      kost_id: String(a.kost_id),
      judul: a.judul,
      isi: a.isi,
      berlaku_sampai: a.berlaku_sampai ? String(a.berlaku_sampai).slice(0, 10) : '',
    });
    setEditId(a.id);
    setShowForm(true);
  };

  const submitPengumuman = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        kost_id: Number(form.kost_id),
        judul: form.judul,
        isi: form.isi,
        berlaku_sampai: form.berlaku_sampai || null,
      };
      if (editId) await api.put(`/announcements/${editId}`, payload);
      else await api.post('/announcements', payload);
      toast.success(editId ? 'Pengumuman diperbarui' : 'Pengumuman diterbitkan');
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      loadPengumuman();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const deletePengumuman = async () => {
    try {
      await api.delete(`/announcements/${deleteTarget.id}`);
      toast.success('Pengumuman dihapus');
      setDeleteTarget(null);
      loadPengumuman();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="icon-box"><Headset className="w-5 h-5" /></div>
        <div>
          <h2 className="page-title">Layanan Penghuni</h2>
          <p className="page-subtitle">Keluhan masuk & pengumuman kost</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'keluhan', label: 'Keluhan', Icon: Headset },
          { key: 'pengumuman', label: 'Pengumuman', Icon: Megaphone },
        ].map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-kost-700 text-white shadow-soft' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <t.Icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'keluhan' && (
        <>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Status</label>
              <select className="input !w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Semua</option>
                {STATUS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              <span className="ml-auto text-xs text-slate-400 font-semibold">{keluhan.length} laporan</span>
            </div>
          </div>

          {loadingK ? (
            <div className="space-y-3"><SkeletonCard lines={2} /><SkeletonCard lines={2} /></div>
          ) : keluhan.length === 0 ? (
            <EmptyState title="Tidak ada keluhan" message="Laporan dari penghuni akan muncul di sini." />
          ) : (
            <div className="space-y-3">
              {keluhan.map((c) => (
                <div key={c.id} className="card !p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">{c.judul}</p>
                      <p className="text-[11px] text-slate-400">
                        {c.user?.name || '-'} • {c.room ? `${c.room.kost?.nama || ''} Kamar ${c.room.nomor_kamar}` : 'Umum'} • {String(c.created_at || '').slice(0, 10)}
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-kost-600 mb-1">{c.kategori}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{c.deskripsi}</p>
                  {c.foto_url && (
                    <img src={imgSrc(c.foto_url)} alt="Bukti" className="mt-2.5 rounded-xl w-full max-w-sm aspect-[16/9] object-cover border border-slate-100" loading="lazy" />
                  )}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                    {STATUS.filter((s) => s !== c.status).map((s) => (
                      <button key={s} onClick={() => setStatus(c.id, s)} className="btn-secondary text-xs py-1.5 capitalize">
                        Tandai {s}
                      </button>
                    ))}
                    <button onClick={() => setDeleteTarget({ type: 'keluhan', id: c.id })} className="btn-ghost text-rose-600 hover:bg-rose-50 text-xs font-semibold ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'pengumuman' && (
        <>
          <div className="flex justify-end">
            <button onClick={openCreate} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Buat Pengumuman
            </button>
          </div>

          {showForm && (
            <form onSubmit={submitPengumuman} className="card space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-heading text-slate-800">{editId ? 'Edit' : 'Baru'} Pengumuman</h3>
                <button type="button" onClick={() => setShowForm(false)} className="btn-icon"><X className="w-4 h-4" /></button>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kost</label>
                <select className="input" value={form.kost_id} onChange={(e) => set('kost_id', e.target.value)} required>
                  <option value="">Pilih kost...</option>
                  {kosts.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Judul</label>
                <input className="input" value={form.judul} onChange={(e) => set('judul', e.target.value)} required maxLength={150} placeholder="cth. Jadwal fogging minggu ini" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Isi</label>
                <textarea className="input" rows={3} value={form.isi} onChange={(e) => set('isi', e.target.value)} required maxLength={2000} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Berlaku Sampai (opsional)</label>
                <input type="date" className="input" value={form.berlaku_sampai} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set('berlaku_sampai', e.target.value)} />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? <><span className="spinner" /> Menyimpan...</> : 'Terbitkan'}
              </button>
            </form>
          )}

          {loadingP ? (
            <div className="space-y-3"><SkeletonCard lines={2} /><SkeletonCard lines={2} /></div>
          ) : pengumuman.length === 0 ? (
            <EmptyState title="Belum ada pengumuman" message="Buat pengumuman pertama untuk penghuni." action={openCreate} actionLabel="Buat Pengumuman" />
          ) : (
            <div className="space-y-3">
              {pengumuman.map((a) => (
                <div key={a.id} className="card !p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-kost-600">{a.kost?.nama}</p>
                      <p className="text-sm font-bold text-slate-800">{a.judul}</p>
                      <p className="text-[11px] text-slate-400">
                        {String(a.created_at || '').slice(0, 10)}
                        {a.berlaku_sampai ? ` • s/d ${String(a.berlaku_sampai).slice(0, 10)}` : ' • selalu tampil'}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(a)} className="btn-icon !p-2" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget({ type: 'pengumuman', id: a.id })} className="btn-icon !p-2 !text-rose-500 hover:!bg-rose-50" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">{a.isi}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteTarget?.type === 'keluhan' ? deleteKeluhan : deletePengumuman}
        title={deleteTarget?.type === 'keluhan' ? 'Hapus Keluhan?' : 'Hapus Pengumuman?'}
        message="Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
