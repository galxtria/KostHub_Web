<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = ['user_id','room_id','tgl_masuk','tgl_keluar','deposit','status'];
    protected $casts = ['tgl_masuk' => 'date', 'tgl_keluar' => 'date'];

    public function user() { return $this->belongsTo(User::class); }
    public function room() { return $this->belongsTo(Room::class); }
    public function invoices() { return $this->hasMany(Invoice::class); }
}
