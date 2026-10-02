<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Admin-manual assignments have no computed score (spec Â§8.12)
        DB::statement('ALTER TABLE job_offers MODIFY COLUMN score DECIMAL(10,4) NULL');
    }

    public function down(): void
    {
        DB::statement('UPDATE job_offers SET score = 0 WHERE score IS NULL');
        DB::statement('ALTER TABLE job_offers MODIFY COLUMN score DECIMAL(10,4) NOT NULL');
    }
};
