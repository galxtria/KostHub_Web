<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kost;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Kost $kost)
    {
        return $kost->reviews()
            ->with('user:id,name')
            ->latest()
            ->paginate(10);
    }

    public function store(Request $request, Kost $kost)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'komentar' => 'nullable|string|max:1000',
        ]);

        // Satu ulasan per penghuni per kost — kirim ulang = perbarui
        $review = Review::updateOrCreate(
            ['kost_id' => $kost->id, 'user_id' => $request->user()->id],
            $data
        );

        return response()->json($review->load('user:id,name'), 201);
    }

    public function destroy(Request $request, Review $review)
    {
        $user = $request->user();
        if ($user->id !== $review->user_id && $user->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }
        $review->delete();
        return response()->json(['message' => 'Ulasan dihapus']);
    }
}
