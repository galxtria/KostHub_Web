<?php

namespace Database\Seeders;

use App\Models\Kost;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

class DenpasarSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@kosthub.id')->first();
        if (! $admin) {
            $this->command->warn('Admin tidak ditemukan, lewati DenpasarSeeder.');
            return;
        }

        $kosts = [
            [
                'nama' => 'Kost Renon Asri',
                'alamat' => 'Jl. Tukad Badung No. 88, Renon',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost eksklusif di jantung Renon, 5 menit ke kantor pemerintahan dan kampus. Lingkungan tenang dan aman.',
                'peraturan' => '1. Tamu maksimal sampai jam 22.00. 2. Dilarang membawa hewan peliharaan. 3. Jaga kebersihan area bersama.',
                'latitude' => -8.6720,
                'longitude' => 115.2340,
                'fasilitas' => ['WiFi', 'Parkir Motor', 'CCTV', 'Dapur Bersama', 'Laundry'],
                'rooms' => [
                    ['A1', 'exclusive', 1800000],
                    ['A2', 'exclusive', 1600000],
                    ['B1', 'standar', 1200000],
                    ['B2', 'standar', 1000000],
                ],
            ],
            [
                'nama' => 'Kost Jimbaran View',
                'alamat' => 'Jl. Uluwatu No. 45, Jimbaran',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost nyaman dekat Pantai Jimbaran dan kampus Udayana. Cocok untuk mahasiswa dan pekerja.',
                'peraturan' => '1. Dilarang merokok di dalam kamar. 2. Tamu lapor ke penjaga kost.',
                'latitude' => -8.7790,
                'longitude' => 115.1690,
                'fasilitas' => ['WiFi', 'Parkir Motor', 'CCTV', 'Dapur Bersama'],
                'rooms' => [
                    ['A1', 'exclusive', 2000000],
                    ['A2', 'standar', 1300000],
                    ['B1', 'standar', 1100000],
                ],
            ],
            [
                'nama' => 'Kost Sanur Beach Residence',
                'alamat' => 'Jl. Danau Tamblingan No. 120, Sanur',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost premium 10 menit jalan kaki ke Pantai Sanur. Sunrise setiap pagi dari rooftop.',
                'peraturan' => '1. Jam malam jam 23.00. 2. Dilarang mengadakan acara tanpa izin.',
                'latitude' => -8.6980,
                'longitude' => 115.2620,
                'fasilitas' => ['WiFi', 'AC', 'Parkir Motor', 'CCTV', 'Rooftop', 'Dapur Bersama'],
                'rooms' => [
                    ['A1', 'exclusive', 2200000],
                    ['A2', 'exclusive', 1900000],
                    ['B1', 'standar', 1400000],
                    ['B2', 'standar', 1250000],
                ],
            ],
            [
                'nama' => 'Kost Gajah Mada Heritage',
                'alamat' => 'Jl. Gajah Mada No. 200, Dauh Puri',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost strategis di pusat Kota Denpasar, dekat Pasar Badung dan pusat kuliner. Akses angkot mudah.',
                'peraturan' => '1. Bayar kos maksimal tanggal 5. 2. Jaga ketertiban dan kebersihan.',
                'latitude' => -8.6560,
                'longitude' => 115.2160,
                'fasilitas' => ['WiFi', 'Parkir Motor', 'CCTV', 'Dapur Bersama'],
                'rooms' => [
                    ['A1', 'standar', 1100000],
                    ['A2', 'standar', 1000000],
                    ['B1', 'standar', 900000],
                ],
            ],
            [
                'nama' => 'Kost Sesetan Harmoni',
                'alamat' => 'Jl. Sesetan No. 250, Sesetan',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost asri di kawasan Sesetan, dekat kampus UNMAS dan pusat kuliner malam. Lingkungan pendatang yang ramah.',
                'peraturan' => '1. Tamu maksimal sampai jam 22.00. 2. Dilarang membawa hewan peliharaan.',
                'latitude' => -8.7020,
                'longitude' => 115.2080,
                'fasilitas' => ['WiFi', 'Parkir Motor', 'CCTV', 'Dapur Bersama', 'Ruang Santai'],
                'rooms' => [
                    ['A1', 'exclusive', 1700000],
                    ['A2', 'standar', 1150000],
                    ['B1', 'standar', 950000],
                ],
            ],
            [
                'nama' => 'Kost Ubung Permai',
                'alamat' => 'Jl. Cokroaminoto No. 88, Ubung',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost strategis dekat Terminal Ubung dan Pasar Ubung. Cocok untuk pekerja dengan mobilitas tinggi.',
                'peraturan' => '1. Bayar kos maksimal tanggal 5. 2. Tamu lapor ke penjaga kost.',
                'latitude' => -8.6480,
                'longitude' => 115.1980,
                'fasilitas' => ['WiFi', 'Parkir Motor', 'CCTV', 'Dapur Bersama'],
                'rooms' => [
                    ['A1', 'standar', 1050000],
                    ['A2', 'standar', 950000],
                    ['B1', 'standar', 850000],
                ],
            ],
            [
                'nama' => 'Kost Teuku Umar Residence',
                'alamat' => 'Jl. Teuku Umar No. 150, Dauh Puri Kauh',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost modern di jalur utama Teuku Umar, dekat Mal Level Up dan deretan kafe. Akses ke mana saja mudah.',
                'peraturan' => '1. Dilarang merokok di dalam kamar. 2. Jam malam jam 23.00.',
                'latitude' => -8.6780,
                'longitude' => 115.2080,
                'fasilitas' => ['WiFi', 'AC', 'Parkir Motor', 'CCTV', 'Laundry'],
                'rooms' => [
                    ['A1', 'exclusive', 2100000],
                    ['A2', 'exclusive', 1850000],
                    ['B1', 'standar', 1350000],
                ],
            ],
            [
                'nama' => 'Kost Tohpati Garden',
                'alamat' => 'Jl. WR Supratman No. 45, Tohpati, Kesiman',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost hijau dan tenang di kawasan Tohpati, dekat Museum Sidik Jari dan pusat oleh-oleh. Cocok untuk yang suka ketenangan.',
                'peraturan' => '1. Jaga ketenangan setelah jam 22.00. 2. Dilarang mengadakan acara tanpa izin.',
                'latitude' => -8.6680,
                'longitude' => 115.2540,
                'fasilitas' => ['WiFi', 'Parkir Motor', 'CCTV', 'Taman', 'Dapur Bersama'],
                'rooms' => [
                    ['A1', 'standar', 1200000],
                    ['A2', 'standar', 1100000],
                    ['B1', 'standar', 900000],
                    ['B2', 'standar', 850000],
                ],
            ],
            [
                'nama' => 'Kost Imam Bonjol City',
                'alamat' => 'Jl. Imam Bonjol No. 320, Pemecutan Klod',
                'kota' => 'Denpasar',
                'deskripsi' => 'Kost kota di koridor bisnis Imam Bonjol, dikelilingi ruko, bank, dan tempat makan. Ideal untuk karyawan.',
                'peraturan' => '1. Bayar kos maksimal tanggal 5. 2. Jaga ketertiban dan kebersihan.',
                'latitude' => -8.6900,
                'longitude' => 115.1900,
                'fasilitas' => ['WiFi', 'Parkir Motor', 'CCTV', 'Dapur Bersama', 'Air Panas'],
                'rooms' => [
                    ['A1', 'exclusive', 1900000],
                    ['A2', 'standar', 1300000],
                    ['B1', 'standar', 1150000],
                ],
            ],
        ];

        foreach ($kosts as $item) {
            $kost = Kost::firstOrCreate(
                ['nama' => $item['nama']],
                [
                    'owner_id' => $admin->id,
                    'alamat' => $item['alamat'],
                    'kota' => $item['kota'],
                    'deskripsi' => $item['deskripsi'],
                    'peraturan' => $item['peraturan'],
                    'latitude' => $item['latitude'],
                    'longitude' => $item['longitude'],
                    'fasilitas' => $item['fasilitas'],
                ]
            );

            foreach ($item['rooms'] as [$nomor, $tipe, $harga]) {
                Room::firstOrCreate(
                    ['kost_id' => $kost->id, 'nomor_kamar' => $nomor],
                    [
                        'tipe' => $tipe,
                        'harga_bulanan' => $harga,
                        'status' => 'kosong',
                        'fasilitas' => $tipe === 'exclusive'
                            ? ['AC', 'KM Dalam', 'Lemari', 'Meja Belajar']
                            : ['Kipas Angin', 'Kasur', 'Lemari'],
                    ]
                );
            }
        }
    }
}
