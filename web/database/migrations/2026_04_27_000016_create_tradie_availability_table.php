<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tradie_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tradie_company_id')->constrained()->cascadeOnDelete();
            $table->integer('day_of_week');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('accepts_emergency')->default(false);
            $table->timestampsTz();

            $table->unique(['tradie_company_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tradie_availability');
    }
};
