import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Building2, CheckCircle2 } from 'lucide-react';
import api, { formatRupiah } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

/**
 * Kwitansi invoice siap cetak / simpan PDF (via dialog print browser).
 * Tanpa layout agar hasil cetak bersih.
 */
export default function InvoiceCetakPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then((r) => setInv(r.data))
      .catch(() => toast.error('Gagal memuat invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] p-6 max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-10 w-40 rounded-xl" />
        <SkeletonCard lines={5} />
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
        <EmptyState title="Invoice tidak ditemukan" message="Data yang Anda cari tidak tersedia." action={() => nav(-1)} actionLabel="Kembali" />
      </div>
    );
  }

  const paid = inv.payments?.find((p) => p.status_verifikasi === 'verified') || inv.payments?.[inv.payments.length - 1];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-6 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-3 mb-5 no-print">
          <button onClick={() => nav(-1)} className="btn-secondary text-xs py-2">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <button onClick={() => window.print()} className="btn-primary text-xs py-2">
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl print:border-0 print:rounded-none p-8">
          {/* Kop */}
          <div className="flex items-center gap-3 pb-5 border-b-2 border-slate-900">
            <div className="w-12 h-12 rounded-xl bg-kost-700 flex items-center justify-center print:bg-black">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold font-heading">KostHub</h1>
              <p className="text-xs text-slate-500">Kwitansi Pembayaran Kost</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-sm">{inv.kode_invoice}</p>
              <p className="text-[11px] text-slate-400">Dicetak {today}</p>
            </div>
          </div>

          {/* Pihak */}
          <div className="grid grid-cols-2 gap-4 py-5 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Diterima dari</p>
              <p className="font-bold text-slate-800">{inv.contract?.user?.name || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Properti</p>
              <p className="font-bold text-slate-800">{inv.room?.kost?.nama || '-'}</p>
              <p className="text-xs text-slate-500">Kamar {inv.room?.nomor_kamar || '-'}</p>
            </div>
          </div>

          {/* Rincian */}
          <table className="w-full text-sm border-t border-slate-200">
            <tbody>
              <Row k="Jenis tagihan" v={String(inv.jenis || 'sewa').toUpperCase()} />
              <Row k="Periode" v={String(inv.periode || '').slice(0, 7)} />
              <Row k="Jatuh tempo" v={String(inv.jatuh_tempo || '').slice(0, 10)} />
              <Row k="Metode" v={paid ? paid.metode?.toUpperCase() : '-'} />
              <Row k="Status" v={String(inv.status || '').replace(/_/g, ' ').toUpperCase()} bold={inv.status === 'lunas'} />
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-slate-900">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total dibayar</span>
            <span className="text-2xl font-extrabold">{formatRupiah(inv.jumlah)}</span>
          </div>

          {inv.status === 'lunas' && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" /> LUNAS
            </p>
          )}

          <p className="text-[11px] text-slate-400 mt-6 text-center">
            Dokumen ini sah sebagai bukti pembayaran. Simpan untuk arsip Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, bold }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2.5 text-slate-400 text-xs pr-4 w-40">{k}</td>
      <td className={`py-2.5 text-right font-semibold ${bold ? 'text-emerald-700' : 'text-slate-800'}`}>{v || '-'}</td>
    </tr>
  );
}
