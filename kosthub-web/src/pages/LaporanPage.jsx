import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Scale, Plus, Download, Trash2, ClipboardList } from 'lucide-react';
import api, { formatRupiah } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonKPI, SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const bulanNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function LaporanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exp, setExp] = useState({ kost_id: '', kategori: 'listrik', jumlah: '', tanggal: '', keterangan: '' });
  const [kosts, setKosts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get(`/reports/keuangan?bulan=${bulan}&tahun=${tahun}`)
      .then((r) => setData(r.data))
      .catch(() => toast.error('Gagal memuat laporan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/kosts').then((r) => setKosts(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [bulan, tahun]);

  const tambahExp = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/expenses', exp);
      setExp({ kost_id: '', kategori: 'listrik', jumlah: '', tanggal: '', keterangan: '' });
      toast.success('Pengeluaran berhasil disimpan');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pengeluaran');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteExp = async () => {
    try {
      await api.delete(`/expenses/${deleteTarget}`);
      toast.success('Pengeluaran berhasil dihapus');
      load();
    } catch {
      toast.error('Gagal menghapus pengeluaran');
    }
  };

  const exportViaFetch = async () => {
    try {
      const r = await api.get(`/reports/keuangan-csv?bulan=${bulan}&tahun=${tahun}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-${tahun}-${String(bulan).padStart(2, '0')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File CSV berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh CSV');
    }
  };

  const set = (k, v) => setExp((prev) => ({ ...prev, [k]: v }));

  const kpiCards = data ? [
    {
      label: 'Pemasukan',
      value: formatRupiah(data.pemasukan),
      Icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      label: 'Pengeluaran',
      value: formatRupiah(data.pengeluaran),
      Icon: TrendingDown,
      color: 'text-rose-600',
    },
    {
      label: 'Laba Bersih',
      value: formatRupiah(data.laba_bersih),
      Icon: data.laba_bersih >= 0 ? Scale : Scale,
      color: data.laba_bersih >= 0 ? 'text-kost-700' : 'text-rose-600',
    },
  ] : [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="icon-box">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="page-title">Laporan Keuangan</h2>
              <p className="page-subtitle">
                Periode: {bulanNames[bulan]} {tahun}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="input w-auto min-w-[130px]" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
              {bulanNames.slice(1).map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
            </select>
            <select className="input w-auto min-w-[100px]" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
              {[2025, 2026, 2027, 2028].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={exportViaFetch} className="btn-secondary text-xs">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <SkeletonKPI count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpiCards.map((kpi) => (
            <div key={kpi.label} className="kpi-card animate-slide-up">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
                <div className="w-10 h-10 rounded-xl bg-kost-50 flex items-center justify-center shrink-0">
                  <kpi.Icon className="w-5 h-5 text-kost-700" />
                </div>
              </div>
              <p className={`text-2xl font-extrabold font-heading ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content: Form + List */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Add Expense Form */}
        <div className="card">
          <h3 className="font-bold font-heading text-slate-800 flex items-center gap-2 mb-4">
            <span className="icon-box !w-8 !h-8"><Plus className="w-4 h-4" /></span> Tambah Pengeluaran
          </h3>
          <form onSubmit={tambahExp} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Kost</label>
              <select className="input" value={exp.kost_id} onChange={(e) => set('kost_id', e.target.value)} required>
                <option value="">-- Pilih Kost --</option>
                {kosts.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Kategori</label>
                <select className="input" value={exp.kategori} onChange={(e) => set('kategori', e.target.value)}>
                  <option value="listrik">Listrik</option>
                  <option value="air">Air</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="gaji">Gaji</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Jumlah</label>
                <input className="input" type="number" placeholder="500000" value={exp.jumlah} onChange={(e) => set('jumlah', e.target.value)} required min="0" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Tanggal</label>
              <input className="input" type="date" value={exp.tanggal} onChange={(e) => set('tanggal', e.target.value)} required />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Keterangan</label>
              <input className="input" placeholder="Keterangan opsional" value={exp.keterangan} onChange={(e) => set('keterangan', e.target.value)} />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? <><span className="spinner" /> Menyimpan...</> : 'Simpan Pengeluaran'}
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="card">
          <h3 className="font-bold font-heading text-slate-800 flex items-center gap-2 mb-4">
            <span className="icon-box !w-8 !h-8"><ClipboardList className="w-4 h-4" /></span> Daftar Pengeluaran
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : !data?.detail_pengeluaran?.length ? (
            <EmptyState title="Belum ada pengeluaran" message={`Tidak ada pengeluaran di ${bulanNames[bulan]} ${tahun}.`} />
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {data.detail_pengeluaran.map((p) => {
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#F7F8FA] hover:bg-slate-100 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-card flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-kost-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate capitalize">
                          {p.keterangan || p.kategori}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.tanggal?.slice(0, 10)} • {p.kost?.nama || ''} • {p.kategori}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-rose-600">
                        -{formatRupiah(p.jumlah)}
                      </span>
                      <button
                        onClick={() => setDeleteTarget(p.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-opacity"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteExp}
        title="Hapus Pengeluaran?"
        message="Data pengeluaran ini akan dihapus secara permanen."
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
