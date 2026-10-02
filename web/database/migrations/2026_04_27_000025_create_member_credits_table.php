<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_user_id')->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('amount_cents');
            $table->text('reason');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('applied_to_subscription_id')->nullable()->constrained('member_subscriptions')->restrictOnDelete();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_credits');
    }
};
