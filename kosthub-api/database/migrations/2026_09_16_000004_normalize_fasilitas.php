<?php

use App\Models\Kost;
use App\Models\Room;
use App\Support\Fasilitas;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        foreach (Kost::all() as $kost) {
            $normalized = Fasilitas::normalize($kost->fasilitas);
            if ($normalized !== $kost->fasilitas) {
                $kost->fasilitas = $normalized;
                $kost->save();
            }
        }

        foreach (Room::all() as $room) {
            $normalized = Fasilitas::normalize($room->fasilitas);
            if ($normalized !== $room->fasilitas) {
                $room->fasilitas = $normalized;
                $room->save();
            }
        }
    }

    public function down(): void
    {
        // Tidak reversibel (hanya normalisasi penulisan) — sengaja kosong.
    }
};
