import { Color, Vector2 } from 'three';

// Toony silhouette outline: reads codie2's alpha mask and paints a black
// border wherever a transparent pixel sits within uThickness px of codie2.
// This traces the camera-facing silhouette only (fills small concavities).
export const OutlineShader = {
    uniforms: {
        tDiffuse: { value: null as unknown },
        uResolution: { value: new Vector2(1, 1) }, // in CSS px
        uThickness: { value: 2.5 }, // outline thickness (CSS px)
        uColor: { value: new Color(0x000000) },
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        #define OUTLINE_SAMPLES 16
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uThickness;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
            vec4 c = texture2D(tDiffuse, vUv);

            // Inside codie2 — keep the (glitched) pixel untouched.
            if (c.a > 0.5) {
                gl_FragColor = c;
                return;
            }

            // Outside — outline if any opaque pixel is within uThickness.
            float a = 0.0;
            for (int i = 0; i < OUTLINE_SAMPLES; i++) {
                float ang = 6.2831853 * float(i) / float(OUTLINE_SAMPLES);
                vec2 off = vec2(cos(ang), sin(ang)) * uThickness / uResolution;
                a = max(a, texture2D(tDiffuse, vUv + off).a);
            }

            gl_FragColor = a > 0.5 ? vec4(uColor, 1.0) : vec4(0.0);
        }
    `,
};
