<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tradie_company_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tradie_company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tradie_category_id')->constrained()->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
            $table->softDeletesTz();

            $table->unique(['tradie_company_id', 'tradie_category_id'], 'company_category_unique');
            $table->index('tradie_category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tradie_company_categories');
    }
};
