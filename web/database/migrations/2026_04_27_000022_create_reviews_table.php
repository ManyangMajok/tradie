<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('member_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('tradie_company_id')->constrained()->restrictOnDelete();
            $table->string('work_completed_status', 16);
            $table->boolean('no_callout_fee_honoured');
            $table->string('discount_honoured', 8);
            $table->integer('stars');
            $table->text('review_text')->nullable();
            $table->boolean('was_auto_confirmed')->default(false);
            $table->timestampTz('submitted_at')->useCurrent();
            $table->timestampsTz();

            $table->index(['tradie_company_id', 'submitted_at']);
        });

        DB::statement('ALTER TABLE reviews ADD CONSTRAINT reviews_stars_check CHECK (stars BETWEEN 1 AND 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
