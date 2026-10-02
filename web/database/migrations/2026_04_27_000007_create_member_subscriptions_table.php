<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('member_plan_id')->constrained()->restrictOnDelete();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->string('stripe_subscription_id', 64)->nullable();
            $table->string('stripe_customer_id', 64)->nullable();
            $table->timestampTz('canceled_at')->nullable();
            $table->timestampsTz();

        });

        DB::statement("ALTER TABLE member_subscriptions ADD COLUMN status ENUM('active', 'past_due', 'canceled', 'incomplete', 'paused') NOT NULL DEFAULT 'incomplete'");

        DB::statement('CREATE INDEX member_subscriptions_user_status_index ON member_subscriptions (user_id, status)');

        DB::statement('ALTER TABLE member_subscriptions ADD COLUMN member_subscriptions_stripe_sub_unique_guard TINYINT GENERATED ALWAYS AS (CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX member_subscriptions_stripe_sub_unique (stripe_subscription_id, member_subscriptions_stripe_sub_unique_guard)');

        DB::statement("ALTER TABLE member_subscriptions ADD COLUMN member_subscriptions_one_active_per_user_guard TINYINT GENERATED ALWAYS AS (CASE WHEN status IN ('active', 'past_due') THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX member_subscriptions_one_active_per_user (user_id, member_subscriptions_one_active_per_user_guard)");
    }

    public function down(): void
    {
        Schema::dropIfExists('member_subscriptions');
    }
};
