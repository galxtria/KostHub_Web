import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ikon marker via CDN agar tidak bermasalah dengan bundler Vite
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER = [-6.9175, 107.6191]; // Bandung
const DEFAULT_ZOOM_EMPTY = 11;

function toNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pemilih titik lokasi yang simpel: cukup klik peta / geser pin.
 * Props: latitude, longitude (string), onChange(latStr, lngStr)
 */
export default function MapPicker({ latitude, longitude, onChange }) {
  const wrapRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Inisialisasi peta sekali saja
  useEffect(() => {
    if (!wrapRef.current || mapRef.current) return;

    const lat = toNum(latitude);
    const lng = toNum(longitude);
    const hasPoint = lat !== null && lng !== null;
    const map = L.map(wrapRef.current, { scrollWheelZoom: false }).setView(
      hasPoint ? [lat, lng] : DEFAULT_CENTER,
      hasPoint ? 16 : DEFAULT_ZOOM_EMPTY
    );
    // Aktifkan zoom scroll hanya saat peta difokuskan (agar scroll modal tetap nyaman)
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const placeMarker = (la, ln, view = false) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([la, ln]);
      } else {
        markerRef.current = L.marker([la, ln], { draggable: true, icon: markerIcon })
          .addTo(map)
          .on('dragend', (e) => {
            const p = e.target.getLatLng();
            onChangeRef.current?.(p.lat.toFixed(7), p.lng.toFixed(7));
          });
      }
      if (view) map.setView([la, ln], 16);
    };

    if (hasPoint) placeMarker(lat, lng);

    map.on('click', (e) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
      onChangeRef.current?.(e.latlng.lat.toFixed(7), e.latlng.lng.toFixed(7));
    });

    mapRef.current = map;
    // Perbaiki ukuran tile saat modal selesai animasi / tab berubah
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronkan marker saat koordinat berubah dari luar (lokasi saya / hapus / edit)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const lat = toNum(latitude);
    const lng = toNum(longitude);
    if (lat === null || lng === null) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }
    if (markerRef.current) {
      const p = markerRef.current.getLatLng();
      if (Math.abs(p.lat - lat) > 1e-9 || Math.abs(p.lng - lng) > 1e-9) {
        markerRef.current.setLatLng([lat, lng]);
        map.setView([lat, lng], Math.max(map.getZoom(), 14));
      }
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true, icon: markerIcon })
        .addTo(map)
        .on('dragend', (e) => {
          const p = e.target.getLatLng();
          onChangeRef.current?.(p.lat.toFixed(7), p.lng.toFixed(7));
        });
      map.setView([lat, lng], 16);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={wrapRef}
      className="w-full h-56 rounded-xl border border-slate-200 overflow-hidden z-0"
    />
  );
}
