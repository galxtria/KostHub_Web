<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    // Kost favorit saya (dengan agregat untuk kartu)
    public function index(Request $request)
    {
        return Favorite::with(['kost' => function ($q) {
                $q->withMin('rooms', 'harga_bulanan')
                    ->withAvg('reviews', 'rating')
                    ->withCount(['rooms', 'rooms as rooms_terisi_count' => fn($qq) => $qq->where('status', 'terisi')]);
            }])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);
    }

    // Toggle favorit (idempotent)
    public function toggle(Request $request)
    {
        $data = $request->validate(['kost_id' => 'required|exists:kosts,id']);

        $fav = Favorite::where('user_id', $request->user()->id)
            ->where('kost_id', $data['kost_id'])
            ->first();

        if ($fav) {
            $fav->delete();
            return response()->json(['favorited' => false]);
        }

        Favorite::create(['user_id' => $request->user()->id, 'kost_id' => $data['kost_id']]);
        return response()->json(['favorited' => true], 201);
    }
}
