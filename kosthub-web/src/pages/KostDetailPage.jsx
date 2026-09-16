import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, BedDouble, DoorOpen, Check,
  CalendarDays, ChevronRight, ScrollText, ExternalLink, Navigation, Trash2, MessageSquareText,
} from 'lucide-react';
import api, { formatRupiah, imgSrc, priceShort } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/Layout';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/useAuthStore';

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
  // Rating asli dari ulasan penghuni
  const reviewCount = kost.reviews_count || 0;
  const ratingAvg = kost.reviews_avg_rating != null ? Number(kost.reviews_avg_rating).toFixed(1) : null;
  const hargaMulai = rooms.length > 0 ? Math.min(...rooms.map((r) => Number(r.harga_bulanan))) : 0;
  const fasilitas = kost.fasilitas?.length > 0 ? kost.fasilitas : ['WiFi', 'Kasur', 'KM Dalam'];

  const reloadKost = () => {
    api.get(`/kosts/${id}`).then((r) => setKost(r.data)).catch(() => {});
  };

  // ===== Data lokasi untuk maps =====
  const lat = parseFloat(kost.latitude);
  const lng = parseFloat(kost.longitude);
  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
  const fullAddress = [kost.alamat, kost.kota].filter(Boolean).join(', ');
  const addressQuery = encodeURIComponent(fullAddress || kost.nama || '');
  const mapEmbedSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`
    : `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
  const routeUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : googleMapsUrl;

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => nav(-1)} className="btn-secondary text-xs py-2">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* Hero */}
      <div className="kost-card cursor-default">
        <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-slate-100">
          <img src={imgSrc(kost.foto_url)} alt={kost.nama} className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 flex gap-2">
            {ratingAvg ? (
              <span className="badge-rating" title={`${reviewCount} ulasan`}>
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {ratingAvg} <span className="font-semibold opacity-80">({reviewCount})</span>
              </span>
            ) : (
              <span className="badge-rating !bg-slate-700">Belum ada ulasan</span>
            )}
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

      {/* Lokasi / Maps */}
      <section className="kost-card cursor-default overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-5 md:p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-800 flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-kost-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-kost-700" />
              </span>
              Lokasi Kost
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 ml-[44px] flex items-center gap-1.5">
              <span className="truncate">{fullAddress || 'Alamat belum tersedia'}</span>
            </p>
          </div>
          {hasCoords && (
            <span className="ml-[44px] sm:ml-0 shrink-0 text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          )}
        </div>
        <div className="px-5 md:px-6">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <iframe
              title={`Peta lokasi ${kost.nama}`}
              src={mapEmbedSrc}
              className="w-full h-64 md:h-80 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto flex flex-col sm:flex-row gap-2">
              <a
                href={routeUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs py-2 shadow-soft-lg"
              >
                <Navigation className="w-3.5 h-3.5" /> Rute ke Sini
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-2 bg-white/95 backdrop-blur"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka di Google Maps
              </a>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 pb-5">
            {hasCoords
              ? 'Titik peta diambil dari koordinat yang diisi pemilik kost. Klik "Rute ke Sini" untuk navigasi.'
              : 'Pemilik belum mengisi koordinat, peta ditampilkan berdasarkan alamat. Minta pemilik memperbarui titik lokasi agar lebih akurat.'}
          </p>
        </div>
      </section>

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

      {/* Ulasan penghuni */}
      <ReviewSection kostId={kost.id} reviewCount={reviewCount} ratingAvg={ratingAvg} onChanged={reloadKost} />

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

/* ===== Section ulasan: daftar + tulis ulasan (1 per penghuni, bisa diubah) ===== */
function ReviewSection({ kostId, reviewCount, ratingAvg, onChanged }) {
  const toast = useToast();
  const { user } = useAuthStore();
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [rating, setRating] = useState(5);
  const [komentar, setKomentar] = useState('');
  const [saving, setSaving] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  const load = (p = 1, append = false) => {
    setLoadingList(true);
    api.get(`/kosts/${kostId}/reviews`, { params: { page: p } })
      .then((r) => {
        setList((prev) => (append ? [...prev, ...r.data.data] : r.data.data));
        setPage(r.data.current_page);
        setLastPage(r.data.last_page);
        // Prefill form bila user sudah pernah mengulas
        const mine = (append ? [...list, ...r.data.data] : r.data.data).find((v) => v.user_id === user?.id);
        if (mine && !append) {
          setRating(mine.rating);
          setKomentar(mine.komentar || '');
        } else if (mine) {
          setRating(mine.rating);
          setKomentar(mine.komentar || '');
        }
      })
      .catch(() => toast.error('Gagal memuat ulasan'))
      .finally(() => setLoadingList(false));
  };

  useEffect(() => { load(); setRating(5); setKomentar(''); }, [kostId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/kosts/${kostId}/reviews`, { rating: Number(rating), komentar: komentar.trim() || null });
      toast.success('Ulasan tersimpan. Terima kasih!');
      load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan ulasan');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Ulasan dihapus');
      // Reset form bila menghapus ulasan sendiri
      const gone = list.find((v) => v.id === reviewId);
      if (gone?.user_id === user?.id) { setRating(5); setKomentar(''); }
      load();
      onChanged?.();
    } catch {
      toast.error('Gagal menghapus ulasan');
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-kost-600" />
          Ulasan Penghuni
        </h2>
        <span className="text-sm font-semibold text-kost-600 flex items-center gap-1.5">
          {ratingAvg ? (
            <>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {ratingAvg} • {reviewCount} ulasan
            </>
          ) : (
            <span className="text-slate-400 font-medium">Belum ada ulasan</span>
          )}
        </span>
      </div>

      {/* Form tulis ulasan */}
      <form onSubmit={submit} className="card p-4 md:p-5 mb-4">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Beri penilaian Anda</p>
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s} type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverStar(s)}
              onMouseLeave={() => setHoverStar(0)}
              className="p-1 transition-transform hover:scale-110"
              title={`${s} bintang`}
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  s <= (hoverStar || rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-bold text-slate-600">{rating}/5</span>
        </div>
        <textarea
          className="input" rows={2}
          placeholder="Ceritakan pengalaman Anda tinggal di sini... (opsional)"
          value={komentar} onChange={(e) => setKomentar(e.target.value)} maxLength={1000}
        />
        <div className="flex justify-end mt-3">
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving ? <><span className="spinner" /> Menyimpan...</> : 'Kirim Ulasan'}
          </button>
        </div>
      </form>

      {/* Daftar ulasan */}
      {loadingList && list.length === 0 ? (
        <SkeletonCard lines={2} />
      ) : list.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-sm font-bold text-slate-700">Belum ada ulasan</p>
          <p className="text-xs text-slate-400 mt-1">Jadilah yang pertama mengulas kost ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((v) => (
            <div key={v.id} className="card !p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">{v.user?.name || 'Penghuni'}</p>
                  <p className="text-[11px] text-slate-400">{String(v.created_at || '').slice(0, 10)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {v.rating}/5
                  </span>
                  {v.user_id === user?.id && (
                    <button type="button" onClick={() => remove(v.id)} className="btn-ghost !px-2 text-rose-500 hover:bg-rose-50" title="Hapus ulasan saya">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {v.komentar && <p className="text-sm text-slate-500 mt-2 leading-relaxed">{v.komentar}</p>}
            </div>
          ))}
          {page < lastPage && (
            <div className="flex justify-center pt-1">
              <button type="button" onClick={() => load(page + 1, true)} disabled={loadingList} className="btn-secondary text-xs">
                {loadingList ? 'Memuat...' : 'Muat ulasan lainnya'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
