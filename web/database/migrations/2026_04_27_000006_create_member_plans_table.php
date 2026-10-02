<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 32)->unique();
            $table->string('name', 64);
            $table->unsignedBigInteger('yearly_price_cents');
            $table->integer('max_properties')->nullable();
            $table->boolean('includes_discount')->default(true);
            $table->integer('discount_percent')->default(10);
            $table->boolean('priority_dispatch')->default(false);
            $table->string('stripe_price_id', 64)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_plans');
    }
};
