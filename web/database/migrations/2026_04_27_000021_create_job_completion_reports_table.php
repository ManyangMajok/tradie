<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_completion_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('tradie_company_id')->constrained()->restrictOnDelete();
            $table->foreignId('submitted_by_user_id')->constrained('users')->restrictOnDelete();
            $table->text('summary_of_work');
            $table->unsignedBigInteger('invoice_total_cents');
            $table->boolean('no_callout_fee_confirmed');
            $table->boolean('discount_applied');
            $table->unsignedBigInteger('discount_amount_cents')->nullable();
            $table->string('invoice_document_path', 500)->nullable();
            $table->text('completion_notes')->nullable();
            $table->timestampTz('submitted_at')->useCurrent();
            $table->timestampsTz();

            $table->index(['tradie_company_id', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_completion_reports');
    }
};
