<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every boss phase now waits for the PIC to press START before players
     * can tap - null means "phase is armed but not running yet".
     */
    public function up(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            $table->timestamp('boss_phase_started_at')->nullable()->after('boss_hp');
        });
    }

    public function down(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            $table->dropColumn('boss_phase_started_at');
        });
    }
};
