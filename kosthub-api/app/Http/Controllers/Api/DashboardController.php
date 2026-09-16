<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Kost;
use App\Models\Payment;
use App\Models\Room;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function admin()
    {
        $pemasukanBulanIni = Payment::where('status_verifikasi','verified')
            ->whereMonth('verified_at', now()->month)
            ->sum('jumlah_bayar');

        // Pemasukan per bulan tahun berjalan (untuk grafik)
        $perBulan = [];
        for ($m = 1; $m <= 12; $m++) {
            $perBulan[] = [
                'bulan' => $m,
                'total' => (float) Payment::where('status_verifikasi','verified')
                    ->whereYear('verified_at', now()->year)
                    ->whereMonth('verified_at', $m)
                    ->sum('jumlah_bayar'),
            ];
        }

        // Okupansi per kost
        $okupansi = Kost::withCount(['rooms', 'rooms as rooms_terisi_count' => fn($q) => $q->where('status','terisi')])
            ->orderBy('nama')
            ->get(['id', 'nama'])
            ->map(fn($k) => [
                'id' => $k->id,
                'nama' => $k->nama,
                'total' => $k->rooms_count,
                'terisi' => $k->rooms_terisi_count,
            ]);

        return response()->json([
            'pemasukan_bulan_ini' => (float) $pemasukanBulanIni,
            'total_kamar' => Room::count(),
            'kamar_terisi' => Room::where('status','terisi')->count(),
            'kamar_kosong' => Room::where('status','kosong')->count(),
            'tagihan_overdue' => Invoice::whereIn('status',['belum_bayar','terlambat'])
                ->where('jatuh_tempo','<',now())->count(),
            'perlu_verifikasi' => Payment::where('status_verifikasi','pending')->count(),
            'pembayaran_terbaru' => Payment::with(['invoice.user:id,name','invoice.room:id,nomor_kamar'])
                ->latest()->limit(5)->get(),
            'pemasukan_per_bulan' => $perBulan,
            'okupansi_per_kost' => $okupansi,
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $contract = $user->contracts()->with('room.kost')->where('status','aktif')->first();

        // Pengingat kontrak segera berakhir (≤7 hari), dibuat sekali per kontrak
        if ($contract && $contract->tgl_keluar) {
            $sisaHari = now()->startOfDay()->diffInDays(now()->parse($contract->tgl_keluar)->startOfDay(), false);
            if ($sisaHari >= 0 && $sisaHari <= 7) {
                $sudahAda = $user->notifications()->unread()
                    ->where('tipe', 'kontrak_berakhir')
                    ->where('pesan', 'like', '%kontrak#'.$contract->id.'%')
                    ->exists();
                if (! $sudahAda) {
                    $user->notifications()->create([
                        'tipe' => 'kontrak_berakhir',
                        'judul' => $sisaHari === 0 ? 'Kontrak berakhir hari ini' : "Kontrak berakhir dalam $sisaHari hari",
                        'pesan' => "kontrak#{$contract->id} • Kamar {$contract->room->nomor_kamar} berakhir {$contract->tgl_keluar}. Hubungi pemilik untuk perpanjangan.",
                        'link' => '/pesanan',
                    ]);
                }
            }
        }

        return response()->json([
            'contract' => $contract,
            'tagihan_aktif' => Invoice::with('room')
                ->where('user_id',$user->id)
                ->whereIn('status',['belum_bayar','menunggu_verifikasi','terlambat'])
                ->orderBy('jatuh_tempo')->get(),
            'riwayat_lunas' => Invoice::where('user_id',$user->id)->where('status','lunas')
                ->latest()->limit(5)->get(),
        ]);
    }
}
