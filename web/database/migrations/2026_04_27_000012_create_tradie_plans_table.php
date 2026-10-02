<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tradie_plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 32)->unique();
            $table->string('name', 64);
            $table->unsignedBigInteger('yearly_price_cents');
            $table->integer('dispatch_rank_boost')->default(0);
            $table->boolean('featured_listing')->default(false);
            $table->boolean('suburb_exclusivity')->default(false);
            $table->string('stripe_price_id', 64)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tradie_plans');
    }
};
