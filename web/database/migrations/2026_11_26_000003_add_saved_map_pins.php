<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['properties', 'tradie_companies'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->decimal('latitude', 9, 6)->nullable();
                $table->decimal('longitude', 9, 6)->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['properties', 'tradie_companies'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['latitude', 'longitude']));
        }
    }
};
