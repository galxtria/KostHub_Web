<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'avatar_url', 'role',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function kosts() { return $this->hasMany(Kost::class, 'owner_id'); }
    public function contracts() { return $this->hasMany(Contract::class); }
    public function activeContract() { return $this->hasOne(Contract::class)->where('status','aktif')->latestOfMany(); }
    public function invoices() { return $this->hasMany(Invoice::class); }
    public function isAdmin(): bool { return $this->role === 'admin'; }
}
