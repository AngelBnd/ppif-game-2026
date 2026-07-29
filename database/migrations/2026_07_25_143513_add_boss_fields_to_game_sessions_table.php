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
        Schema::table('game_sessions', function (Blueprint $table) {
            $table->unsignedTinyInteger('boss_phase')->default(1)->after('current_step_id');
            $table->unsignedInteger('boss_hp')->default(0)->after('boss_phase');
            $table->timestamp('boss_finished_at')->nullable()->after('boss_hp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            $table->dropColumn(['boss_phase', 'boss_hp', 'boss_finished_at']);
        });
    }
};
