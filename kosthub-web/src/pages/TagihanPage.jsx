import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptText, CreditCard, BadgeCheck, Upload, ShieldCheck, Zap } from 'lucide-react';
import api, { formatRupiah } from '../api/axios';
import { StatusBadge } from '../components/Layout';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';

const API_HOST = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
const buktiFull = (url) => (!url ? null : url.startsWith('http') ? url : API_HOST + url);

export default function TagihanPage({ isAdmin = false }) {
  const nav = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [payModal, setPayModal] = useState(null); // invoice object for payment
  const [verifyModal, setVerifyModal] = useState(null); // payment object for admin verify
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Payment form state
  const [payForm, setPayForm] = useState({ metode: 'transfer', jumlah_bayar: '', bukti: null });

  const load = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', p);
    if (filterStatus) params.set('status', filterStatus);

    api.get(`/invoices?${params}`)
      .then((r) => { setInvoices(r.data.data); setMeta(r.data); })
      .catch(() => toast.error('Gagal memuat data tagihan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); load(1); }, [filterStatus]);
  useEffect(() => { load(); }, [page]);

  // User: submit payment
  const submitPayment = async (e) => {
    e.preventDefault();
    if (!payModal) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('invoice_id', payModal.id);
      fd.append('metode', payForm.metode);
      fd.append('jumlah_bayar', payForm.jumlah_bayar);
      if (payForm.bukti) fd.append('bukti', payForm.bukti);
      await api.post('/payments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pembayaran berhasil dikirim. Menunggu verifikasi admin.');
      setPayModal(null);
      setPayForm({ metode: 'transfer', jumlah_bayar: '', bukti: null });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pembayaran');
    } finally {
      setSaving(false);
    }
  };

  // Admin: verify payment
  const verifyPayment = async (aksi) => {
    if (!verifyModal) return;
    setSaving(true);
    try {
      await api.post(`/payments/${verifyModal.id}/verify`, { aksi });
      toast.success(aksi === 'verified' ? 'Pembayaran diverifikasi ✅' : 'Pembayaran ditolak');
      setVerifyModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'belum_bayar', label: 'Belum Bayar' },
    { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
    { value: 'lunas', label: 'Lunas' },
    { value: 'terlambat', label: 'Terlambat' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-box">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="page-title">{isAdmin ? 'Manajemen Tagihan' : 'Tagihan Saya'}</h2>
            <p className="page-subtitle">
              {isAdmin ? 'Lihat dan verifikasi pembayaran penghuni' : 'Cek tagihan dan bayar'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select className="input w-auto min-w-[180px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={isAdmin ? 6 : 5} />
      ) : invoices.length === 0 ? (
        <EmptyState
          title={filterStatus ? 'Tidak ada tagihan dengan status ini' : 'Belum ada tagihan'}
          message={filterStatus ? 'Coba ubah filter status.' : 'Tagihan akan muncul setelah admin membuatnya.'}
        />
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Kode Invoice</th>
                  {isAdmin && <th>Penghuni</th>}
                  <th>Kamar</th>
                  <th>Periode</th>
                  <th>Jumlah</th>
                  <th>Jatuh Tempo</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-semibold text-kost-700">{inv.kode_invoice}</td>
                    {isAdmin && <td>{inv.user?.name || '-'}</td>}
                    <td>{inv.room?.nomor_kamar || '-'}</td>
                    <td className="text-slate-400">{inv.periode?.slice(0, 7)}</td>
                    <td className="font-bold">{formatRupiah(inv.jumlah)}</td>
                    <td className="text-slate-400">{inv.jatuh_tempo}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="text-right">
                      {/* User: Bayar buttons */}
                      {!isAdmin && ['belum_bayar', 'terlambat'].includes(inv.status) && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => nav(`/checkout/${inv.id}`)}
                            className="btn-primary text-xs py-1.5 px-3"
                            title="Bayar via QRIS / Virtual Account (otomatis)"
                          >
                            <Zap className="w-3.5 h-3.5" /> Gateway
                          </button>
                          <button
                            onClick={() => { setPayModal(inv); setPayForm({ metode: 'transfer', jumlah_bayar: inv.jumlah, bukti: null }); }}
                            className="btn-secondary text-xs py-1.5 px-3"
                            title="Upload bukti transfer manual"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Manual
                          </button>
                        </div>
                      )}
                      {/* User: resume pending gateway payment */}
                      {!isAdmin && inv.status === 'menunggu_verifikasi' && inv.payments?.some((p) => p.gateway_ref && p.status_verifikasi === 'pending') && (
                        <button
                          onClick={() => nav(`/checkout/${inv.id}`)}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          <Zap className="w-3.5 h-3.5" /> Lanjut Bayar
                        </button>
                      )}
                      {/* Admin: Verify button */}
                      {isAdmin && inv.status === 'menunggu_verifikasi' && inv.payments?.length > 0 && (
                        <button
                          onClick={() => setVerifyModal(inv.payments[inv.payments.length - 1])}
                          className="btn-success text-xs py-1.5 px-3"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" /> Verifikasi
                        </button>
                      )}
                      {inv.status === 'lunas' && (
                        <span className="text-xs text-emerald-600 font-semibold">✓ Lunas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      {/* Payment Modal (User) */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <form onSubmit={submitPayment} className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-1">
              <div className="icon-box">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-800">Bayar Tagihan</h3>
            </div>
            <p className="text-sm text-slate-400 mb-5 ml-[52px]">
              {payModal.kode_invoice} — {formatRupiah(payModal.jumlah)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Metode Pembayaran</label>
                <select className="input" value={payForm.metode} onChange={(e) => setPayForm({ ...payForm, metode: e.target.value })}>
                  <option value="transfer">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                  <option value="cash">Tunai</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Jumlah Bayar</label>
                <input className="input" type="number" value={payForm.jumlah_bayar} onChange={(e) => setPayForm({ ...payForm, jumlah_bayar: e.target.value })} required min="0" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Bukti Transfer (Opsional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setPayForm({ ...payForm, bukti: e.target.files?.[0] || null })}
                  className="input text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-kost-50 file:text-kost-700 hover:file:bg-kost-100"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? <><span className="spinner" /> Mengirim...</> : <><Upload className="w-4 h-4" /> Kirim Pembayaran</>}
              </button>
              <button type="button" onClick={() => setPayModal(null)} className="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* Verify Modal (Admin) */}
      {verifyModal && (
        <div className="modal-overlay" onClick={() => setVerifyModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-800">Verifikasi Pembayaran</h3>
            </div>

            <div className="bg-[#F7F8FA] rounded-xl px-4 py-3 space-y-2.5 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 text-xs">Metode</span>
                <span className="font-semibold capitalize text-slate-700 text-sm">{verifyModal.metode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 text-xs">Jumlah Dibayar</span>
                <span className="font-bold text-kost-700 text-sm">{formatRupiah(verifyModal.jumlah_bayar)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 text-xs">Tanggal Bayar</span>
                <span className="text-slate-700 text-sm">{verifyModal.tgl_bayar?.slice(0, 10)}</span>
              </div>

              {verifyModal.bukti_url && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Bukti Transfer</p>
                  <a href={buktiFull(verifyModal.bukti_url)} target="_blank" rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-slate-200 hover:border-kost-300 transition-colors">
                    <img
                      src={buktiFull(verifyModal.bukti_url)}
                      alt="Bukti transfer"
                      className="w-full max-h-64 object-contain bg-white"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => verifyPayment('verified')} className="btn-success flex-1" disabled={saving}>
                {saving ? <span className="spinner" /> : <><BadgeCheck className="w-4 h-4" /> Setujui</>}
              </button>
              <button onClick={() => verifyPayment('rejected')} className="btn-danger flex-1" disabled={saving}>
                {saving ? <span className="spinner" /> : 'Tolak'}
              </button>
            </div>
            <button onClick={() => setVerifyModal(null)} className="btn-ghost w-full mt-2 justify-center">Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}
