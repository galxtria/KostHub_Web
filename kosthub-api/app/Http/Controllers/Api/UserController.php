<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // Daftar penghuni (admin) + info kontrak aktif & tagihan
    public function index(Request $request)
    {
        return User::with(['activeContract.room.kost'])
            ->withCount(['contracts', 'invoices as tagihan_aktif_count' => fn($q) =>
                $q->whereIn('status', ['belum_bayar', 'terlambat', 'menunggu_verifikasi'])])
            ->when($request->role, fn($q) => $q->where('role', $request->role), fn($q) => $q->where('role', 'penghuni'))
            ->when($request->search, fn($q) => $q->where(fn($qq) => $qq
                ->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('email', 'like', '%'.$request->search.'%')
                ->orWhere('phone', 'like', '%'.$request->search.'%')))
            ->latest()->paginate(10);
    }

    // Detail penghuni: kontrak + tagihan
    public function show(User $user)
    {
        return $user->load([
            'contracts.room.kost',
            'contracts.invoices' => fn($q) => $q->latest(),
        ]);
    }
}
