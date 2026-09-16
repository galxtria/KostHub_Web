<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\User;

class Notif
{
    public static function send(int $userId, string $tipe, string $judul, ?string $pesan = null, ?string $link = null): void
    {
        Notification::create([
            'user_id' => $userId,
            'tipe' => $tipe,
            'judul' => $judul,
            'pesan' => $pesan,
            'link' => $link,
        ]);
    }

    public static function toAdmins(string $tipe, string $judul, ?string $pesan = null, ?string $link = null): void
    {
        foreach (User::where('role', 'admin')->pluck('id') as $id) {
            self::send($id, $tipe, $judul, $pesan, $link);
        }
    }

    public static function toPenghuni(string $tipe, string $judul, ?string $pesan = null, ?string $link = null): void
    {
        foreach (User::where('role', '!=', 'admin')->pluck('id') as $id) {
            self::send($id, $tipe, $judul, $pesan, $link);
        }
    }
}
