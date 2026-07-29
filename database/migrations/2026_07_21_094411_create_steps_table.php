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
        Schema::create('steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('order');
            $table->string('slug')->unique();
            $table->enum('type', ['waiting', 'story', 'activity', 'answer', 'boss']);
            $table->string('title');
            $table->json('content')->nullable();
            $table->string('correct_answer')->nullable();
            $table->unsignedInteger('time_limit_seconds')->nullable();
            $table->timestamps();

            $table->index('order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('steps');
    }
};
