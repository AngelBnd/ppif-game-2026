<?php

namespace Database\Seeders;

use App\Models\Step;
use Illuminate\Database\Seeder;

class StepSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $steps = [
            [
                'order' => 1,
                'slug' => 'lobby',
                'type' => 'waiting',
                'title' => 'Lobby',
            ],
            [
                'order' => 2,
                'slug' => 'prologue',
                'type' => 'story',
                'title' => 'PROLOG',
            ],
            [
                'order' => 3,
                'slug' => 'answer-0',
                'type' => 'answer',
                'title' => 'Answer The Question 0',
                'content' => ['question' => 'Dimanakah resep antibiotik ditemukan?'],
                'correct_answer' => 'Arsip kuno Light Universe',
            ],
            [
                'order' => 4,
                'slug' => 'chapter-1',
                'type' => 'story',
                'title' => 'CHAPTER 1: HOPE',
            ],
            [
                'order' => 5,
                'slug' => 'activity-1',
                'type' => 'activity',
                'title' => 'Activity 1',
            ],
            [
                'order' => 6,
                'slug' => 'answer-1',
                'type' => 'answer',
                'title' => 'Answer The Question 1',
                'content' => ['question' => 'Apa yang terdengar di tengah-tengah kejanggalan dalam Universe Hope?'],
                'correct_answer' => 'Titik-titik cahaya kecil',
            ],
            [
                'order' => 7,
                'slug' => 'chapter-2',
                'type' => 'story',
                'title' => 'CHAPTER 2: CHANGE',
            ],
            [
                'order' => 8,
                'slug' => 'activity-2',
                'type' => 'activity',
                'title' => 'Activity 2',
            ],
            [
                'order' => 9,
                'slug' => 'answer-2',
                'type' => 'answer',
                'title' => 'Answer The Question 2',
                'content' => ['question' => 'Apa yang menjadi ciri-ciri dari Universe Change?'],
                'correct_answer' => 'Terang dan damai',
            ],
            [
                'order' => 10,
                'slug' => 'chapter-3',
                'type' => 'story',
                'title' => 'CHAPTER 3: COMMITMENT',
            ],
            [
                'order' => 11,
                'slug' => 'activity-3',
                'type' => 'activity',
                'title' => 'Activity 3',
            ],
            [
                'order' => 12,
                'slug' => 'answer-3',
                'type' => 'answer',
                'title' => 'Answer The Question 3',
                'content' => ['question' => 'Apa yang dilakukan oleh bayang-bayang dalam Universe Commitment?'],
                // Carried over from the old hardcoded placeholder — still needs a real answer filled in.
                'correct_answer' => 'Answer 3 placeholder',
            ],
            [
                'order' => 13,
                'slug' => 'epilogue-1',
                'type' => 'story',
                'title' => 'EPILOG 1',
            ],
            [
                'order' => 14,
                'slug' => 'boss-fight',
                'type' => 'boss',
                'title' => 'Boss Fight',
            ],
            [
                'order' => 15,
                'slug' => 'epilogue-2',
                'type' => 'story',
                'title' => 'EPILOG 2',
            ],
            [
                'order' => 16,
                'slug' => 'activity-4',
                'type' => 'activity',
                'title' => 'Activity 4',
            ],
        ];

        foreach ($steps as $step) {
            Step::updateOrCreate(['slug' => $step['slug']], $step);
        }
    }
}
