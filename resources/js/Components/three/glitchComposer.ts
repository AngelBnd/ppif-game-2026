import { Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { SubtleGlitchShader } from './shaders/SubtleGlitchShader';

// codie2 lives on its own render layer so post-processing only affects it,
// not the whole scene.
export const GLITCH_LAYER = 1;

/**
 * Builds the selective post-processing composer for codie2. It renders ONLY
 * layer-1 objects (codie2) on a transparent background, glitches them, outlines
 * the silhouette, then composites the result over the normally-rendered scene.
 *
 * Returns the composer plus the passes the render loop needs to drive/resize.
 */
export function createGlitchComposer(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
) {
    const composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const codieRenderPass = new RenderPass(
        scene,
        camera,
        undefined,
        new Color(0x000000),
        0, // transparent clear so only codie2's pixels survive
    );
    composer.addPass(codieRenderPass);

    // Subtle, self-contained glitch on codie2 (no full-screen smear).
    const subtleGlitch = new ShaderPass(SubtleGlitchShader);
    composer.addPass(subtleGlitch);

    // Toony black silhouette outline around codie2.

    // Alpha-composite the glitched codie2 over the base scene.
    const overlayPass = new ShaderPass(CopyShader);
    overlayPass.material.transparent = true;
    overlayPass.material.depthTest = false;
    overlayPass.material.depthWrite = false;
    composer.addPass(overlayPass);

    return { composer, subtleGlitch };
}
