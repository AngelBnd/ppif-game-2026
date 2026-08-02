<?php

namespace Tests\Feature;

use App\Models\Answer;
use App\Models\GameSession;
use App\Models\Player;
use App\Models\Step;
use App\Models\StepProgress;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers the guarantees the player API has to enforce itself, because every
 * one of its routes is unauthenticated and the client can be replaced with
 * curl: the answer deadline, what the public step list is allowed to say,
 * code-scanning limits, and the PIC's ability to reclaim a squatted slot.
 */
class PlayerApiHardeningTest extends TestCase
{
    use RefreshDatabase;

    private User $pic;

    private GameSession $session;

    private Team $team;

    private Player $player;

    private Step $answerStep;

    protected function setUp(): void
    {
        parent::setUp();

        Step::create(['order' => 1, 'slug' => 'lobby', 'type' => 'waiting', 'title' => 'Lobby']);

        $this->answerStep = Step::create([
            'order' => 2,
            'slug' => 'answer-0',
            'type' => 'answer',
            'title' => 'Answer The Question 0',
            'content' => ['question' => 'Dimana?', 'opts' => ['Benar', 'Salah']],
            'correct_answer' => 'Benar',
            'time_limit_seconds' => 60,
        ]);

        $this->pic = User::factory()->create();

        $this->session = GameSession::create([
            'user_id' => $this->pic->id,
            'code' => '123456',
            'status' => 'active',
            'current_step_id' => $this->answerStep->id,
        ]);

        $this->team = Team::create(['game_session_id' => $this->session->id, 'name' => 'Stella']);

        $this->player = Player::create([
            'team_id' => $this->team->id,
            'nickname' => 'tester',
            'device_token' => 'token-abc',
            'joined_at' => now(),
        ]);

        StepProgress::create([
            'game_session_id' => $this->session->id,
            'step_id' => $this->answerStep->id,
            'activated_at' => now(),
        ]);
    }

    private function answer(string $text = 'Benar')
    {
        return $this->postJson("/api/game-sessions/{$this->session->code}/answers", [
            'device_token' => $this->player->device_token,
            'answer_text' => $text,
        ]);
    }

    public function test_an_answer_inside_the_time_limit_still_scores(): void
    {
        $this->travel(30)->seconds();

        $this->answer()->assertCreated()->assertJson(['is_correct' => true]);

        $this->assertSame(1, $this->team->refresh()->score);
    }

    /**
     * The countdown used to be the client's alone - the only real deadline
     * was the PIC pressing Next, so a team could let the visible timer run
     * out and still submit for the point.
     */
    public function test_an_answer_after_the_time_limit_is_rejected(): void
    {
        $this->travel(90)->seconds();

        $this->answer()->assertStatus(422);

        $this->assertSame(0, $this->team->refresh()->score);
        $this->assertDatabaseCount(Answer::class, 0);
    }

    /**
     * Steps are seeded without an explicit limit and the client falls back to
     * 60s, so the server has to use the same default or it enforces nothing.
     */
    public function test_the_default_time_limit_applies_to_a_step_without_one(): void
    {
        $this->answerStep->update(['time_limit_seconds' => null]);

        $this->travel(Step::DEFAULT_TIME_LIMIT_SECONDS + 30)->seconds();

        $this->answer()->assertStatus(422);
    }

    public function test_the_public_step_list_does_not_carry_questions_or_answers(): void
    {
        $body = $this->getJson('/api/steps')->assertOk()->json('data');

        $this->assertNotEmpty($body);

        foreach ($body as $step) {
            $this->assertArrayNotHasKey('content', $step);
            $this->assertArrayNotHasKey('correct_answer', $step);
        }

        // Still enough to route between steps and render the countdown.
        $this->assertSame(
            ['id', 'order', 'slug', 'type', 'title', 'time_limit_seconds'],
            array_keys($body[0]),
        );
    }

    public function test_the_active_question_still_reaches_the_player_via_the_session(): void
    {
        $this->getJson("/api/game-sessions/{$this->session->code}")
            ->assertOk()
            ->assertJsonPath('data.current_step.content.question', 'Dimana?')
            ->assertJsonMissingPath('data.current_step.correct_answer');
    }

    /**
     * Six-digit codes are a small space and this endpoint is unauthenticated,
     * so the budget for lookups that miss is what stops a scan finding a live
     * room. A real player hitting the code they were handed never spends it.
     */
    public function test_scanning_for_session_codes_is_cut_off(): void
    {
        for ($attempt = 0; $attempt < 20; $attempt++) {
            $this->getJson('/api/game-sessions/'.(200000 + $attempt))->assertStatus(404);
        }

        $this->getJson('/api/game-sessions/999999')->assertStatus(429);
    }

    public function test_a_valid_code_is_unaffected_by_the_scan_budget(): void
    {
        for ($attempt = 0; $attempt < 25; $attempt++) {
            $this->getJson('/api/game-sessions/'.(200000 + $attempt));
        }

        $this->getJson("/api/game-sessions/{$this->session->code}")->assertOk();
    }

    /**
     * Six digits was 900,000 possibilities against an unauthenticated
     * endpoint that returns a room's full state.
     */
    public function test_generated_codes_come_from_the_unambiguous_alphabet(): void
    {
        $codes = collect(range(1, 40))->map(fn () => GameSession::generateUniqueCode());

        foreach ($codes as $code) {
            $this->assertSame(GameSession::CODE_LENGTH, strlen($code));
            $this->assertSame(
                '',
                trim($code, GameSession::CODE_ALPHABET),
                "Code {$code} uses characters outside the alphabet.",
            );
        }

        // Nothing that gets misread off a projector: no 0/O, no 1/I/L.
        $this->assertSame(0, $codes->filter(fn ($code) => preg_match('/[01OIL]/', $code))->count());

        // And not a six-digit code wearing a new coat.
        $this->assertGreaterThan(30, $codes->unique()->count());
    }

    public function test_a_code_is_matched_regardless_of_the_case_it_was_typed_in(): void
    {
        $this->session->update(['code' => 'ABC234']);

        $this->getJson('/api/game-sessions/abc234')
            ->assertOk()
            ->assertJsonPath('data.code', 'ABC234');
    }

    /**
     * Recovery path for a squatted team slot - previously the only remedy was
     * destroying the whole session and reissuing its code mid-event.
     */
    public function test_the_owning_pic_can_remove_a_player(): void
    {
        $this->actingAs($this->pic)
            ->deleteJson("/api/admin/game-sessions/{$this->session->code}/players/{$this->player->id}")
            ->assertOk();

        $this->assertDatabaseMissing(Player::class, ['id' => $this->player->id]);
    }

    public function test_a_stranger_cannot_remove_a_player(): void
    {
        $this->actingAs(User::factory()->create())
            ->deleteJson("/api/admin/game-sessions/{$this->session->code}/players/{$this->player->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas(Player::class, ['id' => $this->player->id]);
    }

    public function test_a_pic_cannot_remove_a_player_from_another_session(): void
    {
        $other = GameSession::create([
            'user_id' => $this->pic->id,
            'code' => '654321',
            'status' => 'active',
            'current_step_id' => $this->answerStep->id,
        ]);

        $this->actingAs($this->pic)
            ->deleteJson("/api/admin/game-sessions/{$other->code}/players/{$this->player->id}")
            ->assertStatus(404);

        $this->assertDatabaseHas(Player::class, ['id' => $this->player->id]);
    }
}
