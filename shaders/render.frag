precision highp float;
varying vec2 vUv;

uniform sampler2D uState;
uniform float uThreshold;
uniform float uDelta;


void main() {
    vec2 ab = texture2D(uState, vUv).xy;
    float A = ab.x;
    float B = ab.y;

    // Visualize B field mostly
    float t = 1.0 - clamp(B, 0.0, 1.0);
    float bw = smoothstep(uThreshold - uDelta, uThreshold + uDelta, t);
    gl_FragColor = vec4(vec3(bw), 1.0);
}
