<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    // Penghuni: pengumuman yang masih berlaku
    public function index()
    {
        return Announcement::with('kost:id,nama')
            ->where(fn($q) => $q->whereNull('berlaku_sampai')->orWhere('berlaku_sampai', '>=', today()))
            ->latest()
            ->paginate(10);
    }

    // Admin: semua pengumuman
    public function adminIndex(Request $request)
    {
        return Announcement::with('kost:id,nama')
            ->when($request->kost_id, fn($q) => $q->where('kost_id', $request->kost_id))
            ->latest()
            ->paginate(15);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kost_id' => 'required|exists:kosts,id',
            'judul' => 'required|string|max:150',
            'isi' => 'required|string|max:2000',
            'berlaku_sampai' => 'nullable|date|after_or_equal:today',
        ]);
        return response()->json(Announcement::create($data), 201);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $data = $request->validate([
            'kost_id' => 'sometimes|exists:kosts,id',
            'judul' => 'sometimes|string|max:150',
            'isi' => 'sometimes|string|max:2000',
            'berlaku_sampai' => 'nullable|date',
        ]);
        $announcement->update($data);
        return $announcement->load('kost:id,nama');
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return response()->json(['message' => 'Pengumuman dihapus']);
    }
}
