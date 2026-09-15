<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $q = Invoice::with(['user:id,name', 'room:id,nomor_kamar', 'payments'])
            ->when($request->status, fn($qq) => $qq->where('status', $request->status))
            ->latest();

        // User biasa hanya lihat tagihannya sendiri
        if ($request->user()->role !== 'admin') {
            $q->where('user_id', $request->user()->id);
        }

        return $q->paginate(10);
    }

    public function show(Request $request, Invoice $invoice)
    {
        if ($request->user()->role !== 'admin' && $invoice->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bukan tagihan Anda'], 403);
        }

        return $invoice->load(['room.kost', 'payments', 'contract']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'contract_id' => 'required|exists:contracts,id',
            'jenis' => 'nullable|in:sewa,denda,deposit,lainnya',
            'periode' => 'required|date',
            'jumlah' => 'required|numeric|min:0',
            'jatuh_tempo' => 'required|date',
        ]);

        $contract = Contract::findOrFail($data['contract_id']);

        $invoice = Invoice::create([
            ...$data,
            'jenis' => $data['jenis'] ?? 'sewa',
            'user_id' => $contract->user_id,
            'room_id' => $contract->room_id,
            'kode_invoice' => 'INV-'.now()->format('Ym').'-'.strtoupper(Str::random(6)),
            'status' => 'belum_bayar',
        ]);

        return response()->json($invoice, 201);
    }

    public function generateBulk(Request $request)
    {
        $request->validate(['periode' => 'required|date', 'jatuh_tempo' => 'required|date']);
        $count = 0;

        foreach (Contract::with('room')->where('status','aktif')->cursor() as $c) {
            $exists = Invoice::where('contract_id', $c->id)
                ->whereMonth('periode', now()->parse($request->periode)->month)
                ->whereYear('periode', now()->parse($request->periode)->year)
                ->exists();
            if ($exists) continue;

            Invoice::create([
                'contract_id' => $c->id,
                'user_id' => $c->user_id,
                'room_id' => $c->room_id,
                'kode_invoice' => 'INV-'.now()->format('Ym').'-'.strtoupper(Str::random(6)),
                'jenis' => 'sewa',
                'periode' => $request->periode,
                'jumlah' => $c->room->harga_bulanan,
                'jatuh_tempo' => $request->jatuh_tempo,
                'status' => 'belum_bayar',
            ]);
            $count++;
        }

        return response()->json(['message' => "$count tagihan berhasil dibuat"]);
    }
}
