<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kosts', function (Blueprint $table) {
            $table->string('foto_url', 255)->nullable()->after('peraturan');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->string('foto_url', 255)->nullable()->after('foto_urls');
        });

        // Longgarkan kolom metode agar mendukung VA bank simulasi + string ke depan.
        // Nilai lama (transfer/qris/cash) tetap valid. Tanpa doctrine/dbal,
        // pakai raw SQL untuk MySQL/MariaDB.
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `payments` MODIFY `metode` VARCHAR(20) NOT NULL DEFAULT 'transfer'");
        }
        Schema::table('payments', function (Blueprint $table) {
            $table->string('gateway_ref', 60)->nullable()->after('bukti_url');
            $table->string('va_number', 40)->nullable()->after('gateway_ref');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['gateway_ref', 'va_number']);
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('foto_url');
        });

        Schema::table('kosts', function (Blueprint $table) {
            $table->dropColumn('foto_url');
        });
    }
};
