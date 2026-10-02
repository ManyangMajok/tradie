<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('path', 500);
            $table->string('mime', 64);
            $table->unsignedBigInteger('size_bytes');
            $table->string('caption', 200)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('job_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_images');
    }
};
