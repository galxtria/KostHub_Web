<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = ['kost_id','nomor_kamar','tipe','harga_bulanan','status','fasilitas','foto_urls','foto_url'];
    protected $casts = ['fasilitas' => 'array', 'foto_urls' => 'array', 'harga_bulanan' => 'decimal:2'];

    public function kost() { return $this->belongsTo(Kost::class); }
    public function contracts() { return $this->hasMany(Contract::class); }
    public function activeContract() { return $this->hasOne(Contract::class)->where('status','aktif'); }
}
