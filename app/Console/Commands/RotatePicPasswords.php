<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Rotating credentials used to mean editing the seeder's shared literal and
 * re-running db:seed, which reset every account to the same password. This
 * gives each account its own, without touching game data.
 */
class RotatePicPasswords extends Command
{
    protected $signature = 'pic:rotate-passwords
        {email?* : Only rotate these accounts (defaults to all)}';

    protected $description = 'Issue a fresh random password to each PIC/admin account and print it once';

    public function handle(): int
    {
        $emails = $this->argument('email');

        $users = User::query()
            ->when($emails !== [], fn ($query) => $query->whereIn('email', $emails))
            ->orderBy('id')
            ->get();

        if ($users->isEmpty()) {
            $this->error('No matching accounts found.');

            return self::FAILURE;
        }

        if (! $this->confirm("Rotate the password of {$users->count()} account(s)? Anyone holding the old ones is locked out immediately.", false)) {
            return self::FAILURE;
        }

        $rotated = [];

        foreach ($users as $user) {
            $password = Str::password(20, symbols: false);

            $user->password = $password;
            $user->save();

            $rotated[] = [$user->email, $user->name, $password];
        }

        $this->warn('Copy these now - they are hashed on save and cannot be recovered.');
        $this->table(['Email', 'Name', 'New password'], $rotated);
        $this->warn('Hand them out per-PIC out of band, then clear this terminal.');

        return self::SUCCESS;
    }
}
