<?php

namespace Tests\Feature;

use App\Models\GameSession;
use App\Models\Player;
use App\Models\Step;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The boss fight is paced by the PIC: every phase - including the first -
 * stays paused until they press START on the monitor.
 */
class BossPhaseGateTest extends TestCase
{
    use RefreshDatabase;

    private User $pic;

    private GameSession $session;

    private Player $player;

    protected function setUp(): void
    {
        parent::setUp();

        $storyStep = Step::create([
            'order' => 1, 'slug' => 'prologue', 'type' => 'story', 'title' => 'Prologue',
        ]);

        Step::create([
            'order' => 2, 'slug' => 'boss-fight', 'type' => 'boss', 'title' => 'Boss Fight',
        ]);

        $this->pic = User::factory()->create();

        $this->session = GameSession::create([
            'user_id' => $this->pic->id,
            'code' => '123456',
            'status' => 'active',
            'current_step_id' => $storyStep->id,
        ]);

        $team = Team::create(['game_session_id' => $this->session->id, 'name' => 'Stella']);

        $this->player = Player::create([
            'team_id' => $team->id,
            'nickname' => 'tester',
            'device_token' => 'token-abc',
            'joined_at' => now(),
        ]);
    }

    private function advanceToBoss(): void
    {
        $this->actingAs($this->pic)
            ->patchJson("/api/admin/game-sessions/{$this->session->code}/advance")
            ->assertOk();

        $this->session->refresh();
    }

    private function tap(int $taps = 1)
    {
        return $this->postJson("/api/game-sessions/{$this->session->code}/boss/taps", [
            'device_token' => $this->player->device_token,
            'taps' => $taps,
        ]);
    }

    private function pressStart()
    {
        return $this->actingAs($this->pic)
            ->patchJson("/api/admin/game-sessions/{$this->session->code}/boss/start");
    }

    /**
     * Drains the running phase the way a room full of players would - in
     * batches spread over time. A single device cannot do it in one go: the
     * per-player tap allowance grows with elapsed phase time, so the test has
     * to let the clock move too. See BossFightController.
     */
    private function drainCurrentPhase(): void
    {
        $remaining = $this->session->refresh()->boss_hp;

        while ($remaining > 0) {
            $batch = min($remaining, 50);
            $this->tap($batch)->assertOk();
            $remaining -= $batch;

            if ($remaining > 0) {
                $this->travel(5)->seconds();
            }
        }
    }

    public function test_entering_the_boss_step_leaves_phase_one_paused(): void
    {
        $this->advanceToBoss();

        $this->assertNull($this->session->boss_phase_started_at);
        $this->assertSame(1, $this->session->boss_phase);

        $this->tap()->assertStatus(409);
    }

    public function test_pic_start_press_un_pauses_the_phase(): void
    {
        $this->advanceToBoss();

        $this->pressStart()->assertOk();
        $this->assertNotNull($this->session->refresh()->boss_phase_started_at);

        $this->tap(5)->assertOk();
        $this->assertSame(GameSession::BOSS_PHASE_MAX_HP[1] - 5, $this->session->refresh()->boss_hp);
    }

    public function test_clearing_a_phase_pauses_the_fight_again(): void
    {
        $this->advanceToBoss();
        $this->pressStart();

        $this->drainCurrentPhase();

        $this->session->refresh();
        $this->assertSame(2, $this->session->boss_phase);
        $this->assertSame(GameSession::BOSS_PHASE_MAX_HP[2], $this->session->boss_hp);
        $this->assertNull($this->session->boss_phase_started_at);

        // Phase 2 is inert until the PIC presses START a second time.
        $this->tap()->assertStatus(409);

        $this->pressStart()->assertOk();
        $this->tap()->assertOk();
    }

    public function test_start_is_idempotent_and_does_not_restart_the_clock(): void
    {
        $this->advanceToBoss();

        $this->pressStart()->assertOk();
        $startedAt = $this->session->refresh()->boss_phase_started_at;

        $this->travel(2)->seconds();
        $this->pressStart()->assertOk();

        $this->assertTrue($startedAt->equalTo($this->session->refresh()->boss_phase_started_at));
    }

    public function test_only_the_owning_pic_can_start_a_phase(): void
    {
        $this->advanceToBoss();

        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->patchJson("/api/admin/game-sessions/{$this->session->code}/boss/start")
            ->assertStatus(403);

        $this->assertNull($this->session->refresh()->boss_phase_started_at);
    }

    public function test_start_is_rejected_outside_the_boss_step(): void
    {
        $this->pressStart()->assertStatus(422);

        $this->assertNull($this->session->refresh()->boss_phase_started_at);
    }

    /**
     * The per-request `max:50` never bounded how many requests arrived, so a
     * scripted loop could drain every phase the instant the step opened.
     */
    public function test_a_tap_flood_is_cut_off_by_the_per_player_allowance(): void
    {
        $this->advanceToBoss();
        $this->pressStart();

        // 50 is both the per-request ceiling and the entire burst allowance
        // at t=0, so the very next request has nothing left to spend.
        $this->tap(50)->assertOk();
        $this->tap(50)->assertStatus(429);

        $this->assertSame(
            GameSession::BOSS_PHASE_MAX_HP[1] - 50,
            $this->session->refresh()->boss_hp,
            'Taps rejected by the allowance must not reach the boss.',
        );
    }

    public function test_the_tap_allowance_grows_back_with_elapsed_phase_time(): void
    {
        $this->advanceToBoss();
        $this->pressStart();

        $this->tap(50)->assertOk();
        $this->tap(50)->assertStatus(429);

        // A real player who briefly ran ahead of the allowance is back in
        // budget shortly after, rather than being shut out of the phase.
        $this->travel(10)->seconds();

        $this->tap(50)->assertOk();
    }

    /**
     * The allowance is per player, not per room - one device burning through
     * its own budget must not eat into anyone else's.
     */
    public function test_the_tap_allowance_is_tracked_per_player(): void
    {
        $teammate = Player::create([
            'team_id' => $this->player->team_id,
            'nickname' => 'teammate',
            'device_token' => 'token-def',
            'joined_at' => now(),
        ]);

        $this->advanceToBoss();
        $this->pressStart();

        $this->tap(50)->assertOk();
        $this->tap(50)->assertStatus(429);

        $this->postJson("/api/game-sessions/{$this->session->code}/boss/taps", [
            'device_token' => $teammate->device_token,
            'taps' => 50,
        ])->assertOk();

        $this->assertSame(
            GameSession::BOSS_PHASE_MAX_HP[1] - 100,
            $this->session->refresh()->boss_hp,
        );
    }

    /**
     * A new phase starts every player's tally from scratch, so clearing one
     * phase can't leave the room throttled going into the next.
     */
    public function test_each_phase_gets_a_fresh_tap_tally(): void
    {
        $this->advanceToBoss();
        $this->pressStart();

        $this->drainCurrentPhase();
        $this->pressStart();

        // Straight back to a full burst allowance on the new phase.
        $this->tap(50)->assertOk();

        $this->assertSame(
            GameSession::BOSS_PHASE_MAX_HP[2] - 50,
            $this->session->refresh()->boss_hp,
        );
    }
}
