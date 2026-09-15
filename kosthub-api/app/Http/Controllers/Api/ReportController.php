<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Payment;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function keuangan(Request $request)
    {
        $request->validate([
            'bulan' => 'nullable|integer|min:1|max:12',
            'tahun' => 'nullable|integer|min:2020|max:2035',
            'kost_id' => 'nullable|exists:kosts,id',
        ]);

        $bulan = $request->bulan ?? now()->month;
        $tahun = $request->tahun ?? now()->year;

        $pemasukanQ = Payment::where('status_verifikasi', 'verified')
            ->whereMonth('verified_at', $bulan)->whereYear('verified_at', $tahun);
        $pengeluaranQ = Expense::whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun);

        if ($request->kost_id) {
            $pemasukanQ->whereHas('invoice.room', fn($q) => $q->where('kost_id', $request->kost_id));
            $pengeluaranQ->where('kost_id', $request->kost_id);
        }

        $pemasukan = (float) $pemasukanQ->sum('jumlah_bayar');
        $pengeluaran = (float) $pengeluaranQ->sum('jumlah');

        $detailPemasukan = (clone $pemasukanQ)->with(['invoice.user:id,name', 'invoice.room:id,nomor_kamar'])->latest()->limit(50)->get();
        $detailPengeluaran = (clone $pengeluaranQ)->with('kost:id,nama')->orderBy('tanggal')->get();

        return response()->json([
            'periode' => "$tahun-".str_pad($bulan, 2, '0', STR_PAD_LEFT),
            'pemasukan' => $pemasukan,
            'pengeluaran' => $pengeluaran,
            'laba_bersih' => $pemasukan - $pengeluaran,
            'detail_pemasukan' => $detailPemasukan,
            'detail_pengeluaran' => $detailPengeluaran,
        ]);
    }

    public function keuanganCsv(Request $request)
    {
        $data = $this->keuangan($request)->getData(true);

        $csv = "KostHub Laporan Keuangan Periode {$data['periode']}\n";
        $csv .= "Pemasukan,{$data['pemasukan']}\nPengeluaran,{$data['pengeluaran']}\nLaba Bersih,{$data['laba_bersih']}\n\n";
        $csv .= "Tipe,Tanggal,Keterangan,Jumlah\n";
        foreach ($data['detail_pemasukan'] as $p) {
            $csv .= "MASUK,{$p['verified_at']},\"{$p['invoice']['user']['name']} - {$p['invoice']['room']['nomor_kamar']}\",{$p['jumlah_bayar']}\n";
        }
        foreach ($data['detail_pengeluaran'] as $e) {
            $csv .= "KELUAR,{$e['tanggal']},\"[{$e['kategori']}] {$e['keterangan']}\",{$e['jumlah']}\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"laporan-{$data['periode']}.csv\"",
        ]);
    }
}
