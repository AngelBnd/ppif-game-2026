<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CleanNickname implements ValidationRule
{
    /**
     * Coarse blocklist covering the common Indonesian/English cases - not an
     * exhaustive moderation system, just enough to stop the obvious abuse
     * the pentest flagged. Matched as whole words against a lowercased,
     * punctuation-stripped copy of the nickname.
     */
    private const BLOCKED_WORDS = [
        'anjing', 'anjir', 'asu', 'babi', 'bangsat', 'bego', 'goblok',
        'kontol', 'memek', 'ngentot', 'tolol', 'kampret', 'jancok', 'bajingan',
        'kimak', 'pepek', 'peju',
        'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy',
        'nigger', 'nigga', 'faggot', 'whore', 'slut', 'tits', 'boobs', 'porn',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        $normalized = preg_replace('/[^a-z0-9]+/', ' ', mb_strtolower($value));
        $words = array_filter(explode(' ', trim((string) $normalized)));

        if (array_intersect($words, self::BLOCKED_WORDS) !== []) {
            $fail('Nama panggilan mengandung kata yang tidak diperbolehkan.');
        }
    }
}
