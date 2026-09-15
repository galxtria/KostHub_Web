import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [err, setErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading } = useAuthStore();
  const nav = useNavigate();

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.password !== form.password_confirmation) {
      setErr('Konfirmasi password tidak cocok.');
      return;
    }
    try {
      await register(form);
      nav('/dashboard');
    } catch (e) {
      const errors = e.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : null;
      setErr(firstError || e.response?.data?.message || 'Registrasi gagal. Periksa data Anda.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8FA]">
      <div className="w-full max-w-md space-y-6 animate-slide-up py-8">
        {/* Register Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kost-700 text-white mb-4 shadow-soft">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-kost-800">Buat Akun KostHub</h1>
            <p className="text-sm text-slate-400 mt-1">
              Daftar sebagai penghuni dan mulai cari kost
            </p>
          </div>

          {/* Error */}
          {err && (
            <div className="alert alert-error mb-5 animate-fade-in">
              <TriangleAlert className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Nama Lengkap
              </label>
              <input
                className="input"
                type="text"
                placeholder="Nama Anda"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                autoFocus
                maxLength={100}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                No. HP <span className="text-slate-300 normal-case font-medium">(opsional)</span>
              </label>
              <input
                className="input"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                maxLength={20}
                autoComplete="tel"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="input pr-11"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 karakter"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-kost-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Ulangi Password
                </label>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ulangi password"
                  value={form.password_confirmation}
                  onChange={(e) => set('password_confirmation', e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-sm mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" />
                  <span>Mendaftarkan...</span>
                </span>
              ) : (
                'Daftar'
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-slate-400">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-kost-700 font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
