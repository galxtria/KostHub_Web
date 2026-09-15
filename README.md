# KostHub Web — MVP Hari-2 Selesai ✅

## Struktur
- `kosthub-api/` Laravel 12 + Sanctum (port 8000)
- `kosthub-web/` React 19 + Vite + Tailwind 3 + Zustand (port 5173)

## Database (MariaDB `kosthub`)
users, kosts, rooms, contracts, invoices, payments, complaints, announcements, expenses — sudah migrate + seed.

Akun demo:
- Admin: admin@kosthub.id / semangat45
- Penghuni: budi@mail.com / password

## Cara Jalan (2 terminal)

Terminal 1 — MySQL + Backend:
```powershell
# MySQL XAMPP sudah jalan. Jika belum:
Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--user=mysql" -WindowStyle Hidden
cd C:\Coding\KostHub_Web\kosthub-api
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2 — Frontend:
```powershell
cd C:\Coding\KostHub_Web\kosthub-web
npm run dev -- --host 127.0.0.1 --port 5173
# buka http://127.0.0.1:5173/login
```

## Alur yang sudah tested end-to-end ✔
1. POST /api/login (admin & user) → token Sanctum
2. GET /api/dashboard-admin → 5 kamar, 1 terisi
3. GET /api/dashboard-user → kontrak A1 + tagihan INV-DEMO-0001 belum_bayar
4. POST /api/payments multipart (file jpg 2MB max → /storage/bukti/xxx.jpg, HTTP 200 verified) → invoice menunggu_verifikasi
5. POST /api/payments/{id}/verify → invoice lunas + pemasukan muncul
6. CRUD /api/kosts + /api/rooms (create → delete tested, cascade OK)
7. POST /api/invoices/generate-bulk (1 tagihan Okt berhasil, anti-duplikat OK)
8. POST /api/expenses + GET /api/reports/keuangan + CSV download OK

## UI Admin baru
- /admin/kost: tambah/edit/hapus kost + count kamar
- /admin/kamar: tambah/edit/hapus + dropdown kost
- /admin/tagihan: tombol ⚡ Generate Bulk + link 📎 lihat bukti + verifikasi/tolak
- /admin/laporan: filter bulan/tahun, kartu pemasukan/pengeluaran/laba, form + hapus pengeluaran, Export CSV
- /tagihan (user): input file + Upload & Bayar (FormData)

## Next
- [ ] Auth register publik + reset password
- [ ] Modul penghuni/contracts UI + perpanjangan sewa
- [ ] Keluhan + pengumuman UI
- [ ] Payment gateway Midtrans + notifikasi WA jatuh tempo
- [ ] Deploy: `npm run build`, `php artisan config:cache`
