<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('public_id', 12)->unique();
            $table->foreignId('member_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('tradie_category_id')->constrained()->restrictOnDelete();
            $table->foreignId('issue_type_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('custom_issue', 200)->nullable();
            $table->text('description')->nullable();
            $table->string('best_contact_time', 32)->nullable();
            $table->timestampTz('submitted_at')->useCurrent();
            $table->timestampTz('dispatched_at')->nullable();
            $table->foreignId('assigned_tradie_company_id')->nullable()->constrained('tradie_companies')->restrictOnDelete();
            $table->timestampTz('assigned_at')->nullable();
            $table->timestampTz('on_the_way_at')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->integer('dispatch_round')->default(0);
            $table->boolean('requires_admin_review')->default(false);
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE jobs ADD COLUMN urgency ENUM('emergency', 'same_day', 'within_48h', 'flexible') NOT NULL");
        DB::statement("ALTER TABLE jobs ADD COLUMN status ENUM('pending_dispatch', 'offered', 'assigned', 'tradie_on_the_way', 'in_progress', 'awaiting_client_response', 'rescheduled', 'completed', 'confirmed', 'disputed', 'cancelled') NOT NULL DEFAULT 'pending_dispatch'");

        DB::statement('CREATE INDEX jobs_member_user_id_index ON jobs (member_user_id)');
        DB::statement('CREATE INDEX jobs_property_id_index ON jobs (property_id)');
        DB::statement('CREATE INDEX jobs_status_index ON jobs (status)');
        DB::statement('CREATE INDEX jobs_assigned_tradie_company_id_index ON jobs (assigned_tradie_company_id)');
        DB::statement('CREATE INDEX jobs_tradie_category_id_index ON jobs (tradie_category_id)');
        DB::statement('CREATE INDEX jobs_submitted_at_index ON jobs (submitted_at DESC)');
        DB::statement('CREATE INDEX jobs_requires_admin_review_index ON jobs (requires_admin_review)');
    }

    public function down(): void
    {
        Schema::dropIfExists('jobs');
    }
};
