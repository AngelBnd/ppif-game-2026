<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            // The PIC-assigned group number (1-16) - null when no valid
            // group number was given and the team got a generic fallback
            // name instead. Distinct from `id`, which stays an ordinary
            // auto-increment PK shared across every session's teams.
            $table->unsignedTinyInteger('number')->nullable()->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('number');
        });
    }
};
