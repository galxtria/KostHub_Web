import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, CalendarDays, DoorOpen, Zap, CreditCard, Ban, ChevronRight,
} from 'lucide-react';
import api, { formatRupiah, imgSrc } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';

const CONTRACT_LABEL = { aktif: 'Aktif', selesai: 'Selesai', batal: 'Dibatalkan' };
const CONTRACT_BADGE = {
  aktif: 'bg-kost-100 text-kost-800',
  selesai: 'bg-slate-100 text-slate-500',
  batal: 'bg-rose-100 text-rose-600',
};

export default function PesananPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [contracts, setContracts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = (p = page) => {
    setLoading(true);
    api.get(`/my/contracts?page=${p}`)
      .then((r) => { setContracts(r.data.data || []); setMeta(r.data); })
      .catch(() => toast.error('Gagal memuat pesanan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.post(`/contracts/${cancelTarget.id}/cancel`);
      toast.success('Pesanan dibatalkan. Kamar dikembalikan ke pemilik.');
      setCancelTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pesanan');
    } finally {
      setCancelling(false);
    }
  };

  const unpaidInvoice = (c) =>
    (c.invoices || []).find((i) => ['belum_bayar', 'terlambat'].includes(i.status));

  const aktif = contracts.filter((c) => c.status === 'aktif');
  const riwayat = contracts.filter((c) => c.status !== 'aktif');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="icon-box"><ClipboardList className="w-5 h-5" /></div>
        <div>
          <h2 className="page-title">Pesanan Saya</h2>
          <p className="page-subtitle">Kelola sewa kamar & riwayat pesanan Anda</p>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan"
          message="Anda belum memesan kamar. Yuk cari kost impian Anda!"
          action={() => nav('/dashboard')}
          actionLabel="Cari Kost"
        />
      ) : (
        <>
          {/* Pesanan aktif */}
          {aktif.length > 0 && (
            <section>
              <h3 className="text-lg font-bold font-heading text-slate-800 mb-3">
                Aktif <span className="text-sm font-semibold text-kost-600">({aktif.length})</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {aktif.map((c, idx) => {
                  const unpaid = unpaidInvoice(c);
                  const kost = c.room?.kost;
                  return (
                    <div key={c.id} className="kost-card cursor-default animate-slide-up" style={{ animationDelay: `${idx * 70}ms` }}>
                      <div className="relative aspect-[16/8] overflow-hidden bg-slate-100">
                        <img
                          src={imgSrc(c.room?.foto_url, kost?.foto_url ? imgSrc(kost.foto_url) : undefined)}
                          alt={kost?.nama || 'Kost'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`badge ${CONTRACT_BADGE[c.status]}`}>{CONTRACT_LABEL[c.status]}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold font-heading text-slate-800">
                          {kost?.nama || 'Kost'} • Kamar {c.room?.nomor_kamar}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {c.tgl_masuk?.slice(0, 10)} → {c.tgl_keluar?.slice(0, 10)}
                          </span>
                        </div>

                        {unpaid ? (
                          <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mt-3">
                            <span className="text-xs font-semibold text-amber-700">
                              {unpaid.kode_invoice} • belum bayar
                            </span>
                            <span className="text-sm font-extrabold text-amber-700">{formatRupiah(unpaid.jumlah)}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mt-3">
                            <span className="text-xs font-semibold text-emerald-700">Tidak ada tagihan tertunggak</span>
                            <span className="text-xs font-bold text-emerald-700">✓ Beres</span>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          {unpaid && (
                            <button onClick={() => nav(`/checkout/${unpaid.id}`)} className="btn-primary flex-1 text-xs py-2">
                              <Zap className="w-3.5 h-3.5" /> Bayar Sekarang
                            </button>
                          )}
                          <button onClick={() => nav(`/kost/${c.room?.kost_id}`)} className="btn-secondary flex-1 text-xs py-2">
                            Lihat Kost <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => setCancelTarget(c)}
                          className="w-full mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl py-2 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" /> Batalkan Pesanan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Riwayat */}
          {riwayat.length > 0 && (
            <section>
              <h3 className="text-lg font-bold font-heading text-slate-800 mb-3">Riwayat</h3>
              <div className="card p-0 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {riwayat.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/70 transition-colors">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img
                          src={imgSrc(c.room?.foto_url, c.room?.kost?.foto_url ? imgSrc(c.room.kost.foto_url) : undefined)}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {c.room?.kost?.nama || 'Kost'} • Kamar {c.room?.nomor_kamar}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <DoorOpen className="w-3 h-3" />
                          {c.tgl_masuk?.slice(0, 10)} → {c.tgl_keluar?.slice(0, 10)}
                        </p>
                      </div>
                      <span className={`badge shrink-0 ${CONTRACT_BADGE[c.status]}`}>{CONTRACT_LABEL[c.status]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      {/* Konfirmasi batal */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => !cancelling && setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Batalkan Pesanan?"
        message={`Pesanan Kamar ${cancelTarget?.room?.nomor_kamar} akan dibatalkan, tagihan yang belum dibayar ikut dihapus, dan kamar kembali tersedia. Tagihan yang sudah lunas tetap tercatat. Lanjutkan?`}
        confirmText={cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
      />

      {/* Hint bayar manual */}
      {!loading && aktif.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          <CreditCard className="w-3.5 h-3.5 inline mr-1" />
          Preferensi transfer manual? Upload bukti via halaman <button onClick={() => nav('/tagihan')} className="text-kost-700 font-semibold hover:underline">Tagihan</button>.
        </p>
      )}
    </div>
  );
}
