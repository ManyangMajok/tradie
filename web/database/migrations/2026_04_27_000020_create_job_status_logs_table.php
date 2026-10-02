<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->boolean('changed_by_system')->default(false);
            $table->text('note')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['job_id', 'created_at']);
        });

        DB::statement("ALTER TABLE job_status_logs ADD COLUMN from_status ENUM('pending_dispatch', 'offered', 'assigned', 'tradie_on_the_way', 'in_progress', 'awaiting_client_response', 'rescheduled', 'completed', 'confirmed', 'disputed', 'cancelled') NULL");
        DB::statement("ALTER TABLE job_status_logs ADD COLUMN to_status ENUM('pending_dispatch', 'offered', 'assigned', 'tradie_on_the_way', 'in_progress', 'awaiting_client_response', 'rescheduled', 'completed', 'confirmed', 'disputed', 'cancelled') NOT NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('job_status_logs');
    }
};
