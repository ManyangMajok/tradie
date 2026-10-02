<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issue_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tradie_category_id')->constrained()->restrictOnDelete();
            $table->string('slug', 48);
            $table->string('name', 100);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->unique(['tradie_category_id', 'slug']);
            $table->index('tradie_category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_types');
    }
};
