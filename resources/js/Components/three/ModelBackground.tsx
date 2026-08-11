import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import {
    AmbientLight,
    AnimationMixer,
    BasicShadowMap,
    DirectionalLight,
    Fog,
    HemisphereLight,
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cameraPresets, type CameraPreset } from './cameraPresets';
import { createGlitchComposer, GLITCH_LAYER } from './glitchComposer';

type ModelBackgroundProps = {
    preset?: CameraPreset;
};

export default function ModelBackground({
    preset = 'home',
}: ModelBackgroundProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const cameraRef = useRef<PerspectiveCamera | null>(null);
    const lookAtRef = useRef(new Vector3(0, 0, 0));
    const presetRef = useRef(preset);
    const basePositionRef = useRef(new Vector3());
    const pointerRef = useRef({ x: 0, y: 0 });
    const mixersRef = useRef<AnimationMixer[]>([]);

    const canvas2 = document.createElement('canvas');
    canvas2.width = 300;
    canvas2.height = 1000;
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        const scene = new Scene();
        scene.fog = new Fog(0x0a0c0f, 6, 40);

        const camera = new PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            100,
        );

        cameraRef.current = camera;
        const initialPreset = cameraPresets[preset];
        basePositionRef.current.set(...initialPreset.position);
        camera.position.copy(basePositionRef.current);
        lookAtRef.current.set(...initialPreset.lookAt);
        camera.lookAt(lookAtRef.current);

        const renderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 1);

        // Hard shadows (unfiltered = crisp, aliased edges).
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = BasicShadowMap;

        container.appendChild(renderer.domElement);

        const { composer: glitchComposer, subtleGlitch } = createGlitchComposer(
            renderer,
            scene,
            camera,
        );

        // Fill lights at 0 so shadowed surfaces receive no light → pure black
        // shadows. (Raise these slightly to lift the darkness if it's too much.)
        const ambientLight = new AmbientLight(0xffffff, 0);
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xfffcf5, 3);
        directionalLight.position.set(8, 4, -2);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(2048, 2048);
        // normalBias fixes self-shadow "acne" stripes (offsets the lookup along
        // the surface normal); tighter frustum = more depth precision too.
        directionalLight.shadow.bias = -0.0002;
        directionalLight.shadow.normalBias = 0.08;
        {
            const cam = directionalLight.shadow.camera;
            cam.near = 0.5;
            cam.far = 120;
            cam.left = -25;
            cam.right = 25;
            cam.top = 25;
            cam.bottom = -25;
            cam.updateProjectionMatrix();
        }
        scene.add(directionalLight);

        const hemisphereLight = new HemisphereLight(0x8899aa, 0x111111, 0);
        scene.add(hemisphereLight);

        // Lights must also touch the glitch layer so codie2 stays lit there.
        [ambientLight, directionalLight, hemisphereLight].forEach((light) =>
            light.layers.enable(GLITCH_LAYER),
        );

        // Models are Draco-compressed — attach the decoder (served from /draco).
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        loader.load('/models/bg.glb', (gltf) => {
            const model = gltf.scene;

            model.position.set(0, 0, 0);
            model.rotation.set(0, 0, 0);
            model.scale.set(1, 1, 1);

            // Names the ceiling might use — it must NOT cast, or it would block
            // the overhead light and shadow the whole interior.
            const CEILING_MATCH = /ceiling|roof|langit|atap|plafon|wall|/i;
            // The dark back wall — set this to its real name from the console
            // table. It gets self-lit (emissive) so it isn't pure black.
            const WALL_MATCH = /wall|dinding|tembok|tracks/i;
            const WALL_EMISSIVE = 0.5; // 0..1 self-light strength
            const bgMeshes: {
                name: string;
                material: string;
                casts: boolean;
            }[] = [];

            model.traverse((child) => {
                if (child instanceof Mesh) {
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    const matName = materials.map((m) => m.name).join(',');

                    const isCeiling =
                        CEILING_MATCH.test(child.name) ||
                        CEILING_MATCH.test(matName);
                    const isWall =
                        WALL_MATCH.test(child.name) || WALL_MATCH.test(matName);

                    child.castShadow = !isCeiling;
                    child.receiveShadow = true;

                    bgMeshes.push({
                        name: child.name,
                        material: matName,
                        casts: child.castShadow,
                    });

                    materials.forEach((material) => {
                        material.transparent = false;
                        material.opacity = 1;
                        material.depthWrite = true;

                        // Self-light the dark wall so it isn't pure black, while
                        // keeping its texture (route the map through emissiveMap).
                        if (
                            isWall &&
                            material instanceof MeshStandardMaterial
                        ) {
                            if (material.map) {
                                material.emissiveMap = material.map;
                                material.emissive.setScalar(1); // white → true colors
                            } else {
                                material.emissive.copy(material.color);
                            }
                            material.emissiveIntensity = WALL_EMISSIVE;
                        }

                        material.needsUpdate = true;
                    });
                }
            });

            scene.add(model);
        });

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            glitchComposer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Shared raycaster for codie2 hover + click. codie2 sits on the glitch
        // layer, so the raycaster must test that layer too.
        const raycaster = new Raycaster();
        raycaster.layers.enable(GLITCH_LAYER);
        const pointerNDC = new Vector2();

        const handlePointerMove = (e: PointerEvent) => {
            pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointerRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener('pointermove', handlePointerMove);

        let animationFrameId = 0;

        let lastTime = performance.now();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            const now = performance.now();
            lastTime = now;

            camera.position.copy(basePositionRef.current);

            renderer.autoClear = true;
            camera.layers.set(0);
            renderer.setRenderTarget(null);
            renderer.render(scene, camera);

            // Glitched codie2 (layer 1) composited on top.
            renderer.autoClear = false;
            camera.layers.set(GLITCH_LAYER);

            // Faint constant shimmer with occasional brief spikes.
            subtleGlitch.uniforms.uTime.value = now / 1000;
            subtleGlitch.uniforms.uAmount.value =
                0.0015 + (Math.random() < 0.02 ? Math.random() * 0.01 : 0);

            glitchComposer.render();

            camera.layers.set(0);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('pointermove', handlePointerMove);

            document.body.style.cursor = '';

            renderer.dispose();
            glitchComposer.dispose();
            dracoLoader.dispose();

            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        };
    }, []);

    useEffect(() => {
        presetRef.current = preset;

        const camera = cameraRef.current;
        if (!camera) return;

        const nextPreset = cameraPresets[preset];

        gsap.to(basePositionRef.current, {
            x: nextPreset.position[0],
            y: nextPreset.position[1],
            z: nextPreset.position[2],
            duration: 1.2,
            ease: 'power3.inOut',
        });

        gsap.to(lookAtRef.current, {
            x: nextPreset.lookAt[0],
            y: nextPreset.lookAt[1],
            z: nextPreset.lookAt[2],
            duration: 1.2,
            ease: 'power3.inOut',
        });
    }, [preset]);

    return (
        <div
            ref={containerRef}
            className="pointer-events-none fixed inset-0 z-0 opacity-70"
        />
    );
}
