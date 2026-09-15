import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuthStore();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const user = await login(email, password);
      nav(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e) {
      setErr(e.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8FA]">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kost-700 text-white mb-4 shadow-soft">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-kost-800">KostHub</h1>
            <p className="text-sm text-slate-400 mt-1">
              Selamat datang kembali
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
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  className="input pr-12"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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

            <button
              type="submit"
              className="btn-primary w-full py-3 text-sm mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" />
                  <span>Memproses...</span>
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

        </div>

        {/* Register link */}
        <p className="text-center text-sm text-slate-400">
          Belum punya akun?{' '}
          <Link to="/register" className="text-kost-700 font-semibold hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
