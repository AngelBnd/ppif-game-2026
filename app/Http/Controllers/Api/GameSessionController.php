<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameSessionController extends Controller
{
    /**
     * POST /api/game-sessions/start
     * Memulai sesi permainan baru.
     */
    public function start(Request $request): JsonResponse
    {
        // TODO: implement
    }

    /**
     * POST /api/game-sessions/{sessionId}/finish
     * Mengakhiri sesi permainan dan menyimpan skor.
     */
    public function finish(Request $request, int $sessionId): JsonResponse
    {
        // TODO: implement
    }
}
