<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_user_id')->constrained('users')->restrictOnDelete();
            $table->string('label', 60);
            $table->string('address_line_1', 200);
            $table->string('address_line_2', 200)->nullable();
            $table->foreignId('suburb_id')->constrained()->restrictOnDelete();
            $table->string('gate_code', 60)->nullable();
            $table->text('access_notes')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('suburb_id');
        });

        DB::statement("ALTER TABLE properties ADD COLUMN property_type ENUM('house', 'apartment', 'townhouse', 'duplex', 'commercial', 'other') NOT NULL");

        DB::statement('CREATE INDEX properties_member_user_id_index ON properties (member_user_id)');

        DB::statement('ALTER TABLE properties ADD COLUMN properties_one_primary_per_member_guard TINYINT GENERATED ALWAYS AS (CASE WHEN is_primary = true AND deleted_at IS NULL THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX properties_one_primary_per_member (member_user_id, properties_one_primary_per_member_guard)');
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
