export type PlayerFlowStep = {
    id: string;
    type: "join" | "story" | "activity" | "answer" | "boss";
    title: string;
    slug: string;
    next: string | null;
    question?: string;
    correctAnswer?: string;
};

export const playerGameFlow: PlayerFlowStep[] = [
    {
        id: "join-room",
        type: "join",
        title: "Join Room",
        slug: "join-room",
        next: "prologue",
    },
    {
        id: "prologue",
        type: "story",
        title: "PROLOG",
        slug: "prologue",
        next: "answer-0",
    },
    {
        id: "answer-0",
        type: "answer",
        title: "Answer The Question",
        slug: "answer-0",
        next: "chapter-1",
        question: "Dimanakah resep antibiotik ditemukan?",
        correctAnswer: "Arsip kuno Light Universe",
    },
    {
        id: "chapter-1",
        type: "story",
        title: "CHAPTER 1: HOPE",
        slug: "chapter-1",
        next: "activity-1",
    },
    {
        id: "activity-1",
        type: "activity",
        title: "Activity 1",
        slug: "activity-1",
        next: "answer-1",
    },
    {
        id: "answer-1",
        type: "answer",
        title: "Answer The Question",
        slug: "answer-1",
        next: "chapter-2",
        question: "Apa yang terdengar di tengah-tengah kejanggalan dalam Universe Hope?",
        correctAnswer: "Titik-titik cahaya kecil",
    },
    {
        id: "chapter-2",
        type: "story",
        title: "CHAPTER 2: CHANGE",
        slug: "chapter-2",
        next: "activity-2",
    },
    {
        id: "activity-2",
        type: "activity",
        title: "Activity 2",
        slug: "activity-2",
        next: "answer-2",
    },
    {
        id: "answer-2",
        type: "answer",
        title: "Answer The Question",
        slug: "answer-2",
        next: "chapter-3",
        question: "Apa yang menjadi ciri-ciri dari Universe Change?",
        correctAnswer: "Terang dan damai",
    },
    {
        id: "chapter-3",
        type: "story",
        title: "CHAPTER 3: COMMITMENT",
        slug: "chapter-3",
        next: "activity-3",
    },
    {
        id: "activity-3",
        type: "activity",
        title: "Activity 3",
        slug: "activity-3",
        next: "answer-3",
    },
    {
        id: "answer-3",
        type: "answer",
        title: "Answer The Question",
        slug: "answer-3",
        next: "epilogue-1",
        question: "Apa yang dilakukan oleh bayang-bayang dalam Universe Commitment?",
        correctAnswer: "Answer 3 placeholder",
    },
    {
        id: "epilogue-1",
        type: "story",
        title: "EPILOG 1",
        slug: "epilogue-1",
        next: "boss-fight",
    },
    {
        id: "boss-fight",
        type: "boss",
        title: "Boss Fight",
        slug: "boss-fight",
        next: "epilogue-2",
    },
    {
        id: "epilogue-2",
        type: "story",
        title: "EPILOG 2",
        slug: "epilogue-2",
        next: "activity-4",
    },
    {
        id: "activity-4",
        type: "activity",
        title: "Activity 4",
        slug: "activity-4",
        next: null,
    },
];