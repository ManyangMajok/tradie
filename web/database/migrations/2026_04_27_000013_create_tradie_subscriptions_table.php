<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tradie_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tradie_company_id')->constrained()->restrictOnDelete();
            $table->foreignId('tradie_plan_id')->constrained()->restrictOnDelete();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->string('stripe_subscription_id', 64)->nullable();
            $table->string('stripe_customer_id', 64)->nullable();
            $table->timestampTz('canceled_at')->nullable();
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE tradie_subscriptions ADD COLUMN status ENUM('active', 'past_due', 'canceled', 'incomplete', 'paused') NOT NULL DEFAULT 'incomplete'");

        DB::statement('CREATE INDEX tradie_subscriptions_company_status_index ON tradie_subscriptions (tradie_company_id, status)');

        DB::statement('ALTER TABLE tradie_subscriptions ADD COLUMN tradie_subscriptions_stripe_sub_unique_guard TINYINT GENERATED ALWAYS AS (CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX tradie_subscriptions_stripe_sub_unique (stripe_subscription_id, tradie_subscriptions_stripe_sub_unique_guard)');

        DB::statement("ALTER TABLE tradie_subscriptions ADD COLUMN tradie_subs_one_active_per_company_guard TINYINT GENERATED ALWAYS AS (CASE WHEN status IN ('active', 'past_due') THEN 1 ELSE NULL END) VIRTUAL, ADD UNIQUE INDEX tradie_subs_one_active_per_company (tradie_company_id, tradie_subs_one_active_per_company_guard)");
    }

    public function down(): void
    {
        Schema::dropIfExists('tradie_subscriptions');
    }
};
