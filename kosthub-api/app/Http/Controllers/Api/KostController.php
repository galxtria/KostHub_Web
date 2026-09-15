<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KostController extends Controller
{
    public function index(Request $request)
    {
        $lat = is_numeric($request->lat) ? (float) $request->lat : null;
        $lng = is_numeric($request->lng) ? (float) $request->lng : null;

        $q = Kost::withCount(['rooms', 'rooms as rooms_terisi_count' => fn($qq) => $qq->where('status','terisi')])
            ->withMin('rooms', 'harga_bulanan')
            ->when($request->search, fn($qq) => $qq->where(fn($w) => $w
                ->where('nama', 'like', '%'.$request->search.'%')
                ->orWhere('alamat', 'like', '%'.$request->search.'%')
                ->orWhere('kota', 'like', '%'.$request->search.'%')));

        // Urutkan terdekat bila koordinat user dikirim (Haversine, km)
        if ($lat !== null && $lng !== null) {
            $haversine = '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))';
            $q->selectRaw("kosts.*, {$haversine} as distance_km", [$lat, $lng, $lat])
                ->orderByRaw('ISNULL(distance_km), distance_km ASC');
        } else {
            $q->latest();
        }

        return $q->paginate(10);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => 'required|string|max:100',
            'alamat' => 'required|string',
            'kota' => 'nullable|string|max:50',
            'deskripsi' => 'nullable|string',
            'peraturan' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'fasilitas' => 'nullable|array',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);
        $data['owner_id'] = $request->user()->id;

        if ($request->hasFile('foto')) {
            $data['foto_url'] = '/storage/'.$request->file('foto')->store('kost', 'public');
        }

        unset($data['foto']);
        return Kost::create($data);
    }

    public function show(Kost $kost)
    {
        return $kost->load(['rooms.activeContract.user']);
    }

    public function update(Request $request, Kost $kost)
    {
        $data = $request->validate([
            'nama' => 'sometimes|string|max:100',
            'alamat' => 'sometimes|string',
            'kota' => 'nullable|string|max:50',
            'deskripsi' => 'nullable|string',
            'peraturan' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'fasilitas' => 'nullable|array',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('foto')) {
            $this->deleteOldFoto($kost->foto_url);
            $data['foto_url'] = '/storage/'.$request->file('foto')->store('kost', 'public');
        }

        unset($data['foto']);
        $kost->update($data);
        return $kost;
    }

    public function destroy(Kost $kost)
    {
        $this->deleteOldFoto($kost->foto_url);
        $kost->delete();
        return response()->json(['message' => 'Kost dihapus']);
    }

    private function deleteOldFoto(?string $fotoUrl): void
    {
        if (!$fotoUrl) return;
        $path = ltrim(str_replace('/storage/', '', $fotoUrl), '/');
        if ($path) Storage::disk('public')->delete($path);
    }
}
