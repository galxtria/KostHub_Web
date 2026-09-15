<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
            'role' => ['nullable', Rule::in(['admin','penghuni'])],
        ]);

        // Keamanan: role admin hanya boleh dibuat oleh admin yang sudah login.
        // Registrasi publik selalu jadi penghuni, kecuali seeder.
        $data['role'] = 'penghuni';

        $user = User::create($data);
        $token = $user->createToken('web')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email atau password salah'], 422);
        }

        $token = $user->createToken('web')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->loadCount([
            'contracts as active_contracts_count' => fn($q) => $q->where('status','aktif'),
        ]));
    }

    // Edit profil sendiri: nama, email, no. HP + ganti password (opsional)
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:20',
            'current_password' => 'nullable|string|required_with:password',
            'password' => 'nullable|string|min:6|confirmed',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if (!empty($data['password'])) {
            if (! Hash::check($data['current_password'] ?? '', $user->password)) {
                return response()->json(['message' => 'Password lama salah'], 422);
            }
            $user->password = $data['password']; // otomatis di-hash via cast
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar_url) {
                $old = ltrim(str_replace('/storage/', '', $user->avatar_url), '/');
                if ($old) Storage::disk('public')->delete($old);
            }
            $user->avatar_url = '/storage/'.$request->file('avatar')->store('avatars', 'public');
        }

        $user->fill(collect($data)->only(['name', 'email', 'phone'])->toArray());
        $user->save();

        return response()->json($user->fresh());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}
