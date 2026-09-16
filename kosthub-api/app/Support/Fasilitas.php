<?php

namespace App\Support;

class Fasilitas
{
    public const KOST = [
        'WiFi',
        'CCTV',
        'Parkir Motor',
        'Parkir Mobil',
        'Dapur Bersama',
        'Laundry',
        'Rooftop',
        'Taman',
        'Ruang Santai',
        'Penjaga 24 Jam',
        'Air Panas',
    ];

    public const KAMAR = [
        'AC',
        'Kipas Angin',
        'KM Dalam',
        'KM Luar',
        'Kasur',
        'Lemari',
        'Meja Belajar',
        'TV',
        'Air Panas',
    ];

    private const ALIAS = [
        'wifi' => 'WiFi',
        'cctv' => 'CCTV',
        'parkir' => 'Parkir Motor',
        'parkir motor' => 'Parkir Motor',
        'parkir mobil' => 'Parkir Mobil',
        'dapur' => 'Dapur Bersama',
        'dapur bersama' => 'Dapur Bersama',
        'laundry' => 'Laundry',
        'rooftop' => 'Rooftop',
        'taman' => 'Taman',
        'ruang santai' => 'Ruang Santai',
        'penjaga 24 jam' => 'Penjaga 24 Jam',
        'penjaga' => 'Penjaga 24 Jam',
        'air panas' => 'Air Panas',
        'ac' => 'AC',
        'kipas angin' => 'Kipas Angin',
        'kipas' => 'Kipas Angin',
        'km dalam' => 'KM Dalam',
        'kamar mandi dalam' => 'KM Dalam',
        'km luar' => 'KM Luar',
        'kamar mandi luar' => 'KM Luar',
        'kasur' => 'Kasur',
        'kasur nyaman' => 'Kasur',
        'lemari' => 'Lemari',
        'meja belajar' => 'Meja Belajar',
        'tv' => 'TV',
    ];

    public static function normalize(?array $items): ?array
    {
        if ($items === null) return null;
        $out = [];
        foreach ($items as $item) {
            $key = mb_strtolower(trim((string) $item));
            if ($key === '') continue;
            $out[] = self::ALIAS[$key] ?? (string) $item;
        }
        return array_values(array_unique($out));
    }
}
