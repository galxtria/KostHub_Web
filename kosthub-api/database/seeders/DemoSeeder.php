<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Kost;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@kosthub.id'],
            ['name' => 'Pemilik Kost', 'password' => 'semangat45', 'role' => 'admin', 'phone' => '081234567890']
        );

        $penghuni = User::firstOrCreate(
            ['email' => 'budi@mail.com'],
            ['name' => 'Budi Santoso', 'password' => 'password', 'role' => 'penghuni', 'phone' => '089876543210']
        );

        $kost = Kost::firstOrCreate(
            ['nama' => 'KostHub Mawar Jakarta'],
            ['owner_id' => $admin->id, 'alamat' => 'Jl. Mawar No. 10, Jakarta Selatan', 'kota' => 'Jakarta', 'deskripsi' => 'Kost eksklusif dekat kampus', 'peraturan' => '1. Tamu maks jam 22.00. 2. Dilarang membawa hewan.', 'latitude' => -6.2607, 'longitude' => 106.8104, 'fasilitas' => ['wifi','parkir','cctv','dapur']]
        );

        foreach (['A1','A2','A3','B1','B2'] as $i => $nomor) {
            Room::firstOrCreate(
                ['kost_id' => $kost->id, 'nomor_kamar' => $nomor],
                ['tipe' => $i < 3 ? 'exclusive' : 'standar', 'harga_bulanan' => $i < 3 ? 1500000 : 1000000, 'status' => 'kosong', 'fasilitas' => ['ac','kamar mandi dalam','lemari']]
            );
        }

        $room = Room::where('nomor_kamar','A1')->first();
        $contract = Contract::firstOrCreate(
            ['user_id' => $penghuni->id, 'room_id' => $room->id, 'status' => 'aktif'],
            ['tgl_masuk' => now()->subDays(10)->toDateString(), 'deposit' => 500000]
        );
        $room->update(['status' => 'terisi']);

        Invoice::firstOrCreate(
            ['kode_invoice' => 'INV-DEMO-0001'],
            ['contract_id' => $contract->id, 'user_id' => $penghuni->id, 'room_id' => $room->id, 'jenis' => 'sewa', 'periode' => now()->startOfMonth()->toDateString(), 'jumlah' => $room->harga_bulanan, 'jatuh_tempo' => now()->addDays(5)->toDateString(), 'status' => 'belum_bayar']
        );
    }
}
