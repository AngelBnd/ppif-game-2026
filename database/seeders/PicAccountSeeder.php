<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class PicAccountSeeder extends Seeder
{
    /**
     * Group pairs, each handled by one PIC account.
     */
    private const GROUP_PAIRS = [
        [1, 2], [3, 4], [5, 6], [7, 8],
        [9, 10], [11, 12], [13, 14], [15, 16],
    ];

    private const PASSWORD = 'PPIFJaYa@2026';

    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'iniAkunAtmin@admin.com'],
            [
                'name' => 'Admin',
                'password' => self::PASSWORD,
                'is_admin' => true,
            ],
        );

        foreach (self::GROUP_PAIRS as [$a, $b]) {
            User::updateOrCreate(
                ['email' => "iniAkunBuatKel{$a}.{$b}@gmail.com"],
                [
                    'name' => "PIC Kelompok {$a}/{$b}",
                    'password' => self::PASSWORD,
                    'is_admin' => false,
                ],
            );
        }
    }
}
