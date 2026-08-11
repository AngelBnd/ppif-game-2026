<?php

namespace App\Http\Controllers\Api;

use App\Events\PlayerJoined;
use App\Events\PlayerLeft;
use App\Http\Controllers\Controller;
use App\Http\Resources\GameSessionResource;
use App\Models\GameSession;
use App\Models\Player;
use App\Models\Team;
use App\Rules\CleanNickname;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class GameSessionController extends Controller
{
    /**
     * Failed code lookups allowed per IP per minute.
     *
     * This endpoint is unauthenticated and hands back a room's full state, so
     * it is the obvious place to go looking for a live session. The real
     * defence against that is the size of the code space (see
     * GameSession::CODE_ALPHABET); this is a speed bump on top, and it is
     * charged only against lookups that miss. Gating successful ones too
     * would be worse than the problem: the whole room is behind the venue's
     * public IP, so one person probing - or just fat-fingering their code -
     * would lock every other player out of joining.
     */
    private const MAX_FAILED_LOOKUPS_PER_MINUTE = 20;

    public function show(Request $request, string $code)
    {
        $session = GameSession::whereCode($code)
            ->with(['teams.players', 'currentStep'])
            ->first();

        if (! $session) {
            $probeKey = 'session-probe:'.$request->ip();

            abort_if(
                RateLimiter::tooManyAttempts($probeKey, self::MAX_FAILED_LOOKUPS_PER_MINUTE),
                429,
                'Terlalu banyak kode yang salah. Tunggu sebentar lalu coba lagi.',
            );

            RateLimiter::hit($probeKey, 60);

            abort(404, 'Not found.');
        }

        return new GameSessionResource($session);
    }

    public function join(Request $request, string $code)
    {
        $validated = $request->validate([
            'team_id' => ['required', 'integer'],
            'nickname' => [
                'required',
                'string',
                'max:24',
                'regex:/^[\pL\pN ._-]+$/u',
                new CleanNickname,
            ],
        ]);

        $session = GameSession::whereCode($code)->firstOrFail();

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
                'nickname' => $validated['nickname'],
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

    /**
     * A player quitting of their own accord - removes their Player row
     * (freeing their slot under MAX_PLAYERS_PER_TEAM) rather than just
     * leaving a ghost occupying the team, and broadcasts so the admin's
     * headcount and other players update live.
     */
    public function leave(Request $request, string $code)
    {
        $validated = $request->validate([
            'device_token' => ['required', 'string'],
        ]);

        $session = GameSession::whereCode($code)->firstOrFail();

        $player = Player::where('device_token', $validated['device_token'])->firstOrFail();

        abort_unless(
            $player->team->game_session_id === $session->id,
            403,
            'This player does not belong to this session.',
        );

        $player->delete();

        $session = $session->fresh(['teams.players', 'currentStep']);
        event(new PlayerLeft($session));

        return response()->noContent();
    }
}
