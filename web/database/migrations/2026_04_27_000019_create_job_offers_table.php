<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tradie_company_id')->constrained()->restrictOnDelete();
            $table->integer('round')->default(1);
            $table->integer('rank_in_round');
            $table->decimal('score', 10, 4);
            $table->timestampTz('offered_at')->nullable();
            $table->timestampTz('viewed_at')->nullable();
            $table->timestampTz('accepted_at')->nullable();
            $table->timestampTz('declined_at')->nullable();
            $table->string('declined_reason', 64)->nullable();
            $table->timestampTz('expired_at')->nullable();
            $table->timestampTz('expires_at');
            $table->timestampTz('superseded_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['job_id', 'tradie_company_id', 'round']);
        });

        DB::statement("ALTER TABLE job_offers ADD COLUMN status ENUM('pending', 'offered', 'viewed', 'accepted', 'declined', 'expired', 'superseded') NOT NULL DEFAULT 'pending'");

        DB::statement('
            ALTER TABLE job_offers
            ADD COLUMN response_time_seconds bigint GENERATED ALWAYS AS (
                CASE WHEN accepted_at IS NOT NULL AND offered_at IS NOT NULL
                     THEN TIMESTAMPDIFF(SECOND, offered_at, accepted_at)
                     ELSE NULL END
            ) STORED
        ');

        DB::statement('CREATE INDEX job_offers_job_status_index ON job_offers (job_id, status)');
        DB::statement('CREATE INDEX job_offers_tradie_status_index ON job_offers (tradie_company_id, status)');
        DB::statement('CREATE INDEX job_offers_expires_at_index ON job_offers (expires_at)');
        DB::statement('CREATE INDEX job_offers_offered_at_index ON job_offers (offered_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('job_offers');
    }
};
