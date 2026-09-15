import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatRupiah, imgSrc, priceShort } from '../api/axios';
import { StatusBadge } from '../components/Layout';
import { SkeletonKPI, SkeletonTable, SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatDistance } from '../store/useSearchStore';
import {
  Wifi,
  Snowflake,
  Bath,
  BedDouble,
  Star,
  MapPin,
  ChevronRight,
  Shield,
  ParkingCircle,
  Tv,
  UtensilsCrossed,
  Wallet,
  DoorOpen,
  TriangleAlert,
  ClipboardList,
  Search,
  LocateFixed,
} from 'lucide-react';

/* ========== Admin Dashboard ========== */
export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard-admin')
      .then((r) => setData(r.data))
      .catch(() => setError('Gagal memuat data dashboard'));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;

  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonKPI count={4} />
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Pemasukan Bulan Ini',
      value: formatRupiah(data.pemasukan_bulan_ini),
      Icon: Wallet,
    },
    {
      label: 'Okupansi',
      value: `${data.kamar_terisi}/${data.total_kamar}`,
      suffix: 'kamar terisi',
      Icon: BedDouble,
    },
    {
      label: 'Kamar Kosong',
      value: data.kamar_kosong,
      suffix: 'siap dihuni',
      Icon: DoorOpen,
    },
    {
      label: 'Overdue / Verifikasi',
      value: `${data.tagihan_overdue} / ${data.perlu_verifikasi}`,
      suffix: 'perlu perhatian',
      Icon: TriangleAlert,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section: Ringkasan */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-heading text-slate-800">Ringkasan</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div
              key={kpi.label}
              className="kpi-card animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </p>
                <div className="w-10 h-10 rounded-xl bg-kost-50 flex items-center justify-center shrink-0">
                  <kpi.Icon className="w-5 h-5 text-kost-700" />
                </div>
              </div>
              <p className="text-2xl font-extrabold font-heading text-slate-800">
                {kpi.value}
              </p>
              {kpi.suffix && (
                <p className="text-xs text-slate-400 mt-1">{kpi.suffix}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section: Pembayaran Terbaru */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-heading text-slate-800">Pembayaran Terbaru</h2>
          <span className="text-sm font-semibold text-kost-600 flex items-center gap-1">
            <ClipboardList className="w-4 h-4" />
            {data.pembayaran_terbaru.length} transaksi
          </span>
        </div>

        <div className="card p-0 overflow-hidden">
          {data.pembayaran_terbaru.length === 0 ? (
            <EmptyState title="Belum ada pembayaran" message="Data pembayaran akan muncul di sini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Penghuni</th>
                    <th>Jumlah</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pembayaran_terbaru.map((p) => (
                    <tr key={p.id}>
                      <td className="font-semibold text-kost-700">
                        {p.invoice?.kode_invoice || p.invoice_id}
                      </td>
                      <td>{p.invoice?.user?.name || '-'}</td>
                      <td className="font-bold">{formatRupiah(p.jumlah_bayar)}</td>
                      <td><StatusBadge status={p.status_verifikasi} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ========== User Dashboard ========== */
export function UserDashboard() {
  const nav = useNavigate();
  const toast = useToast();
  const [kosts, setKosts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  // Debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (debouncedQuery) params.search = debouncedQuery;
    if (coords) { params.lat = coords.lat; params.lng = coords.lng; }
    Promise.all([
      api.get('/kosts', { params }).then((r) => r.data.data || []).catch(() => []),
      api.get('/rooms', { params: { status: 'kosong' } }).then((r) => r.data.data || []).catch(() => []),
      api.get('/dashboard-user').then((r) => r.data.contract || null).catch(() => null),
    ])
      .then(([k, rm, c]) => { setKosts(k); setRooms(rm); setContract(c); })
      .finally(() => setLoading(false));
  }, [debouncedQuery, coords]);

  const openKost = (id) => nav(`/kost/${id}`);

  const requestLocation = () => {
    if (coords) { setCoords(null); return; }
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolokasi');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success('Lokasi aktif. Menampilkan kos terdekat.');
      },
      () => {
        setLocating(false);
        toast.error('Izin lokasi ditolak. Aktifkan izin lokasi di browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ===== Banner: Kamar saya (bila punya kontrak aktif) ===== */}
      {contract && (
        <button
          onClick={() => nav('/pesanan')}
          className="w-full text-left kost-card !cursor-pointer p-4 flex items-center gap-4 animate-slide-up"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
            <img
              src={imgSrc(contract.room?.foto_url, contract.room?.kost?.foto_url ? imgSrc(contract.room.kost.foto_url) : undefined)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-kost-600">Kamar Saya</p>
            <p className="font-bold text-slate-800 truncate">
              {contract.room?.kost?.nama} • Kamar {contract.room?.nomor_kamar}
            </p>
            <p className="text-xs text-slate-400">Masuk {contract.tgl_masuk?.slice(0, 10)} • Kelola pesanan</p>
          </div>
          <ChevronRight className="w-5 h-5 text-kost-600 shrink-0" />
        </button>
      )}

      {/* ===== Search + Lokasi ===== */}
      <section className="card p-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-11"
              placeholder="Cari kost, daerah, atau kota..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-lg leading-none"
                title="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={requestLocation}
            disabled={locating}
            className={coords ? 'btn-primary whitespace-nowrap' : 'btn-secondary whitespace-nowrap'}
            title={coords ? 'Matikan lokasi' : 'Tampilkan kos terdekat dari lokasi saya'}
          >
            <LocateFixed className="w-4 h-4" />
            {locating ? 'Mencari lokasi...' : coords ? 'Terdekat: Aktif' : 'Terdekat'}
          </button>
        </div>
      </section>

      {/* ===== Section: Rekomendasi / Hasil Cari ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-heading text-slate-800">
            {debouncedQuery ? `Hasil "${debouncedQuery}"` : 'Rekomendasi'}
          </h2>
          <span className="text-sm font-semibold text-kost-600 flex items-center gap-1">
            {kosts.length} properti
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        {loading ? (
          <>
            <div className="md:hidden scroll-snap-x -mx-5 px-5">
              {[...Array(3)].map((_, i) => <div key={i} className="w-[280px]"><SkeletonCard lines={3} /></div>)}
            </div>
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
            </div>
          </>
        ) : kosts.length === 0 ? (
          <EmptyState
            title={debouncedQuery ? 'Tidak ditemukan' : 'Belum ada kost'}
            message={debouncedQuery ? `Tidak ada kost yang cocok dengan "${debouncedQuery}".` : 'Properti kost akan muncul di sini setelah admin menambahkannya.'}
          />
        ) : (
          <>
            {/* Mobile scroll */}
            <div className="md:hidden scroll-snap-x -mx-5 px-5">
              {kosts.map((kost, idx) => (
                <RecommendationCard key={kost.id} kost={kost} index={idx} onOpen={() => openKost(kost.id)} />
              ))}
            </div>
            {/* Desktop grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kosts.map((kost, idx) => (
                <RecommendationCard key={kost.id} kost={kost} index={idx} onOpen={() => openKost(kost.id)} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ===== Section: Terdekat dari Anda ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-heading text-slate-800">Terdekat dari Anda</h2>
          {!coords && (
            <button onClick={requestLocation} className="text-sm font-semibold text-kost-600 hover:text-kost-700 transition-colors flex items-center gap-1">
              <LocateFixed className="w-4 h-4" />
              Aktifkan lokasi
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : !coords ? (
          <div className="card text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-kost-50 flex items-center justify-center mb-3">
              <LocateFixed className="w-6 h-6 text-kost-600" />
            </div>
            <p className="text-sm font-bold text-slate-700">Lihat kos terdekat dari posisi Anda</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Aktifkan izin lokasi, kami urutkan dari yang paling dekat.</p>
            <button onClick={requestLocation} disabled={locating} className="btn-primary text-xs">
              <LocateFixed className="w-3.5 h-3.5" /> {locating ? 'Mencari lokasi...' : 'Gunakan Lokasi Saya'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kosts.filter((k) => k.distance_km !== null && k.distance_km !== undefined).slice(0, 4).map((kost, idx) => (
              <NearbyKostCard key={kost.id} kost={kost} index={idx} onOpen={() => openKost(kost.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Section: Kamar Tersedia ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-heading text-slate-800">Kamar Tersedia</h2>
          <span className="text-sm font-semibold text-kost-600 flex items-center gap-1">
            {rooms.length} kamar kosong
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState title="Semua kamar penuh" message="Belum ada kamar kosong saat ini. Cek lagi nanti." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.slice(0, 6).map((room, idx) => (
              <NearbyCard key={room.id} room={room} index={idx} onOpen={() => openKost(room.kost_id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const FACILITY_ICONS = [Wifi, BedDouble, Bath, Snowflake, Shield, ParkingCircle, Tv, UtensilsCrossed];

/* ===== Recommendation Card Component (data API asli, klik -> detail) ===== */
function RecommendationCard({ kost, index, onOpen }) {
  const kosong = (kost.rooms_count || 0) - (kost.rooms_terisi_count || 0);
  const rating = (4.5 + ((kost.id || 0) % 6) / 10).toFixed(1);
  const facilities = (kost.fasilitas && kost.fasilitas.length > 0
    ? kost.fasilitas.slice(0, 3)
    : ['WiFi', 'Kasur Nyaman', 'KM Dalam']
  ).map((label, i) => ({ icon: FACILITY_ICONS[i % FACILITY_ICONS.length], label }));

  return (
    <div
      className="kost-card w-[280px] md:w-auto animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(); }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imgSrc(kost.foto_url, `/images/kost/kost-${(index % 4) + 1}.jpg`)}
          alt={kost.nama}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        {/* Kosong badge */}
        {kosong > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="badge-featured">{kosong} kamar tersedia</span>
          </div>
        )}
        {/* Rating badge */}
        <div className="absolute top-3 right-3">
          <span className="badge-rating">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            {rating}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name & Price */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-800 text-[15px] leading-snug line-clamp-1">
            {kost.nama}
          </h3>
          <div className="text-right shrink-0">
            <span className="text-sm font-extrabold text-kost-700 leading-none">
              {kost.rooms_min_harga_bulanan ? `${priceShort(kost.rooms_min_harga_bulanan)}` : 'Hubungi kami'}
            </span>
            {kost.rooms_min_harga_bulanan && (
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">mulai / bulan</span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 truncate">
            {[kost.alamat, kost.kota].filter(Boolean).join(', ')}
          </span>
          {kost.distance_km !== null && kost.distance_km !== undefined && (
            <span className="ml-auto shrink-0 text-[11px] font-bold text-kost-700 bg-kost-50 px-2 py-0.5 rounded-lg">
              {formatDistance(kost.distance_km)}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mb-3"></div>

        {/* Facilities */}
        <div className="flex items-center gap-4">
          {facilities.map((f, i) => (
            <div key={i} className="facility-tag">
              <f.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== Nearby Kost Card (dengan jarak, klik -> detail) ===== */
function NearbyKostCard({ kost, index, onOpen }) {
  const kosong = (kost.rooms_count || 0) - (kost.rooms_terisi_count || 0);
  return (
    <div
      className="kost-card-mini animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(); }}
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
        <img
          src={imgSrc(kost.foto_url, `/images/kost/kost-${(index % 4) + 1}.jpg`)}
          alt={kost.nama}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm leading-snug truncate">{kost.nama}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{[kost.alamat, kost.kota].filter(Boolean).join(', ')}</span>
          </p>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-kost-700 bg-kost-50 px-2 py-0.5 rounded-lg">
            <LocateFixed className="w-3 h-3" />
            {formatDistance(kost.distance_km)}
          </span>
          <div className="text-right">
            <span className="text-sm font-bold text-kost-700">
              {kost.rooms_min_harga_bulanan ? priceShort(kost.rooms_min_harga_bulanan) : '-'}
            </span>
            <span className="text-[10px] text-slate-400 ml-0.5">/ bln</span>
          </div>
        </div>
      </div>
      {kosong <= 0 && (
        <span className="badge badge-kosong self-start shrink-0">Penuh</span>
      )}
    </div>
  );
}

/* ===== Available Room Card Component (klik -> detail kost) ===== */
function NearbyCard({ room, index, onOpen }) {
  return (
    <div
      className="kost-card-mini animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(); }}
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
        <img
          src={imgSrc(room.foto_url, room.kost?.foto_url ? imgSrc(room.kost.foto_url) : `/images/kost/kost-${(index % 4) + 1}.jpg`)}
          alt={room.kost?.nama || `Kamar ${room.nomor_kamar}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm leading-snug truncate">
            {room.kost?.nama || 'Kost'} • Kamar {room.nomor_kamar}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <BedDouble className="w-3 h-3 shrink-0" />
            <span className="truncate capitalize">Tipe {room.tipe}</span>
          </p>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="badge badge-terisi">Tersedia</span>
          <div className="text-right">
            <span className="text-sm font-bold text-kost-700">{priceShort(room.harga_bulanan)}</span>
            <span className="text-[10px] text-slate-400 ml-0.5">/ bln</span>
          </div>
        </div>
      </div>
    </div>
  );
}