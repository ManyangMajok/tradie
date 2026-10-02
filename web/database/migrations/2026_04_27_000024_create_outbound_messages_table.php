<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outbound_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('template_key', 64);
            $table->string('recipient', 255);
            $table->string('subject', 255)->nullable();
            $table->text('body');
            $table->json('context')->nullable();
            $table->string('related_type', 64)->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->string('provider_message_id', 120)->nullable();
            $table->text('error_message')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('delivered_at')->nullable();
            $table->timestampTz('failed_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        DB::statement("ALTER TABLE outbound_messages ADD COLUMN channel ENUM('sms', 'email', 'push', 'in_app') NOT NULL");
        DB::statement("ALTER TABLE outbound_messages ADD COLUMN status ENUM('queued', 'sent', 'delivered', 'failed', 'bounced') NOT NULL DEFAULT 'queued'");

        DB::statement('CREATE INDEX outbound_messages_user_created_index ON outbound_messages (user_id, created_at DESC)');
        DB::statement('CREATE INDEX outbound_messages_related_index ON outbound_messages (related_type, related_id)');
        DB::statement('CREATE INDEX outbound_messages_provider_message_id_index ON outbound_messages (provider_message_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('outbound_messages');
    }
};
