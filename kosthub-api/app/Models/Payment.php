<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['invoice_id','metode','jumlah_bayar','tgl_bayar','bukti_url','gateway_ref','va_number','status_verifikasi','verified_by','verified_at','catatan_admin'];
    protected $casts = ['tgl_bayar' => 'datetime', 'verified_at' => 'datetime'];

    public function invoice() { return $this->belongsTo(Invoice::class); }
    public function verifier() { return $this->belongsTo(User::class, 'verified_by'); }
}
