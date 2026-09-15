<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        return Expense::with('kost:id,nama')
            ->when($request->kost_id, fn($q) => $q->where('kost_id', $request->kost_id))
            ->when($request->bulan, fn($q) => $q->whereMonth('tanggal', $request->bulan))
            ->when($request->tahun, fn($q) => $q->whereYear('tanggal', $request->tahun))
            ->latest('tanggal')->paginate(15);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kost_id' => 'required|exists:kosts,id',
            'kategori' => 'required|string|max:50',
            'jumlah' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
            'keterangan' => 'nullable|string',
        ]);
        return response()->json(Expense::create($data), 201);
    }

    public function destroy(Expense $expense)
    {
        // route-model binding pakai {expense}
        $expense->delete();
        return response()->json(['message' => 'Pengeluaran dihapus']);
    }
}
