<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\GatewayController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\KostController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn(Request $r) => $r->user());
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard-user', [DashboardController::class, 'user']);

    // Katalog publik (login, semua role) — untuk discovery + detail kost
    Route::get('/kosts', [KostController::class, 'index']);
    Route::get('/kosts/{kost}', [KostController::class, 'show']);
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/rooms/{room}', [RoomController::class, 'show']);

    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::post('/payments', [PaymentController::class, 'store']);

    // Booking kamar oleh penghuni -> kontrak + invoice pertama
    Route::post('/bookings', [ContractController::class, 'book']);
    Route::get('/my/contracts', [ContractController::class, 'mine']);
    Route::post('/contracts/{contract}/cancel', [ContractController::class, 'cancel']);

    // Payment gateway simulasi
    Route::post('/gateway/charge', [GatewayController::class, 'charge']);
    Route::post('/gateway/simulate', [GatewayController::class, 'simulate']);
    Route::get('/gateway/payments/{payment}', [GatewayController::class, 'status']);

    // Admin only
    Route::middleware('is_admin')->group(function () {
        Route::get('/dashboard-admin', [DashboardController::class, 'admin']);
        Route::apiResource('/kosts', KostController::class)->except(['index', 'show']);
        Route::apiResource('/rooms', RoomController::class)->except(['index', 'show']);
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::get('/contracts', [ContractController::class, 'index']);
        Route::get('/contracts/{contract}', [ContractController::class, 'show']);
        Route::post('/contracts', [ContractController::class, 'store']);
        Route::post('/contracts/{contract}/finish', [ContractController::class, 'finish']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::post('/invoices/generate-bulk', [InvoiceController::class, 'generateBulk']);
        Route::post('/payments/{payment}/verify', [PaymentController::class, 'verify']);
        Route::get('/expenses', [ExpenseController::class, 'index']);
        Route::post('/expenses', [ExpenseController::class, 'store']);
        Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);
        Route::get('/reports/keuangan', [ReportController::class, 'keuangan']);
        Route::get('/reports/keuangan-csv', [ReportController::class, 'keuanganCsv']);
    });
});
