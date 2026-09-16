<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $q = Notification::where('user_id', $request->user()->id)->latest();
        return response()->json([
            'data' => (clone $q)->limit(20)->get(),
            'unread_count' => (clone $q)->whereNull('read_at')->count(),
        ]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bukan notifikasi Anda'], 403);
        }
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'OK']);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->json(['message' => 'Semua ditandai dibaca']);
    }
}
