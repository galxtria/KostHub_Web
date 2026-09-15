<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = ['kost_id','judul','isi','berlaku_sampai'];
    protected $casts = ['berlaku_sampai' => 'date'];
    public function kost() { return $this->belongsTo(Kost::class); }
}
