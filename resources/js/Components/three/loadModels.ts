import { AnimationMixer, LoopRepeat, Mesh, Object3D, Scene } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Loads a GLB, adds it to the scene, and starts its first animation clip on a
 * loop (pushing the mixer so the render loop can update it). `onLoaded` runs
 * with the loaded root for any per-model setup (layers, refs, etc.).
 */
export function loadAnimatedModel(
    loader: GLTFLoader,
    url: string,
    scene: Scene,
    mixers: AnimationMixer[],
    onLoaded?: (root: Object3D) => void,
) {
    loader.load(
        url,
        (gltf) => {
            const root = gltf.scene;

            root.traverse((child) => {
                if (child instanceof Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(root);

            if (gltf.animations.length > 0) {
                const mixer = new AnimationMixer(root);
                const action = mixer.clipAction(gltf.animations[0]);
                action.setLoop(LoopRepeat, Infinity);
                action.play();
                mixers.push(mixer);
            } else {
                console.warn(`[model] ${url} loaded but no animations found`);
            }

            onLoaded?.(root);
        },
        undefined,
        (err) => console.error(`[model] failed to load ${url}`, err),
    );
}
