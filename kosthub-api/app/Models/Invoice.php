<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = ['contract_id','user_id','room_id','kode_invoice','jenis','periode','jumlah','jatuh_tempo','status'];
    protected $casts = ['periode' => 'date', 'jatuh_tempo' => 'date', 'jumlah' => 'decimal:2'];

    public function contract() { return $this->belongsTo(Contract::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function room() { return $this->belongsTo(Room::class); }
    public function payments() { return $this->hasMany(Payment::class); }
}
