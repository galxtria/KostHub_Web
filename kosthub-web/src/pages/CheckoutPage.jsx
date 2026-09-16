import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  ArrowLeft, QrCode, Landmark, Wallet, CheckCircle2, XCircle,
  Copy, RefreshCw, ReceiptText, ShieldCheck, UploadCloud, Timer, Printer,
} from 'lucide-react';
import api, { formatRupiah } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/Layout';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const METHODS = [
  { key: 'qris', label: 'QRIS', desc: 'Semua e-wallet & m-banking', Icon: QrCode },
  { key: 'va_bca', label: 'BCA Virtual Account', desc: 'Cek otomatis', Icon: Landmark },
  { key: 'va_bri', label: 'BRI Virtual Account', desc: 'Cek otomatis', Icon: Landmark },
];

const METHOD_LABEL = { qris: 'QRIS', va_bca: 'BCA Virtual Account', va_bri: 'BRI Virtual Account', transfer: 'Transfer Bank', cash: 'Tunai' };

export default function CheckoutPage() {
  const { invoiceId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metode, setMetode] = useState('qris');
  const [charging, setCharging] = useState(false);
  const [payment, setPayment] = useState(null);
  const [instruksi, setInstruksi] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [now, setNow] = useState(Date.now());

  const paymentId = payment?.id;
  const paymentStatus = payment?.status_verifikasi;

  // Detik berjalan untuk hitung mundur masa berlaku (24 jam)
  useEffect(() => {
    if (paymentStatus !== 'pending') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [paymentId, paymentStatus]);

  // Polling status otomatis tiap 5 detik selama pending
  useEffect(() => {
    if (!paymentId || paymentStatus !== 'pending') return;
    const t = setInterval(async () => {
      try {
        const r = await api.get(`/gateway/payments/${paymentId}`);
        if (r.data.status_verifikasi !== 'pending') {
          setPayment(r.data);
          setInvoice((prev) => (prev ? { ...prev, status: r.data.invoice.status } : prev));
        }
      } catch { /* abaikan, coba lagi */ }
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, paymentStatus]);

  const expiryAt = payment?.created_at ? new Date(payment.created_at).getTime() + 24 * 3600 * 1000 : 0;
  const remainMs = Math.max(0, expiryAt - now);
  const expired = paymentStatus === 'pending' && expiryAt > 0 && remainMs <= 0;
  const remainStr = [remainMs / 3600000, (remainMs % 3600000) / 60000, (remainMs % 60000) / 1000]
    .map((n) => String(Math.floor(n)).padStart(2, '0'))
    .join(':');

  const load = () => {
    setLoading(true);
    api.get(`/invoices/${invoiceId}`)
      .then((r) => {
        setInvoice(r.data);
        // Lanjutkan pembayaran gateway yang masih pending
        const pending = (r.data.payments || []).find((p) => p.status_verifikasi === 'pending' && p.gateway_ref);
        if (pending) {
          setPayment(pending);
          setMetode(pending.metode);
          setInstruksi({
            judul: pending.metode === 'qris' ? 'Pindai QRIS untuk membayar' : 'Transfer ke Virtual Account',
            kode: pending.va_number || pending.gateway_ref,
            nominal: formatRupiah(pending.jumlah_bayar),
          });
        }
      })
      .catch(() => toast.error('Gagal memuat tagihan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [invoiceId]);

  const charge = async () => {
    setCharging(true);
    try {
      const r = await api.post('/gateway/charge', { invoice_id: Number(invoiceId), metode });
      setPayment(r.data.payment);
      setInstruksi(r.data.instruksi);
      setInvoice((prev) => (prev ? { ...prev, status: 'menunggu_verifikasi' } : prev));
      toast.success('Kode pembayaran dibuat. Selesaikan pembayaran Anda.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pembayaran');
    } finally {
      setCharging(false);
    }
  };

  const simulate = async (hasil) => {
    if (!payment) return;
    setSimulating(true);
    try {
      const r = await api.post('/gateway/simulate', { payment_id: payment.id, hasil });
      setPayment(r.data);
      setInvoice((prev) => (prev ? { ...prev, status: r.data.invoice.status } : prev));
      if (hasil === 'success') toast.success('Pembayaran berhasil! Tagihan lunas.');
      else toast.info('Simulasi pembayaran gagal. Tagihan kembali belum bayar.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulasi gagal');
    } finally {
      setSimulating(false);
    }
  };

  const refresh = async () => {
    if (!payment) return;
    try {
      const r = await api.get(`/gateway/payments/${payment.id}`);
      setPayment(r.data);
      setInvoice((prev) => (prev ? { ...prev, status: r.data.invoice.status } : prev));
    } catch {
      toast.error('Gagal mengecek status');
    }
  };

  const copyKode = () => {
    if (instruksi?.kode) {
      navigator.clipboard?.writeText(instruksi.kode);
      toast.success('Kode disalin');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="skeleton h-10 w-40 rounded-xl" />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (!invoice) {
    return <EmptyState title="Tagihan tidak ditemukan" message="Tagihan yang Anda cari tidak tersedia." action={() => nav('/tagihan')} actionLabel="Ke Tagihan" />;
  }

  const isLunas = invoice.status === 'lunas' || payment?.status_verifikasi === 'verified';

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <button onClick={() => nav(-1)} className="btn-secondary text-xs py-2">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="flex items-center gap-3">
        <div className="icon-box"><Wallet className="w-5 h-5" /></div>
        <div>
          <h2 className="page-title">Checkout Pembayaran</h2>
          <p className="page-subtitle">Payment gateway simulasi — aman untuk demo</p>
        </div>
      </div>

      {/* Ringkasan tagihan */}
      <div className="card">
        <h3 className="font-bold font-heading text-slate-800 flex items-center gap-2 mb-4">
          <ReceiptText className="w-4 h-4 text-kost-600" /> Ringkasan Tagihan
        </h3>
        <div className="bg-[#F7F8FA] rounded-xl px-4 py-3 space-y-2">
          <Row label="Kode Invoice" value={invoice.kode_invoice} bold />
          <Row label="Kost" value={invoice.room?.kost?.nama || '-'} />
          <Row label="Kamar" value={invoice.room ? `Kamar ${invoice.room.nomor_kamar}` : '-'} />
          <Row label="Periode" value={invoice.periode?.slice(0, 7)} />
          <Row label="Jatuh Tempo" value={invoice.jatuh_tempo?.slice(0, 10)} />
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bayar</span>
            <span className="text-xl font-extrabold text-kost-700">{formatRupiah(invoice.jumlah)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Status</span>
            <StatusBadge status={invoice.status} />
          </div>
        </div>
      </div>

      {/* Lunas */}
      {isLunas ? (
        <div className="card text-center py-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold font-heading text-slate-800">Pembayaran Berhasil!</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            {invoice.kode_invoice} sudah lunas via {METHOD_LABEL[payment?.metode] || 'gateway'}.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/tagihan" className="btn-primary">Lihat Tagihan Saya</Link>
            <Link to={`/invoice/${invoice.id}/cetak`} target="_blank" className="btn-secondary">
              <Printer className="w-4 h-4" /> Cetak Kwitansi
            </Link>
            <Link to="/dashboard" className="btn-secondary">Cari Kost Lain</Link>
          </div>
        </div>
      ) : !payment ? (
        /* Pilih metode */
        <div className="card">
          <h3 className="font-bold font-heading text-slate-800 flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-kost-600" /> Metode Pembayaran
          </h3>
          <p className="text-xs text-slate-400 mb-4">Pilih salah satu metode di bawah ini</p>
          <div className="space-y-2.5">
            {METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetode(m.key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                  metode === m.key
                    ? 'border-kost-600 bg-kost-50/60'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metode === m.key ? 'bg-kost-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <m.Icon className="w-5 h-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-800">{m.label}</span>
                  <span className="block text-xs text-slate-400">{m.desc}</span>
                </span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${metode === m.key ? 'border-kost-600' : 'border-slate-200'}`}>
                  {metode === m.key && <span className="w-2.5 h-2.5 rounded-full bg-kost-600" />}
                </span>
              </button>
            ))}
          </div>

          <button onClick={charge} disabled={charging} className="btn-primary w-full mt-5">
            {charging ? <><span className="spinner" /> Membuat pembayaran...</> : `Bayar ${formatRupiah(invoice.jumlah)}`}
          </button>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-2">Lebih suka transfer manual?</p>
            <Link to="/tagihan" className="inline-flex items-center gap-1.5 text-xs font-semibold text-kost-700 hover:underline">
              <UploadCloud className="w-3.5 h-3.5" /> Upload bukti transfer di halaman Tagihan
            </Link>
          </div>
        </div>
      ) : (
        /* Instruksi bayar */
        <div className="card">
          {/* Steps */}
          <div className="flex items-center gap-1 mb-5">
            <Step n={1} label="Kode dibuat" done active={false} />
            <div className="flex-1 h-0.5 bg-kost-200 rounded" />
            <Step n={2} label="Bayar" done={false} active={paymentStatus === 'pending'} />
            <div className={`flex-1 h-0.5 rounded ${isLunas ? 'bg-kost-500' : 'bg-slate-100'}`} />
            <Step n={3} label="Lunas" done={isLunas} active={false} />
          </div>

          {/* Countdown */}
          {paymentStatus === 'pending' && !expired && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
              <Timer className="w-4 h-4" />
              Bayar dalam {remainStr}
            </div>
          )}

          {/* QRIS: QR code asli */}
          {payment.metode === 'qris' ? (
            <div className="text-center mb-5">
              <div className="inline-block bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-card">
                <QRCode
                  value={`kosthub://pay/qris/${instruksi?.kode || payment.gateway_ref}?amount=${Math.round(Number(payment.jumlah_bayar))}`}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#111111"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold tracking-widest">
                <QrCode className="w-4 h-4" /> QRIS
              </div>
              <p className="text-sm text-slate-500 mt-2">Nominal: <b className="text-kost-700">{instruksi?.nominal || formatRupiah(payment.jumlah_bayar)}</b></p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{instruksi?.kode || payment.gateway_ref}</p>
            </div>
          ) : (
            /* VA: kartu bank */
            <div className="mb-5 rounded-2xl overflow-hidden shadow-card">
              <div
                className="px-5 py-4 text-white"
                style={{ background: payment.metode === 'va_bri' ? 'linear-gradient(135deg,#00529C,#003A70)' : 'linear-gradient(135deg,#1B4F9C,#0B2C5C)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold tracking-wide text-sm">
                    {payment.metode === 'va_bri' ? 'BANK BRI' : 'BANK BCA'}
                  </span>
                  <Landmark className="w-5 h-5 opacity-80" />
                </div>
                <p className="text-[11px] opacity-70 mt-3 uppercase tracking-widest">Nomor Virtual Account</p>
                <p className="font-mono text-2xl font-bold tracking-wider">
                  {instruksi?.kode || payment.va_number}
                </p>
              </div>
              <div className="bg-white px-5 py-3 flex items-center justify-between border border-t-0 border-slate-100">
                <div className="text-sm">
                  <span className="text-slate-400 text-xs block">Total bayar</span>
                  <b className="text-kost-700">{instruksi?.nominal || formatRupiah(payment.jumlah_bayar)}</b>
                </div>
                <button onClick={copyKode} className="btn-secondary text-xs py-2">
                  <Copy className="w-3.5 h-3.5" /> Salin
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-[11px] text-slate-400 mb-4">Ref: {payment.gateway_ref} • {METHOD_LABEL[payment.metode]}</p>

          {paymentStatus === 'pending' && !expired ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 mb-4">
                Ini gateway <b>simulasi</b>. Setelah "membayar" via QR/VA di atas, tekan tombol hijau agar callback bank terkirim dan tagihan otomatis lunas.
              </div>
              <div className="space-y-2.5">
                <button onClick={() => simulate('success')} disabled={simulating} className="btn-success w-full">
                  {simulating ? <><span className="spinner" /> Memproses...</> : <><CheckCircle2 className="w-4 h-4" /> Saya Sudah Bayar (Simulasi)</>}
                </button>
                <div className="flex gap-2.5">
                  <button onClick={refresh} className="btn-secondary flex-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Cek Status
                  </button>
                  <button onClick={() => simulate('failed')} disabled={simulating} className="btn-ghost flex-1 text-rose-600 hover:bg-rose-50 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5" /> Simulasikan Gagal
                  </button>
                </div>
              </div>
            </>
          ) : payment.status_verifikasi === 'rejected' || expired ? (
            <div className="text-center">
              <div className="alert alert-error justify-center mb-4">
                <XCircle className="w-4 h-4" /> {expired ? 'Kode pembayaran kedaluwarsa.' : 'Pembayaran gagal / ditolak.'} Silakan buat pembayaran baru.
              </div>
              <button onClick={() => { setPayment(null); setInstruksi(null); load(); }} className="btn-primary">
                Buat Pembayaran Baru
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Step({ n, label, done, active }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
        done ? 'bg-kost-600 text-white' : active ? 'bg-kost-700 text-white' : 'bg-slate-100 text-slate-400'
      }`}>
        {done ? '✓' : n}
      </span>
      <span className={`text-[11px] font-bold ${done || active ? 'text-kost-700' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-slate-400 text-xs shrink-0 pt-0.5">{label}</span>
      <span className={`text-right ${bold ? 'font-bold text-kost-700' : 'text-slate-700 font-medium'} text-sm truncate`}>{value || '-'}</span>
    </div>
  );
}
