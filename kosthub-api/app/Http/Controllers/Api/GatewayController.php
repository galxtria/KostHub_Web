<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Payment gateway SIMULASI (pengganti Midtrans).
 * Alur: charge -> instruksi bayar (VA/QRIS) -> simulate (callback bank).
 */
class GatewayController extends Controller
{
    private const METHODS = [
        'qris' => ['label' => 'QRIS', 'metode' => 'qris'],
        'va_bca' => ['label' => 'BCA Virtual Account', 'metode' => 'va_bca'],
        'va_bri' => ['label' => 'BRI Virtual Account', 'metode' => 'va_bri'],
    ];

    // Buat transaksi gateway untuk sebuah invoice
    public function charge(Request $request)
    {
        $data = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'metode' => 'required|in:qris,va_bca,va_bri',
        ]);

        $invoice = Invoice::with('room.kost')->findOrFail($data['invoice_id']);

        if ($request->user()->role !== 'admin' && $invoice->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bukan tagihan Anda'], 403);
        }

        if ($invoice->status === 'lunas') {
            return response()->json(['message' => 'Tagihan sudah lunas'], 422);
        }

        if ($invoice->status === 'menunggu_verifikasi') {
            return response()->json(['message' => 'Tagihan sedang menunggu verifikasi pembayaran'], 422);
        }

        $cfg = self::METHODS[$data['metode']];
        $va = null;

        if ($data['metode'] === 'va_bca') {
            $va = '8808'.str_pad((string) random_int(0, 9999999999), 10, '0', STR_PAD_LEFT);
        } elseif ($data['metode'] === 'va_bri') {
            $va = '002'.str_pad((string) random_int(0, 999999999999), 12, '0', STR_PAD_LEFT);
        }

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'metode' => $cfg['metode'],
            'jumlah_bayar' => $invoice->jumlah,
            'tgl_bayar' => now(),
            'gateway_ref' => 'SIM-'.strtoupper(Str::random(10)),
            'va_number' => $va,
            'status_verifikasi' => 'pending',
            'catatan_admin' => 'Gateway simulasi: '.$cfg['label'],
        ]);

        $invoice->update(['status' => 'menunggu_verifikasi']);

        return response()->json([
            'payment' => $payment->load('invoice.room.kost'),
            'instruksi' => $this->instruksi($data['metode'], $va, (float) $invoice->jumlah),
        ], 201);
    }

    // Simulasi callback bank: success -> lunas otomatis, failed -> kembali belum_bayar
    public function simulate(Request $request)
    {
        $data = $request->validate([
            'payment_id' => 'required|exists:payments,id',
            'hasil' => 'nullable|in:success,failed',
        ]);

        $payment = Payment::with('invoice')->findOrFail($data['payment_id']);

        if ($request->user()->role !== 'admin' && $payment->invoice->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bukan pembayaran Anda'], 403);
        }

        if ($payment->status_verifikasi !== 'pending') {
            return response()->json(['message' => 'Pembayaran ini sudah diproses'], 422);
        }

        $hasil = $data['hasil'] ?? 'success';

        if ($hasil === 'success') {
            $payment->update([
                'status_verifikasi' => 'verified',
                'verified_at' => now(),
                'catatan_admin' => ($payment->catatan_admin ?? '').' | callback: settlement',
            ]);
            $payment->invoice->update(['status' => 'lunas']);
        } else {
            $payment->update([
                'status_verifikasi' => 'rejected',
                'catatan_admin' => ($payment->catatan_admin ?? '').' | callback: failed',
            ]);
            $payment->invoice->update(['status' => 'belum_bayar']);
        }

        return response()->json($payment->load('invoice.room.kost'));
    }

    // Cek status untuk polling di halaman checkout
    public function status(Request $request, Payment $payment)
    {
        $payment->load('invoice.room.kost');

        if ($request->user()->role !== 'admin' && $payment->invoice->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bukan pembayaran Anda'], 403);
        }

        return $payment;
    }

    private function instruksi(string $metode, ?string $va, float $jumlah): array
    {
        $rupiah = 'Rp '.number_format($jumlah, 0, ',', '.');

        return match ($metode) {
            'qris' => [
                'judul' => 'Pindai QRIS untuk membayar',
                'kode' => 'QRIS-SIM-'.strtoupper(Str::random(8)),
                'nominal' => $rupiah,
                'langkah' => [
                    'Buka aplikasi e-wallet / m-banking Anda',
                    'Pilih Bayar / Scan QRIS',
                    'Pindai kode QR di atas',
                    "Pastikan nominal $rupiah lalu konfirmasi",
                ],
            ],
            'va_bca', 'va_bri' => [
                'judul' => 'Transfer ke Virtual Account',
                'kode' => $va,
                'nominal' => $rupiah,
                'langkah' => [
                    'Buka m-banking / ATM / internet banking',
                    'Pilih menu Virtual Account',
                    "Masukkan nomor $va",
                    "Pastikan nominal $rupiah lalu konfirmasi",
                ],
            ],
        };
    }
}
