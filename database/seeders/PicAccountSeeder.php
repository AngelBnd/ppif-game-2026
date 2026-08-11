<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PicAccountSeeder extends Seeder
{
    /**
     * Group pairs, each handled by one PIC account.
     */
    private const GROUP_PAIRS = [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
        [9, 10],
        [11, 12],
        [13, 14],
        [15, 16],
    ];

    /**
     * Passwords generated during this run, printed once at the end.
     *
     * @var array<int, array{0: string, 1: string}>
     */
    private array $generated = [];

    public function run(): void
    {
        $this->account('iniAkunAtmin@admin.com', 'Admin', true);

        foreach (self::GROUP_PAIRS as [$a, $b]) {
            $this->account("iniAkunBuatKel{$a}.{$b}@gmail.com", "PIC Kelompok {$a}/{$b}", false);
        }

        // Not tied to a real group pair - for testing the join/session flow
        // without touching a real PIC's account.
        $this->account('iniAkunTesting@gmail.com', 'PIC Testing', false);

        $this->report();
    }

    /**
     * Create the account if it doesn't exist yet, otherwise only refresh its
     * name/role. The password is deliberately write-once: re-running the
     * seeder before an event used to silently reset every PIC's password
     * back to a known literal, undoing any rotation done in the meantime.
     */
    private function account(string $email, string $name, bool $isAdmin): void
    {
        $user = User::firstOrNew(['email' => $email]);

        $user->name = $name;
        $user->is_admin = $isAdmin;

        if (! $user->exists) {
            $password = $this->newPassword();
            $user->password = $password;
            $user->email_verified_at = now();

            $this->generated[] = [$email, $password];
        }

        $user->save();
    }

    /**
     * PIC_SEED_PASSWORD lets an organizer set one known password for a batch
     * of fresh accounts (handy when onboarding PICs in a room together). With
     * it unset - the default - every account gets its own random password,
     * which is the safer option: no shared credential means a leaked login
     * can be traced to one PIC and revoked on its own.
     */
    private function newPassword(): string
    {
        $shared = env('PIC_SEED_PASSWORD');

        return is_string($shared) && $shared !== ''
            ? $shared
            : Str::password(20, symbols: false);
    }

    /**
     * Printed to the console only, never persisted - this is the single
     * chance to copy the generated passwords before they're gone.
     */
    private function report(): void
    {
        if (! $this->command) {
            return;
        }

        if ($this->generated === []) {
            $this->command->info('PicAccountSeeder: all accounts already existed, no passwords changed.');

            return;
        }

        $this->command->warn('New accounts created. Copy these credentials now - they are not stored anywhere and will not be shown again.');
        $this->command->table(['Email', 'Password'], $this->generated);
        $this->command->warn('Distribute them per-PIC out of band, and delete this terminal output afterwards.');
    }
}
