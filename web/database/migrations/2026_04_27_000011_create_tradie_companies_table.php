<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tradie_companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->restrictOnDelete();
            $table->string('business_name', 200);
            $table->string('trading_name', 200)->nullable();
            $table->string('abn', 20)->nullable();
            $table->string('licence_number', 60)->nullable();
            $table->string('licence_state', 8)->nullable();
            $table->date('licence_expires_on')->nullable();
            $table->date('insurance_expires_on')->nullable();
            $table->string('licence_document_path', 500)->nullable();
            $table->string('insurance_document_path', 500)->nullable();
            $table->text('about_text')->nullable();
            $table->string('logo_path', 500)->nullable();
            $table->decimal('rating_average', 3, 2)->nullable();
            $table->integer('rating_count')->default(0);
            $table->timestampTz('approved_at')->nullable();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->text('suspended_reason')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
        });

        DB::statement("ALTER TABLE tradie_companies ADD COLUMN status ENUM('pending_review', 'approved', 'suspended', 'rejected') NOT NULL DEFAULT 'pending_review'");

        DB::statement('ALTER TABLE tradie_companies ADD COLUMN tradie_companies_owner_unique_guard TINYINT GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX tradie_companies_owner_unique (owner_user_id, tradie_companies_owner_unique_guard)');
        DB::statement('ALTER TABLE tradie_companies ADD COLUMN tradie_companies_abn_unique_guard TINYINT GENERATED ALWAYS AS (CASE WHEN abn IS NOT NULL AND deleted_at IS NULL THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX tradie_companies_abn_unique (abn, tradie_companies_abn_unique_guard)');
        DB::statement('CREATE INDEX tradie_companies_status_index ON tradie_companies (status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tradie_companies');
    }
};
