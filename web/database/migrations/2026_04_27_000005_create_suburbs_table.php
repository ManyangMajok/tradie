<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suburbs', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('postcode', 10);
            $table->string('state', 8);
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->unique(['name', 'postcode', 'state']);
            $table->index('postcode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suburbs');
    }
};
