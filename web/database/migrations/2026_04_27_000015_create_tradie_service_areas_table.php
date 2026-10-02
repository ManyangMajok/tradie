<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tradie_service_areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tradie_company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('suburb_id')->constrained()->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
            $table->softDeletesTz();

            $table->unique(['tradie_company_id', 'suburb_id']);
            $table->index('suburb_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tradie_service_areas');
    }
};
