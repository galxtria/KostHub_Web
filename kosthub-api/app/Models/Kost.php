<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kost extends Model
{
    protected $fillable = ['owner_id','nama','alamat','kota','deskripsi','peraturan','foto_url','latitude','longitude','fasilitas'];
    protected $casts = ['fasilitas' => 'array'];

    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
    public function rooms() { return $this->hasMany(Room::class); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function announcements() { return $this->hasMany(Announcement::class); }
    public function expenses() { return $this->hasMany(Expense::class); }
}
