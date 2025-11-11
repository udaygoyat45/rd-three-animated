precision highp float;
varying vec2 vUv;

uniform vec2  uResolution;
uniform vec2  uSeedCenter;   // normalized [0,1]
uniform float uSeedRadius;   // in normalized units (0..0.5)

void main() {
  // Start: A=1, B=0 everywhere
  float A = 1.0;
  float B = 0.0;

  // Seed a square of B in the center (or at uSeedCenter)
  vec2 d = abs(vUv - uSeedCenter);
  if (max(d.x, d.y) < uSeedRadius) {
    B = 1.0;
    A = 0.0;
  }

  gl_FragColor = vec4(A, B, 0.0, 1.0);
}
