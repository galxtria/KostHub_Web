<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Support\Notif;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    // Penghuni upload bukti (support file image + fallback string URL)
    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'metode' => 'required|in:transfer,qris,cash',
            'jumlah_bayar' => 'required|numeric|min:0',
            'bukti' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'bukti_url' => 'nullable|string|max:255',
        ]);

        $invoice = Invoice::findOrFail($data['invoice_id']);

        if ($request->user()->role !== 'admin' && $invoice->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bukan tagihan Anda'], 403);
        }

        if ($invoice->status === 'lunas') {
            return response()->json(['message' => 'Tagihan sudah lunas'], 422);
        }

        $buktiUrl = $data['bukti_url'] ?? null;
        if ($request->hasFile('bukti')) {
            $path = $request->file('bukti')->store('bukti', 'public');
            $buktiUrl = '/storage/'.$path;
        }

        $payment = Payment::create([
            'invoice_id' => $data['invoice_id'],
            'metode' => $data['metode'],
            'jumlah_bayar' => $data['jumlah_bayar'],
            'bukti_url' => $buktiUrl,
            'tgl_bayar' => now(),
            'status_verifikasi' => 'pending',
        ]);

        $invoice->update(['status' => 'menunggu_verifikasi']);

        Notif::toAdmins(
            'pembayaran_masuk',
            'Pembayaran perlu verifikasi',
            ($invoice->user->name ?? 'Penghuni').' mengirim bukti bayar '.$invoice->kode_invoice,
            '/admin/tagihan'
        );

        return response()->json($payment, 201);
    }

    // Admin verifikasi
    public function verify(Request $request, Payment $payment)
    {
        $data = $request->validate([
            'aksi' => 'required|in:verified,rejected',
            'catatan_admin' => 'nullable|string',
        ]);

        $payment->update([
            'status_verifikasi' => $data['aksi'],
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
            'catatan_admin' => $data['catatan_admin'] ?? null,
        ]);

        $payment->invoice->update([
            'status' => $data['aksi'] === 'verified' ? 'lunas' : 'belum_bayar',
        ]);

        $isOk = $data['aksi'] === 'verified';
        Notif::send(
            $payment->invoice->user_id,
            $isOk ? 'pembayaran_terverifikasi' : 'pembayaran_ditolak',
            $isOk ? 'Pembayaran terverifikasi' : 'Pembayaran ditolak',
            $payment->invoice->kode_invoice.($isOk ? ' sudah lunas. Terima kasih!' : ' dikembalikan ke belum bayar. Periksa catatan admin.'),
            '/tagihan'
        );

        return $payment->load('invoice');
    }
}
