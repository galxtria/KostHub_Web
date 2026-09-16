import { useEffect, useState } from 'react';
import {
  Users, Search, Plus, Phone, Mail, BedDouble, Wallet,
  CalendarDays, FilePlus2, CheckCircle2, Ban, Eye, ChevronRight,
} from 'lucide-react';
import api, { formatRupiah, imgSrc } from '../api/axios';
import { StatusBadge } from '../components/Layout';
import { Avatar } from '../components/Layout';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';

const TABS = [
  { key: 'penghuni', label: 'Penghuni' },
  { key: 'kontrak', label: 'Kontrak' },
];

const emptyContract = { user_id: '', room_id: '', tgl_masuk: '', tgl_keluar: '', deposit: '' };
const emptyInvoice = { contract_id: '', jenis: 'sewa', periode: '', jumlah: '', jatuh_tempo: '' };

export default function PenghuniPage() {
  const toast = useToast();
  const [tab, setTab] = useState('penghuni');

  // Penghuni list
  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState(null);
  const [usersPage, setUsersPage] = useState(1);
  const [searchUser, setSearchUser] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Kontrak list
  const [contracts, setContracts] = useState([]);
  const [contractsMeta, setContractsMeta] = useState(null);
  const [contractsPage, setContractsPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchContract, setSearchContract] = useState('');
  const [loadingContracts, setLoadingContracts] = useState(true);

  // Opsi form
  const [roomsKosong, setRoomsKosong] = useState([]);

  // Modal kontrak
  const [contractForm, setContractForm] = useState(emptyContract);
  const [showContractModal, setShowContractModal] = useState(false);
  const [savingContract, setSavingContract] = useState(false);

  // Modal invoice
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [invoiceContract, setInvoiceContract] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);

  // Detail penghuni
  const [detailUser, setDetailUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Reset password penghuni oleh admin
  const [newPw, setNewPw] = useState({ password: '', confirmation: '' });
  const [savingPw, setSavingPw] = useState(false);

  // Konfirmasi
  const [finishTarget, setFinishTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [processing, setProcessing] = useState(false);

  const loadUsers = (p = usersPage) => {
    setLoadingUsers(true);
    const params = new URLSearchParams({ page: p });
    if (searchUser) params.set('search', searchUser);
    api.get(`/users?${params}`)
      .then((r) => { setUsers(r.data.data || []); setUsersMeta(r.data); })
      .catch(() => toast.error('Gagal memuat data penghuni'))
      .finally(() => setLoadingUsers(false));
  };

  const loadContracts = (p = contractsPage) => {
    setLoadingContracts(true);
    const params = new URLSearchParams({ page: p });
    if (filterStatus) params.set('status', filterStatus);
    if (searchContract) params.set('search', searchContract);
    api.get(`/contracts?${params}`)
      .then((r) => { setContracts(r.data.data || []); setContractsMeta(r.data); })
      .catch(() => toast.error('Gagal memuat data kontrak'))
      .finally(() => setLoadingContracts(false));
  };

  const loadRoomsKosong = () => {
    api.get('/rooms', { params: { status: 'kosong' } })
      .then((r) => setRoomsKosong(r.data.data || []))
      .catch(() => {});
  };

  useEffect(() => { setUsersPage(1); loadUsers(1); }, [searchUser]);
  useEffect(() => { loadUsers(); }, [usersPage]);
  useEffect(() => { setContractsPage(1); loadContracts(1); }, [filterStatus, searchContract]);
  useEffect(() => { loadContracts(); }, [contractsPage]);
  useEffect(() => { loadRoomsKosong(); }, []);

  const reloadAll = () => { loadUsers(); loadContracts(); loadRoomsKosong(); };

  const aktifCount = contracts.filter((c) => c.status === 'aktif').length;

  /* ----- Kontrak: buat ----- */
  const openContractModal = (userId = '') => {
    setContractForm({ ...emptyContract, user_id: userId, tgl_masuk: new Date().toISOString().slice(0, 10) });
    setShowContractModal(true);
  };

  const submitContract = async (e) => {
    e.preventDefault();
    setSavingContract(true);
    try {
      await api.post('/contracts', {
        ...contractForm,
        tgl_keluar: contractForm.tgl_keluar || null,
        deposit: Number(contractForm.deposit) || 0,
      });
      toast.success('Kontrak berhasil dibuat. Kamar menjadi terisi.');
      setShowContractModal(false);
      reloadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat kontrak');
    } finally {
      setSavingContract(false);
    }
  };

  /* ----- Kontrak: selesaikan / batalkan ----- */
  const doFinish = async () => {
    if (!finishTarget) return;
    setProcessing(true);
    try {
      await api.post(`/contracts/${finishTarget.id}/finish`);
      toast.success('Kontrak diselesaikan. Kamar kembali kosong.');
      setFinishTarget(null);
      reloadAll();
    } catch {
      toast.error('Gagal menyelesaikan kontrak');
    } finally {
      setProcessing(false);
    }
  };

  const doCancel = async () => {
    if (!cancelTarget) return;
    setProcessing(true);
    try {
      await api.post(`/contracts/${cancelTarget.id}/cancel`);
      toast.success('Kontrak dibatalkan. Tagihan belum bayar ikut dihapus.');
      setCancelTarget(null);
      reloadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan kontrak');
    } finally {
      setProcessing(false);
    }
  };

  /* ----- Invoice: buat ----- */
  const openInvoiceModal = (contract) => {
    setInvoiceContract(contract);
    setInvoiceForm({
      contract_id: contract.id,
      jenis: 'sewa',
      periode: new Date().toISOString().slice(0, 10),
      jumlah: contract.room?.harga_bulanan || '',
      jatuh_tempo: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
    });
    setShowInvoiceModal(true);
  };

  const submitInvoice = async (e) => {
    e.preventDefault();
    setSavingInvoice(true);
    try {
      await api.post('/invoices', { ...invoiceForm, jumlah: Number(invoiceForm.jumlah) });
      toast.success('Tagihan berhasil dibuat');
      setShowInvoiceModal(false);
      reloadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat tagihan');
    } finally {
      setSavingInvoice(false);
    }
  };

  /* ----- Detail penghuni ----- */
  const openDetail = (userId) => {
    setLoadingDetail(true);
    setDetailUser({ id: userId });
    api.get(`/users/${userId}`)
      .then((r) => setDetailUser(r.data))
      .catch(() => { toast.error('Gagal memuat detail'); setDetailUser(null); })
      .finally(() => setLoadingDetail(false));
  };

  const setC = (k, v) => setContractForm((p) => ({ ...p, [k]: v }));
  const setI = (k, v) => setInvoiceForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-box"><Users className="w-5 h-5" /></div>
          <div>
            <h2 className="page-title">Data Penghuni</h2>
            <p className="page-subtitle">Kelola penghuni, kontrak sewa, dan tagihan</p>
          </div>
        </div>
        <button onClick={() => openContractModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> Buat Kontrak
        </button>
      </div>

      {/* Statistik ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-kost-600" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Penghuni</p>
          </div>
          <p className="text-2xl font-extrabold font-heading text-slate-800">{usersMeta?.total ?? users.length}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-1">
            <BedDouble className="w-4 h-4 text-kost-600" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kontrak Aktif</p>
          </div>
          <p className="text-2xl font-extrabold font-heading text-kost-700">{aktifCount}</p>
        </div>
        <div className="kpi-card col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-kost-600" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kamar Kosong</p>
          </div>
          <p className="text-2xl font-extrabold font-heading text-slate-800">{roomsKosong.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-100 shadow-card p-1.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-kost-700 text-white shadow-soft' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: Penghuni ===== */}
      {tab === 'penghuni' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input pl-11"
                placeholder="Cari nama, email, atau no. HP..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="grid md:grid-cols-2 gap-4">
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </div>
          ) : users.length === 0 ? (
            <EmptyState title="Belum ada penghuni" message={searchUser ? `Tidak cocok dengan "${searchUser}"` : 'Penghuni yang mendaftar akan muncul di sini.'} />
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {users.map((u, idx) => {
                  const ac = u.active_contract;
                  return (
                    <div key={u.id} className="kost-card p-5 cursor-default animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar user={u} className="w-12 h-12 text-base rounded-2xl" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold font-heading text-slate-800 truncate">{u.name}</h3>
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                          {u.phone && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {u.phone}
                            </p>
                          )}
                        </div>
                        {u.tagihan_aktif_count > 0 && (
                          <span className="badge badge-belum shrink-0">{u.tagihan_aktif_count} tagihan</span>
                        )}
                      </div>

                      {ac ? (
                        <div className="bg-kost-50/60 border border-kost-100 rounded-xl px-4 py-2.5 text-sm mb-3">
                          <p className="font-bold text-kost-800">
                            {ac.room?.kost?.nama} • Kamar {ac.room?.nomor_kamar}
                          </p>
                          <p className="text-xs text-kost-600/80 flex items-center gap-1 mt-0.5">
                            <CalendarDays className="w-3 h-3" />
                            {ac.tgl_masuk?.slice(0, 10)} → {ac.tgl_keluar?.slice(0, 10) || '—'}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-400 mb-3">
                          Tidak memiliki kontrak aktif
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button onClick={() => openDetail(u.id)} className="btn-secondary flex-1 text-xs py-2">
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                        {!ac && (
                          <button onClick={() => openContractModal(u.id)} className="btn-primary flex-1 text-xs py-2">
                            <Plus className="w-3.5 h-3.5" /> Buat Kontrak
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination meta={usersMeta} onPageChange={setUsersPage} />
            </>
          )}
        </div>
      )}

      {/* ===== TAB: Kontrak ===== */}
      {tab === 'kontrak' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-11"
                  placeholder="Cari nama / email penghuni..."
                  value={searchContract}
                  onChange={(e) => setSearchContract(e.target.value)}
                />
              </div>
              <select className="input w-auto min-w-[150px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="selesai">Selesai</option>
                <option value="batal">Batal</option>
              </select>
            </div>
          </div>

          {loadingContracts ? (
            <div className="grid md:grid-cols-2 gap-4">
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState title="Belum ada kontrak" message="Buat kontrak untuk menempatkan penghuni ke kamar." action={() => openContractModal()} actionLabel="Buat Kontrak" />
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Penghuni</th>
                      <th>Kamar</th>
                      <th>Periode</th>
                      <th>Deposit</th>
                      <th>Status</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <p className="font-semibold text-slate-800">{c.user?.name}</p>
                          <p className="text-[11px] text-slate-400">{c.user?.email}</p>
                        </td>
                        <td>
                          <p className="font-medium">{c.room?.kost?.nama}</p>
                          <p className="text-[11px] text-slate-400">Kamar {c.room?.nomor_kamar}</p>
                        </td>
                        <td className="text-slate-400 text-xs whitespace-nowrap">
                          {c.tgl_masuk?.slice(0, 10)} → {c.tgl_keluar?.slice(0, 10) || '—'}
                        </td>
                        <td className="font-semibold">{formatRupiah(c.deposit)}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td className="text-right whitespace-nowrap">
                          {c.status === 'aktif' ? (
                            <div className="flex gap-1.5 justify-end">
                              <button onClick={() => openInvoiceModal(c)} className="btn-secondary text-xs py-1.5 px-3" title="Buatkan tagihan">
                                <FilePlus2 className="w-3.5 h-3.5" /> Tagihan
                              </button>
                              <button onClick={() => setFinishTarget(c)} className="btn-success text-xs py-1.5 px-3" title="Selesaikan kontrak">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setCancelTarget(c)} className="btn-ghost text-rose-600 hover:bg-rose-50 text-xs py-1.5 px-2.5" title="Batalkan kontrak">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination meta={contractsMeta} onPageChange={setContractsPage} />
            </>
          )}
        </div>
      )}

      {/* ===== Modal: Buat Kontrak ===== */}
      {showContractModal && (
        <div className="modal-overlay" onClick={() => setShowContractModal(false)}>
          <form onSubmit={submitContract} className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-box"><BedDouble className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold font-heading text-slate-800">Buat Kontrak Sewa</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Penghuni</label>
                <select className="input" value={contractForm.user_id} onChange={(e) => setC('user_id', e.target.value)} required>
                  <option value="">-- Pilih Penghuni --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} disabled={!!u.active_contract}>
                      {u.name} — {u.email}{u.active_contract ? ' (sudah kontrak)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kamar Kosong</label>
                <select className="input" value={contractForm.room_id} onChange={(e) => setC('room_id', e.target.value)} required>
                  <option value="">-- Pilih Kamar --</option>
                  {roomsKosong.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kost?.nama} • Kamar {r.nomor_kamar} • {formatRupiah(r.harga_bulanan)}/bln
                    </option>
                  ))}
                </select>
                {roomsKosong.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Tidak ada kamar kosong saat ini.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tgl Masuk</label>
                  <input type="date" className="input" value={contractForm.tgl_masuk} onChange={(e) => setC('tgl_masuk', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tgl Keluar</label>
                  <input type="date" className="input" value={contractForm.tgl_keluar} min={contractForm.tgl_masuk} onChange={(e) => setC('tgl_keluar', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Deposit (Rp)</label>
                <input type="number" className="input" min="0" placeholder="0" value={contractForm.deposit} onChange={(e) => setC('deposit', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1" disabled={savingContract}>
                {savingContract ? <><span className="spinner" /> Menyimpan...</> : 'Buat Kontrak'}
              </button>
              <button type="button" onClick={() => setShowContractModal(false)} className="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* ===== Modal: Buat Tagihan ===== */}
      {showInvoiceModal && invoiceContract && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <form onSubmit={submitInvoice} className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-1">
              <div className="icon-box"><FilePlus2 className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold font-heading text-slate-800">Buat Tagihan</h3>
            </div>
            <p className="text-sm text-slate-400 mb-5 ml-[52px]">
              {invoiceContract.user?.name} • {invoiceContract.room?.kost?.nama} Kamar {invoiceContract.room?.nomor_kamar}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Jenis</label>
                  <select className="input" value={invoiceForm.jenis} onChange={(e) => setI('jenis', e.target.value)}>
                    <option value="sewa">Sewa</option>
                    <option value="deposit">Deposit</option>
                    <option value="denda">Denda</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Jumlah (Rp)</label>
                  <input type="number" className="input" min="0" value={invoiceForm.jumlah} onChange={(e) => setI('jumlah', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Periode</label>
                  <input type="date" className="input" value={invoiceForm.periode} onChange={(e) => setI('periode', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Jatuh Tempo</label>
                  <input type="date" className="input" value={invoiceForm.jatuh_tempo} onChange={(e) => setI('jatuh_tempo', e.target.value)} required />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1" disabled={savingInvoice}>
                {savingInvoice ? <><span className="spinner" /> Menyimpan...</> : 'Buat Tagihan'}
              </button>
              <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* ===== Modal: Detail Penghuni ===== */}
      {detailUser && (
        <div className="modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="modal-content !max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {loadingDetail || !detailUser.name ? (
              <div className="space-y-3">
                <div className="skeleton h-6 w-48" />
                <div className="skeleton h-20 rounded-xl" />
                <div className="skeleton h-20 rounded-xl" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <Avatar user={detailUser} className="w-12 h-12 text-base rounded-2xl" />
                  <div>
                    <h3 className="text-lg font-bold font-heading text-slate-800">{detailUser.name}</h3>
                    <p className="text-xs text-slate-400">{detailUser.email}{detailUser.phone ? ` • ${detailUser.phone}` : ''}</p>
                  </div>
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Riwayat Kontrak ({detailUser.contracts?.length || 0})
                </h4>
                <div className="space-y-2.5">
                  {(detailUser.contracts || []).map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-sm font-bold text-slate-800">
                          {c.room?.kost?.nama} • Kamar {c.room?.nomor_kamar}
                        </p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                        <CalendarDays className="w-3 h-3" />
                        {c.tgl_masuk?.slice(0, 10)} → {c.tgl_keluar?.slice(0, 10) || '—'} • Deposit {formatRupiah(c.deposit)}
                      </p>
                      {(c.invoices || []).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                          {c.invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-mono">{inv.kode_invoice}</span>
                              <span className="font-bold text-slate-700">{formatRupiah(inv.jumlah)}</span>
                              <StatusBadge status={inv.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {(detailUser.contracts || []).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">Belum pernah memiliki kontrak.</p>
                  )}
                </div>
                <form
                  className="mt-4 rounded-xl border border-slate-100 bg-[#F7F8FA] p-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (newPw.password !== newPw.confirmation) {
                      toast.error('Konfirmasi password tidak cocok');
                      return;
                    }
                    setSavingPw(true);
                    try {
                      const r = await api.post(`/users/${detailUser.id}/reset-password`, {
                        password: newPw.password,
                        password_confirmation: newPw.confirmation,
                      });
                      toast.success(r.data.message || 'Password diganti');
                      setNewPw({ password: '', confirmation: '' });
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Gagal mengganti password');
                    } finally {
                      setSavingPw(false);
                    }
                  }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Reset Password Penghuni
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      className="input" type="password" placeholder="Password baru (min 6)"
                      value={newPw.password} onChange={(e) => setNewPw({ ...newPw, password: e.target.value })}
                      required autoComplete="new-password"
                    />
                    <input
                      className="input" type="password" placeholder="Ulangi password baru"
                      value={newPw.confirmation} onChange={(e) => setNewPw({ ...newPw, confirmation: e.target.value })}
                      required autoComplete="new-password"
                    />
                  </div>
                  <button type="submit" className="btn-secondary w-full mt-2.5 text-xs" disabled={savingPw}>
                    {savingPw ? <><span className="spinner" /> Menyimpan...</> : 'Ganti Password Penghuni Ini'}
                  </button>
                </form>
                <button onClick={() => setDetailUser(null)} className="btn-secondary w-full mt-5">
                  Tutup <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Konfirmasi */}
      <ConfirmDialog
        open={!!finishTarget}
        onClose={() => !processing && setFinishTarget(null)}
        onConfirm={doFinish}
        title="Selesaikan Kontrak?"
        message={`Kontrak ${finishTarget?.user?.name} (Kamar ${finishTarget?.room?.nomor_kamar}) akan ditandai selesai dan kamar kembali kosong.`}
        confirmText="Ya, Selesaikan"
        variant="info"
      />
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => !processing && setCancelTarget(null)}
        onConfirm={doCancel}
        title="Batalkan Kontrak?"
        message="Kontrak dibatalkan dan tagihan yang belum dibayar ikut dihapus. Tagihan lunas tetap tercatat."
        confirmText="Ya, Batalkan"
      />
    </div>
  );
}
