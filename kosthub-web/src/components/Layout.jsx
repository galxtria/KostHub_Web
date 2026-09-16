import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { imgSrc } from '../api/axios';
import {
  Home as HomeIcon,
  ClipboardList as OrdersIcon,
  User as UserIcon,
  Bell as BellIcon,
  Building2 as Building2Icon,
  LayoutDashboard as DashboardIcon,
  BedDouble as BedIcon,
  ReceiptText as ReceiptIcon,
  Wallet as WalletIcon,
  Users as UsersIcon,
  LogOut as LogOutIcon,
  Headset as HeadsetIcon,
} from 'lucide-react';

export const USER_NAV_LINKS = [
  { path: '/dashboard', label: 'Home', Icon: HomeIcon, exact: true },
  { path: '/pesanan', label: 'Pesanan', Icon: OrdersIcon },
  { path: '/tagihan', label: 'Tagihan', Icon: ReceiptIcon },
  { path: '/profil', label: 'Profil', Icon: UserIcon },
];

/* ========== Avatar (foto profil / inisial) ========== */
export function Avatar({ user, className = 'w-9 h-9 text-sm rounded-full' }) {
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';
  if (user?.avatar_url) {
    return (
      <img
        src={imgSrc(user.avatar_url)}
        alt={user?.name || 'Avatar'}
        className={`${className} object-cover shadow-sm`}
      />
    );
  }
  return (
    <div className={`${className} bg-gradient-to-br from-kost-600 to-kost-400 flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
      {initial}
    </div>
  );
}

/* ========== Status Badge ========== */
export function StatusBadge({ status }) {
  const map = {
    belum_bayar: 'badge-belum',
    terlambat: 'badge-belum',
    menunggu_verifikasi: 'badge-verif',
    pending: 'badge-verif',
    lunas: 'badge-lunas',
    verified: 'badge-lunas',
    kosong: 'badge-kosong',
    terisi: 'badge-terisi',
    maintenance: 'badge-maintenance',
    aktif: 'badge-lunas',
    selesai: 'badge-kosong',
    batal: 'badge-maintenance',
  };
  const label = status?.replace(/_/g, ' ') || 'unknown';
  return <span className={`badge ${map[status] || 'badge-verif'}`}>{label}</span>;
}

/* ========== Shared Top Navbar (mirip dashboard user) ========== */
function TopNavbar({ subtitle, links = [] }) {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <header className="hidden md:block sticky top-0 z-30 bg-white border-b border-slate-100 shadow-soft">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6">
        <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-kost-700 flex items-center justify-center">
            <Building2Icon className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <span className="text-lg font-extrabold font-heading text-kost-800 tracking-tight block">
              KostHub
            </span>
            {subtitle && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {subtitle}
              </span>
            )}
          </div>
        </Link>

        {/* Center nav links (user) */}
        {links.length > 0 && (
          <nav className="flex items-center gap-1 ml-4">
            {links.map((link) => {
              const active = link.exact
                ? loc.pathname === link.path
                : loc.pathname === link.path || loc.pathname.startsWith(link.path + '/');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-kost-700 text-white shadow-soft'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-3 shrink-0">
          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
            <Avatar user={user} />
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); nav('/login'); }}
            className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            title="Logout"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ========== Mobile greeting header (mirip dashboard user) ========== */
function MobileGreeting({ title, subtitle }) {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="md:hidden px-5 pt-6 pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar user={user} className="w-12 h-12 text-lg rounded-full" />
          <div>
            <p className="text-xs text-slate-400 font-medium">{getGreeting()}</p>
            <p className="text-base font-bold text-slate-800">{title || user?.name || 'User'}</p>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-soft border border-slate-100">
          <BellIcon className="w-5 h-5 text-kost-700" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}

/* ========== Admin Layout ========== */
export function AdminLayout({ children }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [loc.pathname]);

  const links = [
    { path: '/admin', label: 'Dashboard', Icon: DashboardIcon, exact: true },
    { path: '/admin/kost', label: 'Kost', Icon: Building2Icon },
    { path: '/admin/kamar', label: 'Kamar', Icon: BedIcon },
    { path: '/admin/tagihan', label: 'Tagihan', Icon: ReceiptIcon },
    { path: '/admin/laporan', label: 'Laporan', Icon: WalletIcon },
    { path: '/admin/penghuni', label: 'Penghuni', Icon: UsersIcon },
    { path: '/admin/layanan', label: 'Layanan', Icon: HeadsetIcon },
  ];

  const mobileLinks = links.slice(0, 5);

  const isActive = (link) =>
    link.exact ? loc.pathname === link.path : loc.pathname.startsWith(link.path);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      <TopNavbar subtitle="Admin Panel" />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 w-full max-w-6xl mx-auto flex gap-6 px-5 md:px-6 py-4 md:py-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white rounded-2xl border border-slate-100 shadow-card p-4 h-fit sticky top-20">
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={isActive(link) ? 'nav-item-active' : 'nav-item-inactive'}
              >
                <link.Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <Avatar user={user} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={async () => { await logout(); nav('/login'); }}
              className="w-full nav-item-inactive text-rose-600 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOutIcon className="w-5 h-5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Sidebar drawer (mobile) */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-[280px] md:hidden
            bg-white border-r border-slate-100
            flex flex-col p-4
            transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-kost-700 flex items-center justify-center">
                <Building2Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold font-heading text-kost-800">KostHub</span>
            </div>
            <button className="btn-icon" onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={isActive(link) ? 'nav-item-active' : 'nav-item-inactive'}
              >
                <link.Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={async () => { await logout(); nav('/login'); }}
              className="w-full nav-item-inactive text-rose-600 hover:bg-rose-50"
            >
              <LogOutIcon className="w-5 h-5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          <div className="md:hidden -mx-5 -mt-4">
            <MobileGreeting title={user?.name} subtitle="Kelola properti kost Anda" />
          </div>
          {/* Hamburger (mobile) */}
          <button
            className="md:hidden mb-3 btn-secondary text-xs py-2"
            onClick={() => setSidebarOpen(true)}
          >
            ☰ Menu Admin
          </button>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav (mirip user) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 shadow-soft">
        <div className="flex justify-around items-center py-2 max-w-md mx-auto">
          {mobileLinks.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                  active ? 'text-kost-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <link.Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-kost-600 rounded-full"></span>
                  )}
                </div>
                <span className="mt-1">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ========== User Layout ========== */
export function UserLayout({ children }) {
  const loc = useLocation();

  const isActive = (link) => link.exact
    ? loc.pathname === link.path
    : loc.pathname === link.path || loc.pathname.startsWith(link.path + '/');

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      <TopNavbar links={USER_NAV_LINKS} />

      <div className="md:hidden">
        <MobileGreeting />
      </div>

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-6">
        <div className="px-5 md:px-6 py-4 md:py-6 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ===== MOBILE Bottom Navigation ===== */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 shadow-soft">
        <div className="flex justify-around items-center py-2 max-w-md mx-auto">
          {USER_NAV_LINKS.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'text-kost-700'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <link.Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-kost-600 rounded-full"></span>
                  )}
                </div>
                <span className="mt-1">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
