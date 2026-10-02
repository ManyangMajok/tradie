<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Workload subquery: WHERE assigned_tradie_company_id = ? AND status IN (active statuses)
        DB::statement('CREATE INDEX jobs_assigned_active_status_idx ON jobs (assigned_tradie_company_id, status)');

        // Dispute subquery: WHERE assigned_tradie_company_id = ? AND status = 'disputed' AND updated_at >= ?
        DB::statement('CREATE INDEX jobs_assigned_disputed_idx ON jobs (assigned_tradie_company_id, updated_at)');

        // Offer response-time subquery: WHERE tradie_company_id = ? AND status = 'accepted' AND accepted_at >= ?
        DB::statement('CREATE INDEX job_offers_tradie_accepted_at_idx ON job_offers (tradie_company_id, accepted_at)');

        // Offer count subquery: WHERE tradie_company_id = ? AND created_at >= ? AND status != 'superseded'
        DB::statement('CREATE INDEX job_offers_tradie_created_at_idx ON job_offers (tradie_company_id, created_at)');

        // Expired offers subquery: WHERE tradie_company_id = ? AND status = 'expired' AND expired_at >= ?
        DB::statement('CREATE INDEX job_offers_tradie_expired_at_idx ON job_offers (tradie_company_id, expired_at)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX jobs_assigned_active_status_idx ON jobs');
        DB::statement('DROP INDEX jobs_assigned_disputed_idx ON jobs');
        DB::statement('DROP INDEX job_offers_tradie_accepted_at_idx ON job_offers');
        DB::statement('DROP INDEX job_offers_tradie_created_at_idx ON job_offers');
        DB::statement('DROP INDEX job_offers_tradie_expired_at_idx ON job_offers');
    }
};
