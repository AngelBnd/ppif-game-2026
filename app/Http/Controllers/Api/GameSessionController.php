<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\PlayerJoined;
use App\Http\Resources\GameSessionResource;
use App\Models\GameSession;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GameSessionController extends Controller
{
    public function show(string $code)
    {
        $session = GameSession::where('code', $code)
            ->with(['teams.players', 'currentStep'])
            ->firstOrFail();

        return new GameSessionResource($session);
    }

    public function join(Request $request, string $code)
    {
        $validated = $request->validate([
            'team_id' => ['required', 'integer'],
        ]);

        $session = GameSession::where('code', $code)->firstOrFail();

        [$player, $team] = DB::transaction(function () use ($session, $validated) {
            // Lock the team row so two devices tapping the same team at the
            // same time can't both slip into the last slot.
            $team = Team::where('id', $validated['team_id'])
                ->where('game_session_id', $session->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_if(
                $team->players()->count() >= GameSession::MAX_PLAYERS_PER_TEAM,
                409,
                'Kelompok ini sudah penuh.',
            );

            $player = $team->players()->create([
                'device_token' => (string) Str::uuid(),
                'joined_at' => now(),
            ]);

            return [$player, $team];
        });

        $session = $session->fresh(['teams.players', 'currentStep']);
        event(new PlayerJoined($session));

        return response()->json([
            'device_token' => $player->device_token,
            'player' => ['id' => $player->id],
            'team' => ['id' => $team->id, 'name' => $team->name],
            'game_session' => new GameSessionResource($session),
        ], 201);
    }
}
