<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_tradies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tradie_company_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['member_user_id', 'tradie_company_id']);
            $table->index('tradie_company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_tradies');
    }
};
