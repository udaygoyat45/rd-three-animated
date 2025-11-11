precision highp float;

varying vec2 vUv;

uniform sampler2D uState;   // RG: A,B
uniform vec2  uTexel;       // 1/width, 1/height
uniform float uDA;
uniform float uDB;
uniform float uFeed;        // f
uniform float uKill;        // k
uniform float uDt;

// Optional brush to inject B
uniform int   uHasBrush;
uniform vec2  uBrushPos;     // normalized [0,1]
uniform float uBrushRadius;  // normalized radius
uniform float uBrushStrength;

vec2 laplace(in sampler2D tex, vec2 uv) {
  // 9-tap kernel matching your p5 W:
  // center -1, N/S/E/W 0.2, diagonals 0.05
  vec2 A = vec2(0.0);
  vec2 off = uTexel;

  vec2 c  = texture2D(tex, uv).xy;
  vec2 n  = texture2D(tex, uv + vec2(0.0, -off.y)).xy;
  vec2 s  = texture2D(tex, uv + vec2(0.0,  off.y)).xy;
  vec2 e  = texture2D(tex, uv + vec2( off.x, 0.0)).xy;
  vec2 w  = texture2D(tex, uv + vec2(-off.x, 0.0)).xy;

  vec2 ne = texture2D(tex, uv + vec2( off.x, -off.y)).xy;
  vec2 nw = texture2D(tex, uv + vec2(-off.x, -off.y)).xy;
  vec2 se = texture2D(tex, uv + vec2( off.x,  off.y)).xy;
  vec2 sw = texture2D(tex, uv + vec2(-off.x,  off.y)).xy;

  vec2 lap = (n + s + e + w) * 0.2
           + (ne + nw + se + sw) * 0.05
           - c * 1.0;
  return lap;
}

void main() {
  vec2 ab = texture2D(uState, vUv).xy;
  float A = ab.x;
  float B = ab.y;

  vec2 d2 = laplace(uState, vUv);

  // Gray–Scott
  float AB2 = A * B * B;
  float dA = uDA * d2.x - AB2 + uFeed * (1.0 - A);
  float dB = uDB * d2.y + AB2 - (uKill + uFeed) * B;

  A += dA * uDt;
  B += dB * uDt;

  // Optional mouse brush: add B locally
  if (uHasBrush == 1) {
    float dist = distance(vUv, uBrushPos);
    float m = smoothstep(uBrushRadius, 0.0, dist); // 1 at center → 0 at edge
    B = clamp(B + m * uBrushStrength, 0.0, 1.0);
    A = clamp(A - m * uBrushStrength, 0.0, 1.0);
  }

  gl_FragColor = vec4(clamp(A,0.0,1.0), clamp(B,0.0,1.0), 0.0, 1.0);
}
