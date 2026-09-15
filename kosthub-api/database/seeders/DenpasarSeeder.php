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
                'fasilitas' => ['wifi', 'parkir', 'cctv', 'dapur', 'laundry'],
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
                'fasilitas' => ['wifi', 'parkir', 'cctv', 'dapur bersama'],
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
                'fasilitas' => ['wifi', 'ac', 'parkir', 'cctv', 'rooftop', 'dapur'],
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
                'fasilitas' => ['wifi', 'parkir motor', 'cctv', 'dapur'],
                'rooms' => [
                    ['A1', 'standar', 1100000],
                    ['A2', 'standar', 1000000],
                    ['B1', 'standar', 900000],
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
                            ? ['ac', 'kamar mandi dalam', 'lemari', 'meja belajar']
                            : ['kipas angin', 'kasur', 'lemari'],
                    ]
                );
            }
        }
    }
}
