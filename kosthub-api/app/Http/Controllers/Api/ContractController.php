<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        return Contract::with(['user:id,name,email,phone', 'room:id,nomor_kamar,kost_id,harga_bulanan', 'room.kost:id,nama'])
            ->withCount('invoices')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->whereHas('user', fn($qq) => $qq
                ->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('email', 'like', '%'.$request->search.'%')))
            ->latest()->paginate(10);
    }

    public function show(Contract $contract)
    {
        return $contract->load(['user', 'room.kost', 'invoices.payments']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'room_id' => 'required|exists:rooms,id',
            'tgl_masuk' => 'required|date',
            'tgl_keluar' => 'nullable|date|after:tgl_masuk',
            'deposit' => 'nullable|numeric|min:0',
        ]);

        // 1 kamar hanya boleh 1 kontrak aktif
        if (Contract::where('room_id', $data['room_id'])->where('status','aktif')->exists()) {
            return response()->json(['message' => 'Kamar sudah terisi kontrak aktif'], 422);
        }

        $contract = Contract::create($data + ['status' => 'aktif']);
        Room::where('id', $data['room_id'])->update(['status' => 'terisi']);

        return response()->json($contract->load(['user','room']), 201);
    }

    // Penghuni booking kamar kosong -> kontrak aktif + invoice sewa pertama
    public function book(Request $request)
    {
        $data = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'tgl_masuk' => 'required|date|after_or_equal:today',
            'durasi_bulan' => 'nullable|integer|min:1|max:12',
        ]);

        $durasi = $data['durasi_bulan'] ?? 1;
        $room = Room::findOrFail($data['room_id']);

        if ($room->status !== 'kosong' || Contract::where('room_id', $room->id)->where('status','aktif')->exists()) {
            return response()->json(['message' => 'Kamar sudah terisi, pilih kamar lain'], 422);
        }

        if (Contract::where('user_id', $request->user()->id)->where('status','aktif')->exists()) {
            return response()->json(['message' => 'Anda masih memiliki kontrak aktif'], 422);
        }

        $tglMasuk = now()->parse($data['tgl_masuk']);

        $contract = Contract::create([
            'user_id' => $request->user()->id,
            'room_id' => $room->id,
            'tgl_masuk' => $tglMasuk->toDateString(),
            'tgl_keluar' => $tglMasuk->copy()->addMonths($durasi)->toDateString(),
            'deposit' => 0,
            'status' => 'aktif',
        ]);

        $room->update(['status' => 'terisi']);

        $invoice = Invoice::create([
            'contract_id' => $contract->id,
            'user_id' => $request->user()->id,
            'room_id' => $room->id,
            'kode_invoice' => 'INV-'.now()->format('Ym').'-'.strtoupper(Str::random(6)),
            'jenis' => 'sewa',
            'periode' => $tglMasuk->copy()->startOfMonth()->toDateString(),
            'jumlah' => $room->harga_bulanan * $durasi,
            'jatuh_tempo' => $tglMasuk->copy()->addDays(3)->toDateString(),
            'status' => 'belum_bayar',
        ]);

        return response()->json([
            'contract' => $contract->load(['room.kost']),
            'invoice' => $invoice->load(['room.kost']),
        ], 201);
    }

    // Riwayat + pesanan aktif milik user yang login
    public function mine(Request $request)
    {
        return Contract::with(['room.kost', 'invoices' => fn($q) => $q->latest()])
            ->where('user_id', $request->user()->id)
            ->latest()->paginate(10);
    }

    // Penghuni membatalkan pesanannya sendiri
    public function cancel(Request $request, Contract $contract)
    {
        if ($request->user()->role !== 'admin' && $contract->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bukan pesanan Anda'], 403);
        }

        if ($contract->status !== 'aktif') {
            return response()->json(['message' => 'Hanya kontrak aktif yang bisa dibatalkan'], 422);
        }

        // Hapus tagihan yang belum lunas + pembayaran pending-nya
        $unpaid = $contract->invoices()->whereIn('status', ['belum_bayar', 'terlambat', 'menunggu_verifikasi'])->get();
        foreach ($unpaid as $inv) {
            $inv->payments()->delete();
            $inv->delete();
        }

        $contract->update(['status' => 'batal']);

        // Kembalikan kamar ke kosong jika tidak ada kontrak aktif lain
        if (! Contract::where('room_id', $contract->room_id)->where('status','aktif')->exists()) {
            Room::where('id', $contract->room_id)->update(['status' => 'kosong']);
        }

        return response()->json($contract->load(['room.kost']));
    }

    public function finish(Contract $contract)
    {
        $contract->update(['status' => 'selesai']);
        // Kembalikan kamar ke kosong jika tidak ada kontrak aktif lain
        if (! Contract::where('room_id', $contract->room_id)->where('status','aktif')->exists()) {
            Room::where('id', $contract->room_id)->update(['status' => 'kosong']);
        }
        return $contract;
    }
}
