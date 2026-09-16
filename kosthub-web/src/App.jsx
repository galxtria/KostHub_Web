import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { AdminDashboard, UserDashboard } from './pages/Dashboards';
import KostPage from './pages/KostPage';
import KamarPage from './pages/KamarPage';
import TagihanPage from './pages/TagihanPage';
import LaporanPage from './pages/LaporanPage';
import KostDetailPage from './pages/KostDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import PesananPage from './pages/PesananPage';
import ProfilPage from './pages/ProfilPage';
import PenghuniPage from './pages/PenghuniPage';
import KomplainPage from './pages/KomplainPage';
import LayananPage from './pages/LayananPage';
import { AdminLayout, UserLayout } from './components/Layout';
import { useAuthStore } from './store/useAuthStore';

function Protected({ children, role }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Protected role="admin"><AdminLayout><AdminDashboard /></AdminLayout></Protected>} />
        <Route path="/admin/kost" element={<Protected role="admin"><AdminLayout><KostPage /></AdminLayout></Protected>} />
        <Route path="/admin/kamar" element={<Protected role="admin"><AdminLayout><KamarPage /></AdminLayout></Protected>} />
        <Route path="/admin/tagihan" element={<Protected role="admin"><AdminLayout><TagihanPage isAdmin /></AdminLayout></Protected>} />
        <Route path="/admin/laporan" element={<Protected role="admin"><AdminLayout><LaporanPage /></AdminLayout></Protected>} />
        <Route path="/admin/penghuni" element={<Protected role="admin"><AdminLayout><PenghuniPage /></AdminLayout></Protected>} />
        <Route path="/admin/layanan" element={<Protected role="admin"><AdminLayout><LayananPage /></AdminLayout></Protected>} />

        {/* User Routes (v2) */}
        <Route path="/dashboard" element={<Protected role="penghuni"><UserLayout><UserDashboard /></UserLayout></Protected>} />
        <Route path="/kost/:id" element={<Protected role="penghuni"><UserLayout><KostDetailPage /></UserLayout></Protected>} />
        <Route path="/checkout/:invoiceId" element={<Protected role="penghuni"><UserLayout><CheckoutPage /></UserLayout></Protected>} />
        <Route path="/pesanan" element={<Protected role="penghuni"><UserLayout><PesananPage /></UserLayout></Protected>} />
        <Route path="/profil" element={<Protected role="penghuni"><UserLayout><ProfilPage /></UserLayout></Protected>} />
        <Route path="/komplain" element={<Protected role="penghuni"><UserLayout><KomplainPage /></UserLayout></Protected>} />
        <Route path="/tagihan" element={<Protected role="penghuni"><UserLayout><TagihanPage /></UserLayout></Protected>} />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
