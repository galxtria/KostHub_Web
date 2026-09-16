<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        return Room::with(['kost:id,nama,foto_url', 'activeContract.user:id,name'])
            ->when($request->kost_id, fn($q) => $q->where('kost_id', $request->kost_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()->paginate(min(max((int) $request->get('per_page', 12), 1), 100));
    }

    public function show(Room $room)
    {
        return $room->load(['kost', 'activeContract.user:id,name']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kost_id' => 'required|exists:kosts,id',
            'nomor_kamar' => 'required|string|max:10',
            'tipe' => 'required|in:standar,exclusive',
            'harga_bulanan' => 'required|numeric|min:0',
            'status' => 'nullable|in:kosong,terisi,maintenance',
            'fasilitas' => 'nullable|array',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('foto')) {
            $data['foto_url'] = '/storage/'.$request->file('foto')->store('kamar', 'public');
        }

        unset($data['foto']);
        return Room::create($data);
    }

    public function update(Request $request, Room $room)
    {
        $data = $request->validate([
            'nomor_kamar' => 'sometimes|string|max:10',
            'tipe' => 'sometimes|in:standar,exclusive',
            'harga_bulanan' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:kosong,terisi,maintenance',
            'fasilitas' => 'nullable|array',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('foto')) {
            $this->deleteOldFoto($room->foto_url);
            $data['foto_url'] = '/storage/'.$request->file('foto')->store('kamar', 'public');
        }

        unset($data['foto']);
        $room->update($data);
        return $room;
    }

    public function destroy(Room $room)
    {
        $this->deleteOldFoto($room->foto_url);
        $room->delete();
        return response()->json(['message' => 'Kamar dihapus']);
    }

    private function deleteOldFoto(?string $fotoUrl): void
    {
        if (!$fotoUrl) return;
        $path = ltrim(str_replace('/storage/', '', $fotoUrl), '/');
        if ($path) Storage::disk('public')->delete($path);
    }
}
