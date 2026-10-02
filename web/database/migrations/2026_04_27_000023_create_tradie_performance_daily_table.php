<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tradie_performance_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tradie_company_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->integer('leads_offered')->default(0);
            $table->integer('leads_viewed')->default(0);
            $table->integer('leads_accepted')->default(0);
            $table->integer('leads_declined')->default(0);
            $table->integer('leads_expired')->default(0);
            $table->integer('jobs_completed')->default(0);
            $table->integer('jobs_disputed')->default(0);
            $table->integer('avg_response_time_seconds')->nullable();
            $table->unsignedBigInteger('reported_revenue_cents')->default(0);
            $table->unsignedBigInteger('discount_given_cents')->default(0);
            $table->timestampsTz();

            $table->unique(['tradie_company_id', 'date']);
            $table->index(['date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tradie_performance_daily');
    }
};
