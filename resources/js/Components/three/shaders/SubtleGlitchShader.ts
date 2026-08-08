// Subtle, self-contained glitch: tiny chromatic aberration + faint per-row
// jitter. Offsets stay small so codie2's pixels never smear across the screen.
export const SubtleGlitchShader = {
    uniforms: {
        tDiffuse: { value: null as unknown },
        uAmount: { value: 0 }, // displacement strength (UV units)
        uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float uAmount;
        uniform float uTime;
        varying vec2 vUv;

        float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;

            // Per-row horizontal jitter, kept tiny so it never smears.
            float row = floor(uv.y * 90.0);
            float jitter = (rand(vec2(row, floor(uTime * 12.0))) - 0.5) * uAmount;
            uv.x += jitter;

            // Chromatic aberration.
            float shift = uAmount * 0.6;
            float r = texture2D(tDiffuse, uv + vec2(shift, 0.0)).r;
            vec4 g = texture2D(tDiffuse, uv);
            float b = texture2D(tDiffuse, uv - vec2(shift, 0.0)).b;

            gl_FragColor = vec4(r, g.g, b, g.a);
        }
    `,
};
