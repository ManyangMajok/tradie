<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->foreignId('selected_tradie_company_id')->nullable()->constrained('tradie_companies');
        });
    }

    public function down(): void
    {
        Schema::table('jobs', fn (Blueprint $table) => $table->dropConstrainedForeignId('selected_tradie_company_id'));
    }
};
