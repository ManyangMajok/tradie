<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email', 255);
            $table->timestampTz('email_verified_at')->nullable();
            $table->string('phone', 32);
            $table->timestampTz('phone_verified_at')->nullable();
            $table->string('password', 255);
            $table->string('remember_token', 100)->nullable();
            $table->timestampTz('last_login_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
        });

        DB::statement("ALTER TABLE users ADD COLUMN role ENUM('admin', 'member', 'tradie') NOT NULL");
        DB::statement("ALTER TABLE users ADD COLUMN status ENUM('active', 'suspended', 'pending_verification') NOT NULL DEFAULT 'pending_verification'");

        DB::statement('ALTER TABLE users ADD COLUMN users_email_unique_guard TINYINT GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX users_email_unique (email, users_email_unique_guard)');
        DB::statement('ALTER TABLE users ADD COLUMN users_phone_unique_guard TINYINT GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX users_phone_unique (phone, users_phone_unique_guard)');
        DB::statement('CREATE INDEX users_role_status_index ON users (role, status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
