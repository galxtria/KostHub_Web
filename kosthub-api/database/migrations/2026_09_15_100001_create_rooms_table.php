<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kost_id')->constrained('kosts')->cascadeOnDelete();
            $table->string('nomor_kamar', 10);
            $table->enum('tipe', ['standar', 'exclusive'])->default('standar');
            $table->decimal('harga_bulanan', 12, 2);
            $table->enum('status', ['kosong', 'terisi', 'maintenance'])->default('kosong');
            $table->json('fasilitas')->nullable();
            $table->json('foto_urls')->nullable();
            $table->timestamps();

            $table->unique(['kost_id', 'nomor_kamar']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
