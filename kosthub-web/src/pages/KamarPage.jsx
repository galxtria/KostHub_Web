import { useEffect, useState } from 'react';
import { BedDouble, Plus, Pencil, Trash2, ImagePlus, X } from 'lucide-react';
import api, { formatRupiah, imgSrc } from '../api/axios';
import { StatusBadge } from '../components/Layout';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { FASILITAS_KAMAR } from '../store/fasilitas';

const emptyForm = { kost_id: '', nomor_kamar: '', tipe: 'standar', harga_bulanan: '', status: 'kosong', fasilitas: [] };

export default function KamarPage() {
  const [rooms, setRooms] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [kosts, setKosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterKost, setFilterKost] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoServer, setFotoServer] = useState(null);
  const toast = useToast();

  const load = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', p);
    if (filterKost) params.set('kost_id', filterKost);
    if (filterStatus) params.set('status', filterStatus);

    api.get(`/rooms?${params}`)
      .then((r) => {
        setRooms(r.data.data);
        setMeta(r.data);
      })
      .catch(() => toast.error('Gagal memuat data kamar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/kosts').then((r) => setKosts(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); load(1); }, [filterKost, filterStatus]);
  useEffect(() => { load(); }, [page]);

  const resetFoto = () => { setFotoFile(null); setFotoPreview(null); setFotoServer(null); };

  const onFotoChange = (file) => {
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    } else {
      setFotoFile(null);
      setFotoPreview(fotoServer);
    }
  };

  const openCreate = () => { setForm(emptyForm); setEditId(null); resetFoto(); setShowModal(true); };
  const openEdit = (room) => {
    setForm({
      kost_id: room.kost_id,
      nomor_kamar: room.nomor_kamar,
      tipe: room.tipe,
      harga_bulanan: room.harga_bulanan,
      status: room.status,
      fasilitas: room.fasilitas || [],
    });
    setEditId(room.id);
    setFotoFile(null);
    const server = room.foto_url ? imgSrc(room.foto_url) : null;
    setFotoServer(server);
    setFotoPreview(server);
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('kost_id', form.kost_id);
      fd.append('nomor_kamar', form.nomor_kamar);
      fd.append('tipe', form.tipe);
      fd.append('harga_bulanan', form.harga_bulanan);
      fd.append('status', form.status);
      // Kirim fasilitas sebagai array indexed agar validasi array Laravel lolos
      const fasList = Array.isArray(form.fasilitas) ? form.fasilitas : [];
      fasList.forEach((f, i) => fd.append(`fasilitas[${i}]`, f));
      if (fotoFile) fd.append('foto', fotoFile);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editId) {
        fd.append('_method', 'PUT');
        await api.post(`/rooms/${editId}`, fd, config);
      } else {
        await api.post('/rooms', fd, config);
      }
      toast.success(editId ? 'Kamar berhasil diperbarui' : 'Kamar baru berhasil ditambahkan');
      setShowModal(false); setForm(emptyForm); setEditId(null); resetFoto(); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data kamar');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/rooms/${deleteTarget}`);
      toast.success('Kamar berhasil dihapus');
      load();
    } catch {
      toast.error('Gagal menghapus kamar');
    }
  };

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-box">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h2 className="page-title">Data Kamar</h2>
            <p className="page-subtitle">Kelola semua kamar kost Anda</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Tambah Kamar
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select className="input w-auto min-w-[160px]" value={filterKost} onChange={(e) => setFilterKost(e.target.value)}>
            <option value="">Semua Kost</option>
            {kosts.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <select className="input w-auto min-w-[140px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="kosong">Kosong</option>
            <option value="terisi">Terisi</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Room Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState title="Belum ada kamar" message="Tambahkan kamar pertama Anda." action={openCreate} actionLabel="Tambah Kamar" />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room, idx) => (
              <div key={room.id} className="kost-card cursor-default">
                {/* Foto */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={imgSrc(room.foto_url, room.kost?.foto_url ? imgSrc(room.kost.foto_url) : `/images/kost/kost-${(idx % 4) + 1}.jpg`)}
                    alt={`Kamar ${room.nomor_kamar}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={room.status} />
                  </div>
                </div>
                <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-bold font-heading text-slate-800">
                    Kamar {room.nomor_kamar}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {room.kost?.nama || '-'}
                  </p>
                </div>

                <div className="bg-[#F7F8FA] rounded-xl px-4 py-3 space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 text-xs">Tipe</span>
                    <span className="font-semibold text-slate-700 text-sm capitalize">{room.tipe}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 text-xs">Harga/bulan</span>
                    <span className="font-bold text-kost-700 text-sm">{formatRupiah(room.harga_bulanan)}</span>
                  </div>
                  {room.active_contract?.user && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 text-xs">Penghuni</span>
                      <span className="font-semibold text-slate-700 text-sm">{room.active_contract.user.name}</span>
                    </div>
                  )}
                </div>

                {room.fasilitas?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {room.fasilitas.map((f) => (
                      <span key={f} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(room)} className="btn-secondary flex-1 text-xs py-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(room.id)} className="btn-ghost text-rose-600 hover:bg-rose-50 flex-1 py-2 text-xs font-semibold">
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form onSubmit={submit} className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-heading text-slate-800 mb-5">
              {editId ? 'Edit Kamar' : 'Tambah Kamar'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kost</label>
                <select className="input" value={form.kost_id} onChange={(e) => set('kost_id', e.target.value)} required>
                  <option value="">-- Pilih Kost --</option>
                  {kosts.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nomor Kamar</label>
                  <input className="input" placeholder="A01" value={form.nomor_kamar} onChange={(e) => set('nomor_kamar', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tipe</label>
                  <select className="input" value={form.tipe} onChange={(e) => set('tipe', e.target.value)}>
                    <option value="standar">Standar</option>
                    <option value="exclusive">Exclusive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Harga / Bulan</label>
                  <input className="input" type="number" placeholder="1500000" value={form.harga_bulanan} onChange={(e) => set('harga_bulanan', e.target.value)} required min="0" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                  <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="kosong">Kosong</option>
                    <option value="terisi">Terisi</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Fasilitas {(form.fasilitas || []).length > 0 && <span className="text-kost-600">({form.fasilitas.length} dipilih)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {FASILITAS_KAMAR.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => set('fasilitas', (form.fasilitas || []).includes(f)
                        ? form.fasilitas.filter((x) => x !== f)
                        : [...(form.fasilitas || []), f])}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        (form.fasilitas || []).includes(f)
                          ? 'bg-kost-700 border-kost-700 text-white'
                          : 'border-slate-200 text-slate-500 hover:border-kost-400 hover:text-kost-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Foto Kamar (jpg/png/webp, maks 2MB)</label>
                {fotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={fotoPreview} alt="Preview foto kamar" className="w-full aspect-[16/9] object-cover" />
                    {fotoFile && (
                      <button
                        type="button"
                        onClick={() => onFotoChange(null)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-rose-500 hover:bg-white shadow-soft"
                        title="Batalkan foto baru"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-kost-400 hover:bg-kost-50/50 transition-colors cursor-pointer">
                    <ImagePlus className="w-5 h-5 text-kost-600" />
                    <span className="text-sm text-slate-500 font-medium">Klik untuk pilih foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => onFotoChange(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
                {fotoPreview && (
                  <label className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-kost-700 hover:underline cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5" /> {fotoFile ? 'Pilih foto lain' : 'Ganti foto'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => onFotoChange(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? <><span className="spinner" /> Menyimpan...</> : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Kamar?"
        message="Data kamar ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
