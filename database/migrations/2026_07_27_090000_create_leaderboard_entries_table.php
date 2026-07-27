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
        Schema::create('leaderboard_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->unique()->constrained()->cascadeOnDelete();

            // Denormalized so the leaderboard can be read with a single
            // `SELECT ... ORDER BY score DESC` and no joins.
            $table->string('class_name')->nullable();
            $table->string('team_name');

            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('correct_answers')->default(0);
            $table->unsignedInteger('total_answers')->default(0);
            $table->unsignedBigInteger('total_response_time_ms')->default(0);
            $table->timestamp('last_answered_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaderboard_entries');
    }
};
