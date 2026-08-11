import { Object3D, PerspectiveCamera } from 'three';

// ---- Train fly-by config (tune here) ------------------------------------
// Each train slides across X, then parks off-screen and waits a random
// MIN..MAX seconds before sliding through again. trainLeft moves toward +X,
// trainRight toward -X. The two run on independent timers (async).
const TRAIN_LEFT_START_X = -20; // parked off-screen; slides toward +X
const TRAIN_LEFT_END_X = 400; // resets once X passes this
const TRAIN_LEFT_SPEED = 90; // units per second

const TRAIN_RIGHT_START_X = 20; // parked off-screen; slides toward -X
const TRAIN_RIGHT_END_X = -400; // resets once X passes this
const TRAIN_RIGHT_SPEED = 90; // units per second

const TRAIN_MIN_WAIT = 5; // seconds between passes (min)
const TRAIN_MAX_WAIT = 10; // seconds between passes (max)

// Horn audio distances (world units, camera→train):
//  - within FULL: plays at full volume
//  - between FULL and DISTANCE: eases out toward silence
//  - beyond DISTANCE: silent (also the trigger radius)
const TRAIN_SOUND_FULL = 60;
const TRAIN_SOUND_DISTANCE = 100;
const TRAIN_MAX_VOLUME = 0.2; // peak horn volume (0..1)

const randomWaitMs = () =>
    (TRAIN_MIN_WAIT + Math.random() * (TRAIN_MAX_WAIT - TRAIN_MIN_WAIT)) * 1000;

// Eased 0→1 progress for a train pass: slow in, slow out.
const easeInOut = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export type TrainState = {
    object: Object3D | null;
    startX: number;
    endX: number;
    speed: number; // average world units per second (with easing)
    idle: boolean;
    elapsed: number; // seconds into the current pass
    resumeAt: number; // performance.now() timestamp to resume at
    audio: HTMLAudioElement; // horn sound for this train
    soundPlayed: boolean; // fired once per pass
    minDist: number; // closest camera distance reached this pass
};

const makeTrainAudio = () => {
    const audio = new Audio('/audio/train.mp3');
    audio.preload = 'auto';
    return audio;
};

const createTrain = (cfg: {
    startX: number;
    endX: number;
    speed: number;
}): TrainState => ({
    object: null,
    startX: cfg.startX,
    endX: cfg.endX,
    speed: cfg.speed,
    idle: true,
    elapsed: 0,
    resumeAt: 0,
    audio: makeTrainAudio(),
    soundPlayed: false,
    minDist: Infinity,
});

/** Creates the two independent train controllers. */
export const createTrains = () => ({
    trainLeft: createTrain({
        startX: TRAIN_LEFT_START_X,
        endX: TRAIN_LEFT_END_X,
        speed: TRAIN_LEFT_SPEED,
    }),
    trainRight: createTrain({
        startX: TRAIN_RIGHT_START_X,
        endX: TRAIN_RIGHT_END_X,
        speed: TRAIN_RIGHT_SPEED,
    }),
});

/** Binds a loaded model to a train and parks it off-screen with an initial delay. */
export const initTrain = (state: TrainState, object: Object3D) => {
    state.object = object;
    object.position.x = state.startX;
    // Independent initial delay so the two trains start out of sync.
    state.idle = true;
    state.resumeAt = performance.now() + randomWaitMs();
};

/** Parks a train off-screen and silences it (used on pages where it shouldn't run). */
export const parkTrain = (state: TrainState) => {
    if (state.object) state.object.position.x = state.startX;
    state.idle = true;
    state.soundPlayed = false;
    state.audio.pause();
    // Fresh delay so it doesn't fire the instant we return to an allowed page.
    state.resumeAt = performance.now() + randomWaitMs();
};

/** Advances a train one frame: eased motion + distance-based horn volume. */
export const updateTrain = (
    state: TrainState,
    camera: PerspectiveCamera,
    now: number,
    delta: number,
) => {
    const obj = state.object;
    if (!obj) return;

    if (state.idle) {
        if (now >= state.resumeAt) {
            state.idle = false;
            state.elapsed = 0;
            obj.position.x = state.startX;
            state.soundPlayed = false;
        }
        return;
    }

    // Eased pass from startX → endX. speed sets the average pace, so the
    // duration scales with the distance travelled.
    state.elapsed += delta;
    const span = state.endX - state.startX;
    const duration = Math.abs(span) / state.speed;
    const t = Math.min(state.elapsed / duration, 1);
    obj.position.x = state.startX + span * easeInOut(t);

    // Horn: fires once as the train enters range, stays at full volume
    // within FULL, then eases out toward silence as it recedes.
    const camDist = obj.position.distanceTo(camera.position);
    state.minDist = Math.min(state.minDist, camDist);

    if (!state.soundPlayed && camDist < TRAIN_SOUND_DISTANCE) {
        state.audio.currentTime = 0;
        state.audio.volume = TRAIN_MAX_VOLUME;
        state.audio
            .play()
            .catch((e) => console.warn('[train] audio blocked:', e));
        state.soundPlayed = true;
    }
    if (state.soundPlayed) {
        const fade =
            camDist <= TRAIN_SOUND_FULL
                ? 1
                : 1 -
                  (camDist - TRAIN_SOUND_FULL) /
                      (TRAIN_SOUND_DISTANCE - TRAIN_SOUND_FULL);
        state.audio.volume =
            easeInOut(Math.max(0, Math.min(1, fade))) * TRAIN_MAX_VOLUME;
    }

    if (t >= 1) {
        console.log(
            '[train] pass done — closest dist',
            state.minDist.toFixed(1),
        );
        state.minDist = Infinity;
        obj.position.x = state.startX; // park off-screen
        state.idle = true;
        state.resumeAt = now + randomWaitMs();
        state.soundPlayed = false;
    }
};
