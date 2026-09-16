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
  SlidersHorizontal,
  RotateCcw,
  Megaphone,
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
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  // ===== Filter & urutan =====
  const [showFilter, setShowFilter] = useState(false);
  const [sort, setSort] = useState('terbaru'); // terbaru | termurah | termahal | terdekat
  const [minHarga, setMinHarga] = useState('');
  const [maxHarga, setMaxHarga] = useState('');
  const [debouncedMin, setDebouncedMin] = useState('');
  const [debouncedMax, setDebouncedMax] = useState('');
  const [kota, setKota] = useState('');
  const [hanyaTersedia, setHanyaTersedia] = useState(false);
  // ===== Batasi rekomendasi: 6 kartu, sisanya via "lihat selengkapnya" =====
  const RECOMMENDATION_LIMIT = 6;
  const [showAll, setShowAll] = useState(false);

  // Debounce pencarian + harga
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedMin(minHarga);
      setDebouncedMax(maxHarga);
    }, 500);
    return () => clearTimeout(t);
  }, [minHarga, maxHarga]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (debouncedQuery) params.search = debouncedQuery;
    if (coords) { params.lat = coords.lat; params.lng = coords.lng; }
    if (debouncedMin !== '' && !Number.isNaN(Number(debouncedMin))) params.min_harga = Number(debouncedMin);
    if (debouncedMax !== '' && !Number.isNaN(Number(debouncedMax))) params.max_harga = Number(debouncedMax);
    if (kota) params.kota = kota;
    if (hanyaTersedia) params.tersedia = 1;
    if (sort && sort !== 'terbaru') params.sort = sort;
    // Bila user pilih "terdekat" tapi lokasi belum aktif, tetap kirim agar backend tahu
    if (sort === 'terdekat' && !coords) params.sort = 'terdekat';
    // Ambil SEMUA halaman agar filter, urutan, dan hitungan akurat
    const fetchAllPages = async (url, p) => {
      const all = [];
      let page = 1;
      for (;;) {
        const r = await api.get(url, { params: { ...p, page, per_page: 100 } });
        all.push(...(r.data.data || []));
        if (!r.data.last_page || page >= r.data.last_page) break;
        page += 1;
        if (page > 20) break; // pengaman
      }
      return all;
    };
    Promise.all([
      fetchAllPages('/kosts', params).catch(() => []),
      fetchAllPages('/rooms', { status: 'kosong' }).catch(() => []),
      api.get('/dashboard-user').then((r) => r.data.contract || null).catch(() => null),
      api.get('/announcements').then((r) => (r.data.data || []).slice(0, 3)).catch(() => []),
    ])
      .then(([k, rm, c, a]) => { setKosts(k); setRooms(rm); setContract(c); setAnnouncements(a); })
      .finally(() => setLoading(false));
  }, [debouncedQuery, coords, debouncedMin, debouncedMax, kota, hanyaTersedia, sort]);

  // Kembali ke 6 kartu setiap kriteria pencarian / filter berubah
  useEffect(() => {
    setShowAll(false);
  }, [debouncedQuery, debouncedMin, debouncedMax, kota, hanyaTersedia, sort]);

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

  // Pilih "Terdekat dari Saya" otomatis meminta lokasi — tidak perlu tombol lokasi terpisah
  useEffect(() => {
    if (sort === 'terdekat' && !coords && !locating) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const resetFilter = () => {
    setSort('terbaru');
    setMinHarga('');
    setMaxHarga('');
    setKota('');
    setHanyaTersedia(false);
    setCoords(null);
    setCustomPriceOpen(false);
  };

  // Opsi kota dari data yang ada (fallback client)
  const kotaOptions = [...new Set(kosts.map((k) => k.kota).filter(Boolean))].sort();
  if (kota && !kotaOptions.includes(kota)) kotaOptions.push(kota);

  // Harga = satu filter (preset atau kustom), dihitung sekali
  const [customPriceOpen, setCustomPriceOpen] = useState(false);
  const pricePreset = (() => {
    const lo = minHarga.trim();
    const hi = maxHarga.trim();
    if (!lo && !hi) return 'all';
    if (!lo && hi === '1000000') return 'lt1';
    if (lo === '1000000' && hi === '2000000') return '1to2';
    if (lo === '2000000' && !hi) return 'gt2';
    return 'custom';
  })();
  const priceActive = debouncedMin !== '' || debouncedMax !== '';

  const activeFilterCount =
    (sort !== 'terbaru' ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (kota ? 1 : 0) +
    (hanyaTersedia ? 1 : 0);

  // Fallback client-side: saring + urutkan hasil API agar konsisten
  const displayKosts = (() => {
    let out = [...kosts];
    const lo = debouncedMin !== '' ? Number(debouncedMin) : null;
    const hi = debouncedMax !== '' ? Number(debouncedMax) : null;
    if (lo !== null && !Number.isNaN(lo)) out = out.filter((k) => Number(k.rooms_min_harga_bulanan || 0) >= lo);
    if (hi !== null && !Number.isNaN(hi)) out = out.filter((k) => Number(k.rooms_min_harga_bulanan || 0) <= hi);
    if (hanyaTersedia) out = out.filter((k) => (k.rooms_count || 0) - (k.rooms_terisi_count || 0) > 0);
    if (sort === 'termurah') out.sort((a, b) => Number(a.rooms_min_harga_bulanan || Infinity) - Number(b.rooms_min_harga_bulanan || Infinity));
    else if (sort === 'termahal') out.sort((a, b) => Number(b.rooms_min_harga_bulanan || 0) - Number(a.rooms_min_harga_bulanan || 0));
    else if (sort === 'terdekat') out.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    return out;
  })();

  const visibleKosts = showAll ? displayKosts : displayKosts.slice(0, RECOMMENDATION_LIMIT);
  const hiddenCount = displayKosts.length - visibleKosts.length;

  const applyPreset = (preset) => {
    if (preset === 'all') { setMinHarga(''); setMaxHarga(''); }
    else if (preset === 'lt1') { setMinHarga(''); setMaxHarga('1000000'); }
    else if (preset === '1to2') { setMinHarga('1000000'); setMaxHarga('2000000'); }
    else if (preset === 'gt2') { setMinHarga('2000000'); setMaxHarga(''); }
    setCustomPriceOpen(preset === 'custom');
  };
  const PRICE_PRESETS = [
    { key: 'all', label: 'Semua' },
    { key: 'lt1', label: '< Rp 1jt' },
    { key: '1to2', label: 'Rp 1–2jt' },
    { key: 'gt2', label: '> Rp 2jt' },
    { key: 'custom', label: 'Kustom' },
  ];

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

      {/* ===== Pengumuman pemilik ===== */}
      {announcements.length > 0 && (
        <section className="space-y-2.5">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  {a.kost?.nama || 'Pengumuman'}
                </p>
                <p className="text-sm font-bold text-slate-800 leading-snug">{a.judul}</p>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-0.5">{a.isi}</p>
              </div>
            </div>
          ))}
        </section>
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
            onClick={() => setShowFilter((v) => !v)}
            className={`relative whitespace-nowrap ${showFilter || activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
            title="Filter & urutan pencarian"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ===== Panel filter ===== */}
        {showFilter && (
          <div className="mt-3 pt-3 border-t border-slate-100 animate-fade-in">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Urutkan</label>
                <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="terbaru">Rekomendasi / Terbaru</option>
                  <option value="termurah">Harga Terendah</option>
                  <option value="termahal">Harga Tertinggi</option>
                  <option value="terdekat">Terdekat dari Saya</option>
                </select>
                {sort === 'terdekat' && (
                  <p className="text-[11px] font-semibold mt-1.5 flex items-center gap-1.5">
                    <LocateFixed className="w-3.5 h-3.5 text-kost-600 shrink-0" />
                    {locating ? (
                      <span className="text-slate-400">Mencari lokasi...</span>
                    ) : coords ? (
                      <span className="text-emerald-600">
                        Lokasi aktif.{' '}
                        <button type="button" onClick={() => setCoords(null)} className="font-bold underline hover:no-underline">
                          Matikan
                        </button>
                      </span>
                    ) : (
                      <span className="text-amber-600">Izin lokasi ditolak — daftar diurutkan biasa.</span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kota</label>
                <select className="input" value={kota} onChange={(e) => setKota(e.target.value)}>
                  <option value="">Semua Kota</option>
                  {kotaOptions.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Harga per bulan — satu kontrol */}
            <div className="mt-3">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Harga per bulan</label>
              <div className="flex flex-wrap gap-2">
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p.key} type="button" onClick={() => applyPreset(p.key)}
                    className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-colors ${
                      pricePreset === p.key
                        ? 'bg-kost-700 border-kost-700 text-white shadow-soft'
                        : 'border-slate-200 text-slate-600 hover:border-kost-400 hover:text-kost-700 hover:bg-kost-50/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {(customPriceOpen || pricePreset === 'custom') && (
                <div className="grid grid-cols-2 gap-3 mt-2.5">
                  <input
                    type="number" min="0" step="50000" className="input"
                    placeholder="Min, cth. 500000"
                    value={minHarga} onChange={(e) => setMinHarga(e.target.value)}
                  />
                  <input
                    type="number" min="0" step="50000" className="input"
                    placeholder="Max, cth. 2000000"
                    value={maxHarga} onChange={(e) => setMaxHarga(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-slate-100">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox" checked={hanyaTersedia}
                  onChange={(e) => setHanyaTersedia(e.target.checked)}
                  className="w-4 h-4 rounded accent-teal-700"
                />
                Hanya yang ada kamar kosong
              </label>
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetFilter} className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset filter
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ===== Section: Rekomendasi / Hasil Cari ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-heading text-slate-800">
            {debouncedQuery ? `Hasil "${debouncedQuery}"` : 'Rekomendasi'}
          </h2>
          <span className="text-sm font-semibold text-kost-600 flex items-center gap-1">
            {displayKosts.length} properti
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
        ) : displayKosts.length === 0 ? (
          <EmptyState
            title={debouncedQuery || activeFilterCount > 0 ? 'Tidak ditemukan' : 'Belum ada kost'}
            message={debouncedQuery || activeFilterCount > 0 ? `Tidak ada kost yang cocok dengan pencarian / filter saat ini.` : 'Properti kost akan muncul di sini setelah admin menambahkannya.'}
            action={activeFilterCount > 0 ? resetFilter : undefined}
            actionLabel="Reset Filter"
          />
        ) : (
          <>
            {/* Mobile scroll */}
            <div className="md:hidden scroll-snap-x -mx-5 px-5">
              {visibleKosts.map((kost, idx) => (
                <RecommendationCard key={kost.id} kost={kost} index={idx} onOpen={() => openKost(kost.id)} />
              ))}
            </div>
            {/* Desktop grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleKosts.map((kost, idx) => (
                <RecommendationCard key={kost.id} kost={kost} index={idx} onOpen={() => openKost(kost.id)} />
              ))}
            </div>
            {/* Lihat selengkapnya / ciutkan */}
            {(hiddenCount > 0 || showAll) && (
              <div className="flex justify-center mt-5">
                {hiddenCount > 0 ? (
                  <button onClick={() => setShowAll(true)} className="btn-secondary text-sm">
                    Lihat {displayKosts.length} properti selengkapnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => setShowAll(false)} className="btn-ghost text-kost-700 font-semibold text-sm">
                    Tampilkan lebih sedikit
                  </button>
                )}
              </div>
            )}
          </>
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
  const ratingAvg = kost.reviews_avg_rating != null ? Number(kost.reviews_avg_rating).toFixed(1) : null;
  const facilities = (kost.fasilitas && kost.fasilitas.length > 0
    ? kost.fasilitas.slice(0, 3)
    : ['WiFi', 'Kasur', 'KM Dalam']
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
        {/* Rating badge (ulasan asli, sembunyikan bila belum ada) */}
        {ratingAvg && (
          <div className="absolute top-3 right-3">
            <span className="badge-rating">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              {ratingAvg}
            </span>
          </div>
        )}
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