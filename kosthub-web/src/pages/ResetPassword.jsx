import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, KeyRound, CheckCircle2, TriangleAlert } from 'lucide-react';
import api from '../api/axios';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmation) {
      setErr('Konfirmasi password tidak cocok');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      await api.post('/reset-password', {
        email,
        token,
        password,
        password_confirmation: confirmation,
      });
      nav('/login', { state: { resetOk: true } });
    } catch (e) {
      setErr(e.response?.data?.message || 'Gagal mengganti password. Tautan mungkin kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8FA]">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kost-700 text-white mb-4 shadow-soft">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-kost-800">Password Baru</h1>
            <p className="text-sm text-slate-400 mt-1">{email || 'Buat password baru Anda'}</p>
          </div>

          {err && (
            <div className="alert alert-error mb-5 animate-fade-in">
              <TriangleAlert className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          {!token || !email ? (
            <div className="alert alert-error mb-5">
              <TriangleAlert className="w-4 h-4 shrink-0" />
              <span>Tautan tidak valid. Minta tautan baru lewat halaman lupa password.</span>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Password Baru (min 6)
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="Password baru"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Ulangi Password Baru
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-sm mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner" />
                    <span>Memproses...</span>
                  </span>
                ) : (
                  'Ganti Password'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-400">
          <Link to="/login" className="text-kost-700 font-semibold hover:underline inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Kembali ke login
          </Link>
        </p>
      </div>
    </div>
  );
}
