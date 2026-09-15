import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, BedDouble, DoorOpen, Check,
  CalendarDays, ChevronRight, ScrollText,
} from 'lucide-react';
import api, { formatRupiah, imgSrc, priceShort } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/Layout';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function KostDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [kost, setKost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tglMasuk, setTglMasuk] = useState(() => new Date().toISOString().slice(0, 10));
  const [durasi, setDurasi] = useState(1);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/kosts/${id}`)
      .then((r) => setKost(r.data))
      .catch(() => toast.error('Gagal memuat detail kost'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setBooking(true);
    try {
      const r = await api.post('/bookings', {
        room_id: selectedRoom.id,
        tgl_masuk: tglMasuk,
        durasi_bulan: Number(durasi),
      });
      toast.success('Kamar berhasil dipesan! Lanjutkan pembayaran.');
      setSelectedRoom(null);
      nav(`/checkout/${r.data.invoice.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memesan kamar');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="skeleton h-56 md:h-72 rounded-2xl" />
        <SkeletonCard lines={3} />
        <div className="grid sm:grid-cols-2 gap-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    );
  }

  if (!kost) {
    return <EmptyState title="Kost tidak ditemukan" message="Properti yang Anda cari tidak tersedia." action={() => nav('/dashboard')} actionLabel="Kembali" />;
  }

  const rooms = kost.rooms || [];
  const kosongCount = rooms.filter((r) => r.status === 'kosong').length;
  const rating = (4.5 + ((kost.id || 0) % 6) / 10).toFixed(1);
  const hargaMulai = rooms.length > 0 ? Math.min(...rooms.map((r) => Number(r.harga_bulanan))) : 0;
  const fasilitas = kost.fasilitas?.length > 0 ? kost.fasilitas : ['WiFi', 'Kasur Nyaman', 'KM Dalam'];

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => nav(-1)} className="btn-secondary text-xs py-2">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* Hero */}
      <div className="kost-card cursor-default">
        <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-slate-100">
          <img src={imgSrc(kost.foto_url)} alt={kost.nama} className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3">
            <span className="badge-rating">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              {rating}
            </span>
          </div>
          {kosongCount > 0 && (
            <div className="absolute bottom-3 left-3">
              <span className="badge-featured">{kosongCount} kamar tersedia</span>
            </div>
          )}
        </div>
        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold font-heading text-slate-800">{kost.nama}</h1>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 shrink-0" />
                {[kost.alamat, kost.kota].filter(Boolean).join(', ')}
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <span className="text-2xl font-extrabold text-kost-700">{hargaMulai ? priceShort(hargaMulai) : '-'}</span>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">mulai / bulan</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 bg-[#F7F8FA] rounded-xl px-4 py-3 text-sm">
            <span className="flex items-center gap-1.5 text-slate-600">
              <BedDouble className="w-4 h-4 text-kost-600" />
              <b>{rooms.length}</b> <span className="text-slate-400 text-xs">kamar</span>
            </span>
            <span className="w-px h-4 bg-slate-200" />
            <span className="flex items-center gap-1.5 text-slate-600">
              <DoorOpen className="w-4 h-4 text-kost-600" />
              <b>{kosongCount}</b> <span className="text-slate-400 text-xs">kosong</span>
            </span>
          </div>

          {fasilitas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {fasilitas.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-kost-50 text-kost-700">
                  <Check className="w-3.5 h-3.5" /> {f}
                </span>
              ))}
            </div>
          )}

          {kost.deskripsi && (
            <p className="text-sm text-slate-500 leading-relaxed mt-4">{kost.deskripsi}</p>
          )}

          {kost.peraturan && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-[#F7F8FA] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <ScrollText className="w-4 h-4 text-kost-600" /> Peraturan Kost
              </h3>
              <p className="text-sm text-slate-500 whitespace-pre-line">{kost.peraturan}</p>
            </div>
          )}
        </div>
      </div>

      {/* Daftar kamar */}
      <section>
        <h2 className="text-xl font-bold font-heading text-slate-800 mb-4">Pilih Kamar</h2>
        {rooms.length === 0 ? (
          <EmptyState title="Belum ada kamar" message="Pemilik belum menambahkan kamar di kost ini." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {rooms.map((room, idx) => (
              <div key={room.id} className="kost-card-mini !p-4 flex-col !gap-3 animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    <img
                      src={imgSrc(room.foto_url, kost.foto_url ? imgSrc(kost.foto_url) : undefined)}
                      alt={`Kamar ${room.nomor_kamar}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-800 text-[15px]">Kamar {room.nomor_kamar}</h4>
                      <StatusBadge status={room.status} />
                    </div>
                    <p className="text-[11px] text-slate-400 capitalize mt-0.5">Tipe {room.tipe}</p>
                    <p className="text-base font-extrabold text-kost-700 mt-1">
                      {formatRupiah(room.harga_bulanan)}
                      <span className="text-[10px] font-semibold text-slate-400"> /bln</span>
                    </p>
                  </div>
                </div>
                {room.fasilitas?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {room.fasilitas.slice(0, 4).map((f) => (
                      <span key={f} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-medium">{f}</span>
                    ))}
                  </div>
                )}
                <button
                  disabled={room.status !== 'kosong'}
                  onClick={() => setSelectedRoom(room)}
                  className={room.status === 'kosong' ? 'btn-primary w-full text-sm' : 'btn w-full text-sm bg-slate-100 text-slate-400 cursor-not-allowed'}
                >
                  {room.status === 'kosong' ? <>Pilih Kamar Ini <ChevronRight className="w-4 h-4" /></> : 'Tidak Tersedia'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal booking */}
      {selectedRoom && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <form onSubmit={submitBooking} className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-1">
              <div className="icon-box"><CalendarDays className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold font-heading text-slate-800">Pesan Kamar {selectedRoom.nomor_kamar}</h3>
            </div>
            <p className="text-sm text-slate-400 mb-5 ml-[52px]">{kost.nama} • {formatRupiah(selectedRoom.harga_bulanan)}/bulan</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tanggal Masuk</label>
                <input type="date" className="input" value={tglMasuk} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setTglMasuk(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Durasi Sewa</label>
                <select className="input" value={durasi} onChange={(e) => setDurasi(e.target.value)}>
                  <option value={1}>1 bulan</option>
                  <option value={3}>3 bulan</option>
                  <option value={6}>6 bulan</option>
                  <option value={12}>12 bulan</option>
                </select>
              </div>
              <div className="flex justify-between items-center bg-[#F7F8FA] rounded-xl px-4 py-3">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Bayar</span>
                <span className="text-lg font-extrabold text-kost-700">{formatRupiah(Number(selectedRoom.harga_bulanan) * Number(durasi))}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1" disabled={booking}>
                {booking ? <><span className="spinner" /> Memesan...</> : 'Pesan & Lanjut Bayar'}
              </button>
              <button type="button" onClick={() => setSelectedRoom(null)} className="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
