import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MailQuestion, CheckCircle2, TriangleAlert } from 'lucide-react';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await api.post('/forgot-password', { email });
      setDone(r.data.message);
    } catch (e) {
      setErr(e.response?.data?.message || 'Gagal memproses. Coba lagi.');
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
              <MailQuestion className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-kost-800">Lupa Password</h1>
            <p className="text-sm text-slate-400 mt-1">Masukkan email akun Anda</p>
          </div>

          {err && (
            <div className="alert alert-error mb-5 animate-fade-in">
              <TriangleAlert className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          {done ? (
            <div className="alert alert-success mb-5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{done}</span>
            </div>
          ) : (
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
              <button type="submit" className="btn-primary w-full py-3 text-sm mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner" />
                    <span>Memproses...</span>
                  </span>
                ) : (
                  'Kirim Tautan Reset'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-400">
          Ingat password?{' '}
          <Link to="/login" className="text-kost-700 font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
