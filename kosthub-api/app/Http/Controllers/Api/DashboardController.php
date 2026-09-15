<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
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
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $contract = $user->contracts()->with('room.kost')->where('status','aktif')->first();

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
