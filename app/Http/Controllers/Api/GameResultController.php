<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameResultController extends Controller
{
    /**
     * GET /api/game-results/leaderboard
     * Mengambil daftar leaderboard berdasarkan skor tertinggi.
     */
    public function leaderboard(Request $request): JsonResponse
    {
        // TODO: implement
    }
}
