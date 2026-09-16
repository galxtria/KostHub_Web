import { useEffect, useState } from 'react';
import { Building2, Search, Plus, Pencil, Trash2, MapPin, BedDouble, ImagePlus, X, LocateFixed } from 'lucide-react';
import api, { imgSrc } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import MapPicker from '../components/MapPicker';
import { FASILITAS_KOST } from '../store/fasilitas';

const empty = { nama: '', alamat: '', kota: '', deskripsi: '', peraturan: '', latitude: '', longitude: '', fasilitas: [] };

export default function KostPage() {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoServer, setFotoServer] = useState(null);
  const toast = useToast();

  const load = (p = page) => {
    setLoading(true);
    api.get(`/kosts?page=${p}`)
      .then((r) => { setList(r.data.data); setMeta(r.data); })
      .catch(() => toast.error('Gagal memuat data kost'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const submit = async (e) => {
    e.preventDefault();
    const latRaw = String(form.latitude ?? '').trim();
    const lngRaw = String(form.longitude ?? '').trim();
    // Validasi pasangan koordinat agar titik valid & langsung muncul di maps detail
    if ((latRaw && !lngRaw) || (!latRaw && lngRaw)) {
      toast.error('Lengkapi latitude dan longitude, atau kosongkan keduanya.');
      return;
    }
    const latNum = latRaw ? Number(latRaw) : null;
    const lngNum = lngRaw ? Number(lngRaw) : null;
    if ((latNum !== null && (Number.isNaN(latNum) || latNum < -90 || latNum > 90)) ||
        (lngNum !== null && (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180))) {
      toast.error('Koordinat tidak valid (latitude -90..90, longitude -180..180).');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nama', form.nama);
      fd.append('alamat', form.alamat);
      fd.append('kota', form.kota || '');
      fd.append('deskripsi', form.deskripsi || '');
      fd.append('peraturan', form.peraturan || '');
      (form.fasilitas || []).forEach((f, i) => fd.append(`fasilitas[${i}]`, f));
      if (latRaw) fd.append('latitude', latRaw);
      if (lngRaw) fd.append('longitude', lngRaw);
      // Saat edit + titik dihapus, kirim null eksplisit agar koordinat lama ikut terhapus
      if (editId && !latRaw && !lngRaw) {
        fd.append('latitude', '');
        fd.append('longitude', '');
      }
      if (fotoFile) fd.append('foto', fotoFile);

      if (editId) {
        fd.append('_method', 'PUT');
        await api.post(`/kosts/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/kosts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(editId ? 'Kost berhasil diperbarui' : 'Kost baru berhasil ditambahkan');
      setShowModal(false); setForm(empty); setEditId(null);
      resetFoto();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const onFotoChange = (file) => {
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    } else {
      // Batalkan pilihan baru -> kembali ke foto tersimpan
      setFotoFile(null);
      setFotoPreview(fotoServer);
    }
  };

  const resetFoto = () => { setFotoFile(null); setFotoPreview(null); setFotoServer(null); };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolokasi');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
        toast.success('Koordinat lokasi Anda terisi');
      },
      () => toast.error('Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const openEdit = (k) => {
    setForm({ nama: k.nama, alamat: k.alamat, kota: k.kota || '', deskripsi: k.deskripsi || '', peraturan: k.peraturan || '', latitude: k.latitude || '', longitude: k.longitude || '', fasilitas: k.fasilitas || [] });
    setEditId(k.id);
    setFotoFile(null);
    const server = k.foto_url ? imgSrc(k.foto_url) : null;
    setFotoServer(server);
    setFotoPreview(server);
    setShowModal(true);
  };

  const openCreate = () => {
    setForm(empty); setEditId(null);
    resetFoto();
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/kosts/${deleteTarget}`);
      toast.success('Kost berhasil dihapus');
      load();
    } catch {
      toast.error('Gagal menghapus kost');
    }
  };

  // Client-side search filter
  const filteredList = search
    ? list.filter((k) =>
        k.nama.toLowerCase().includes(search.toLowerCase()) ||
        (k.kota || '').toLowerCase().includes(search.toLowerCase()) ||
        k.alamat.toLowerCase().includes(search.toLowerCase())
      )
    : list;

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const toggleFas = (f) => setForm((prev) => {
    const cur = prev.fasilitas || [];
    return { ...prev, fasilitas: cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f] };
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-box">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="page-title">Data Kost</h2>
            <p className="page-subtitle">Kelola semua properti kost Anda</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Tambah Kost
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-11"
            placeholder="Cari nama kost, kota, atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Kost Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          title={search ? 'Tidak ditemukan' : 'Belum ada kost'}
          message={search ? `Tidak ada kost yang cocok dengan "${search}"` : 'Tambahkan properti kost pertama Anda.'}
          action={!search ? openCreate : undefined}
          actionLabel="Tambah Kost"
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {filteredList.map((k, idx) => (
              <div key={k.id} className="kost-card cursor-default">
                {/* Foto */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={imgSrc(k.foto_url, `/images/kost/kost-${(idx % 4) + 1}.jpg`)}
                    alt={k.nama}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {k.kota && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/90 text-kost-700">
                      {k.kota}
                    </span>
                  )}
                  <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${k.latitude && k.longitude ? 'bg-emerald-500/90 text-white' : 'bg-amber-400/95 text-amber-950'}`}>
                    {k.latitude && k.longitude ? 'Ada peta' : 'Belum ada titik'}
                  </span>
                </div>
                <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-bold font-heading text-[17px] text-slate-800 truncate">{k.nama}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{k.alamat}</span>
                  </p>
                </div>

                {k.deskripsi && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{k.deskripsi}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 bg-[#F7F8FA] rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-kost-600" />
                    <span className="font-bold">{k.rooms_count}</span>
                    <span className="text-slate-400 text-xs">kamar</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold">{k.rooms_terisi_count}</span>
                    <span className="text-slate-400 text-xs">terisi</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="font-bold">{k.rooms_count - k.rooms_terisi_count}</span>
                    <span className="text-slate-400 text-xs">kosong</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(k)} className="btn-secondary flex-1 text-xs py-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(k.id)} className="btn-ghost text-rose-600 hover:bg-rose-50 flex-1 py-2 text-xs font-semibold">
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
              {editId ? 'Edit Kost' : 'Tambah Kost'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nama Kost</label>
                <input className="input" placeholder="Kost Indah Permai" value={form.nama} onChange={(e) => set('nama', e.target.value)} required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Alamat</label>
                <textarea className="input" placeholder="Jl. Kenangan No. 1" value={form.alamat} onChange={(e) => set('alamat', e.target.value)} required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kota</label>
                <input className="input" placeholder="Bandung" value={form.kota} onChange={(e) => set('kota', e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Deskripsi</label>
                <textarea className="input" placeholder="Deskripsi singkat kost..." value={form.deskripsi} onChange={(e) => set('deskripsi', e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Peraturan</label>
                <textarea className="input" placeholder="Peraturan kost..." value={form.peraturan} onChange={(e) => set('peraturan', e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Fasilitas Kost {(form.fasilitas || []).length > 0 && <span className="text-kost-600">({form.fasilitas.length} dipilih)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {FASILITAS_KOST.map((f) => (
                    <button
                      key={f} type="button" onClick={() => toggleFas(f)}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lokasi di Peta</label>
                  <div className="flex items-center gap-2">
                    {String(form.latitude ?? '').trim() && String(form.longitude ?? '').trim() && (
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, latitude: '', longitude: '' }))}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:underline"
                      >
                        <X className="w-3.5 h-3.5" /> Hapus titik
                      </button>
                    )}
                    <button type="button" onClick={useMyLocation} className="inline-flex items-center gap-1 text-[11px] font-bold text-kost-700 hover:underline">
                      <LocateFixed className="w-3.5 h-3.5" /> Lokasi saya
                    </button>
                  </div>
                </div>
                <MapPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(la, ln) => setForm((p) => ({ ...p, latitude: la, longitude: ln }))}
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Klik peta untuk menaruh pin, atau pakai tombol "Lokasi saya".
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Foto Kost (jpg/png/webp, maks 2MB)</label>
                {fotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={fotoPreview} alt="Preview foto kost" className="w-full aspect-[16/9] object-cover" />
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
        title="Hapus Kost?"
        message="Semua data kamar, kontrak, dan tagihan yang terkait dengan kost ini akan ikut terhapus. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Semua"
      />
    </div>
  );
}
