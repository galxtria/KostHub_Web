import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon, LogOut, ClipboardList, ReceiptText, Search,
  BedDouble, Wallet, ChevronRight, Phone, Mail, CalendarDays,
  Pencil, ShieldCheck, Eye, EyeOff, Camera, Wrench,
} from 'lucide-react';
import api, { formatRupiah, imgSrc } from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';
import { SkeletonCard } from '../components/ui/Skeleton';

export default function ProfilPage() {
  const { user, logout, setUser } = useAuthStore();
  const nav = useNavigate();
  const toast = useToast();
  const [summary, setSummary] = useState(null);

  // Edit profil
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Ganti password
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get('/dashboard-user')
      .then((r) => setSummary(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  const doLogout = async () => {
    await logout();
    nav('/login');
  };

  const onAvatarChange = (file) => {
    setAvatarFile(file || null);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const startEdit = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let r;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('_method', 'PUT');
        fd.append('name', form.name);
        fd.append('email', form.email);
        fd.append('phone', form.phone || '');
        fd.append('avatar', avatarFile);
        r = await api.post('/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        r = await api.put('/me', form);
      }
      setUser(r.data);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.password !== pw.password_confirmation) {
      toast.error('Konfirmasi password baru tidak cocok');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/me', pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      toast.success('Password berhasil diganti');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengganti password');
    } finally {
      setSavingPw(false);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const tagihanAktif = summary?.tagihan_aktif || [];
  const totalTagihan = tagihanAktif.reduce((s, t) => s + Number(t.jumlah), 0);

  const menu = [
    { path: '/pesanan', label: 'Pesanan Saya', desc: 'Kelola & batalkan sewa kamar', Icon: ClipboardList },
    { path: '/tagihan', label: 'Tagihan Saya', desc: 'Bayar & riwayat pembayaran', Icon: ReceiptText },
    { path: '/komplain', label: 'Lapor Kerusakan', desc: 'Keluhan & tindak lanjut pemilik', Icon: Wrench },
    { path: '/dashboard', label: 'Cari Kost', desc: 'Jelajahi properti tersedia', Icon: Search },
  ];

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="icon-box"><UserIcon className="w-5 h-5" /></div>
        <div>
          <h2 className="page-title">Profil</h2>
          <p className="page-subtitle">Informasi akun Anda</p>
        </div>
      </div>

      {/* Identitas */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarPreview || user?.avatar_url ? (
              <img
                src={avatarPreview || imgSrc(user.avatar_url)}
                alt={user?.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-soft"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kost-600 to-kost-400 flex items-center justify-center text-white text-2xl font-extrabold shadow-soft">
                {initial}
              </div>
            )}
            {editing && (
              <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-kost-700 text-white flex items-center justify-center shadow-soft hover:bg-kost-800 transition-colors cursor-pointer" title="Ganti foto profil">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => onAvatarChange(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold font-heading text-slate-800 truncate">{user?.name}</h3>
            <span className="badge badge-terisi mt-1">{user?.role === 'admin' ? 'Admin' : 'Penghuni'}</span>
          </div>
          {!editing && (
            <button onClick={startEdit} className="btn-secondary text-xs py-2 shrink-0">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <p className="text-xs text-slate-400 -mb-1">Klik ikon kamera pada foto untuk mengganti foto profil (jpg/png/webp, maks 2MB).</p>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">No. HP</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" maxLength={20} />
            </div>
            <div className="flex gap-2.5">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? <><span className="spinner" /> Menyimpan...</> : 'Simpan Perubahan'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={cancelEdit}
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-2.5 bg-[#F7F8FA] rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="w-4 h-4 text-kost-600 shrink-0" />
              <span className="text-slate-700 truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="w-4 h-4 text-kost-600 shrink-0" />
              <span className="text-slate-700">{user?.phone || <span className="text-slate-400">Belum diisi</span>}</span>
            </div>
            {user?.created_at && (
              <div className="flex items-center gap-2.5 text-sm">
                <CalendarDays className="w-4 h-4 text-kost-600 shrink-0" />
                <span className="text-slate-500 text-[13px]">Bergabung {user.created_at.slice(0, 10)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keamanan */}
      <div className="card">
        <h3 className="font-bold font-heading text-slate-800 flex items-center gap-2 mb-1">
          <span className="icon-box !w-8 !h-8"><ShieldCheck className="w-4 h-4" /></span> Ganti Password
        </h3>
        <p className="text-xs text-slate-400 mb-4 ml-10">Kosongkan bila tidak ingin mengganti</p>
        <form onSubmit={savePassword} className="space-y-3">
          <div className="relative">
            <input
              className="input pr-11"
              type={showPw ? 'text' : 'password'}
              placeholder="Password lama"
              value={pw.current_password}
              onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-kost-700" tabIndex={-1}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="Password baru (min 6)"
              value={pw.password}
              onChange={(e) => setPw({ ...pw, password: e.target.value })}
              autoComplete="new-password"
            />
            <input
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="Ulangi password baru"
              value={pw.password_confirmation}
              onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-secondary w-full" disabled={savingPw || (!pw.current_password && !pw.password)}>
            {savingPw ? <><span className="spinner" /> Menyimpan...</> : 'Ganti Password'}
          </button>
        </form>
      </div>

      {/* Ringkasan */}
      {!summary ? (
        <SkeletonCard lines={2} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <BedDouble className="w-4 h-4 text-kost-600" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kamar Aktif</p>
            </div>
            <p className="text-lg font-extrabold font-heading text-slate-800 truncate">
              {summary.contract ? `${summary.contract.room?.kost?.nama || ''} • ${summary.contract.room?.nomor_kamar || ''}` : 'Belum ada'}
            </p>
          </div>
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-kost-600" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tagihan Aktif</p>
            </div>
            <p className="text-lg font-extrabold font-heading text-kost-700">{formatRupiah(totalTagihan)}</p>
            <p className="text-[11px] text-slate-400">{tagihanAktif.length} tagihan</p>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="card p-2">
        {menu.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-kost-50 flex items-center justify-center shrink-0">
              <m.Icon className="w-5 h-5 text-kost-700" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-slate-800">{m.label}</span>
              <span className="block text-xs text-slate-400 truncate">{m.desc}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </Link>
        ))}
      </div>

      <button onClick={doLogout} className="btn-secondary w-full !text-rose-600 !border-rose-200 hover:!bg-rose-50">
        <LogOut className="w-4 h-4" /> Keluar Akun
      </button>
    </div>
  );
}
