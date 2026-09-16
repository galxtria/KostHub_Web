import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/ui/Toast';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { RecommendationCard } from './Dashboards';

export default function FavoritPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/favorites')
      .then((r) => setItems(r.data.data || []))
      .catch(() => toast.error('Gagal memuat favorit'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const untoggle = async (kostId) => {
    setItems((prev) => prev.filter((f) => f.kost_id !== kostId));
    try {
      await api.post('/favorites/toggle', { kost_id: kostId });
      toast.success('Dihapus dari favorit');
    } catch {
      toast.error('Gagal menghapus favorit');
      load();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="icon-box"><Heart className="w-5 h-5" /></div>
        <div>
          <h2 className="page-title">Favorit Saya</h2>
          <p className="page-subtitle">{items.length} kost tersimpan</p>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada favorit"
          message="Ketuk ikon hati pada kost untuk menyimpannya di sini."
          action={() => nav('/dashboard')}
          actionLabel="Cari Kost"
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((f, idx) => (
            <RecommendationCard
              key={f.id}
              kost={f.kost}
              index={idx}
              onOpen={() => nav(`/kost/${f.kost_id}`)}
              isFav
              onToggleFav={untoggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
