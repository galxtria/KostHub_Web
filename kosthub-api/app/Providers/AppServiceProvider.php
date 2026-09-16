<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Tautan reset password mengarah ke frontend (bukan halaman Laravel)
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $base = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
            return $base.'/reset-password?token='.$token.'&email='.urlencode($user->email);
        });
    }
}
