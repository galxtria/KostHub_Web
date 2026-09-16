<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ComplaintController extends Controller
{
    public const KATEGORI = ['kebersihan', 'kerusakan', 'keamanan', 'tagihan', 'lainnya'];
    public const STATUS = ['baru', 'diproses', 'selesai'];

    // Admin: semua keluhan
    public function index(Request $request)
    {
        return Complaint::with(['user:id,name', 'room:id,nomor_kamar,kost_id', 'room.kost:id,nama'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->kategori, fn($q) => $q->where('kategori', $request->kategori))
            ->latest()
            ->paginate(15);
    }

    // Penghuni: keluhan milik sendiri
    public function mine(Request $request)
    {
        return Complaint::with(['room:id,nomor_kamar,kost_id', 'room.kost:id,nama'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'room_id' => 'nullable|exists:rooms,id',
            'kategori' => 'required|in:'.implode(',', self::KATEGORI),
            'judul' => 'required|string|max:150',
            'deskripsi' => 'required|string|max:2000',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('foto')) {
            $data['foto_url'] = '/storage/'.$request->file('foto')->store('komplain', 'public');
        }
        unset($data['foto']);

        $data['user_id'] = $request->user()->id;
        $data['status'] = 'baru';

        return response()->json(Complaint::create($data), 201);
    }

    // Admin: ubah status
    public function updateStatus(Request $request, Complaint $complaint)
    {
        $data = $request->validate([
            'status' => 'required|in:'.implode(',', self::STATUS),
        ]);
        $complaint->update($data);
        return $complaint->load(['user:id,name', 'room:id,nomor_kamar,kost_id', 'room.kost:id,nama']);
    }

    public function destroy(Complaint $complaint)
    {
        if ($complaint->foto_url) {
            $path = ltrim(str_replace('/storage/', '', $complaint->foto_url), '/');
            if ($path) Storage::disk('public')->delete($path);
        }
        $complaint->delete();
        return response()->json(['message' => 'Keluhan dihapus']);
    }
}
