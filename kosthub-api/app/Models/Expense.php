<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['kost_id','kategori','jumlah','tanggal','keterangan'];
    protected $casts = ['tanggal' => 'date', 'jumlah' => 'decimal:2'];
    public function kost() { return $this->belongsTo(Kost::class); }
}
