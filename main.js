import * as THREE from 'three';

// ---------- Tunables ----------
const SIM_W = 1080;
const SIM_H = 1080;

// Gray–Scott params (start with classic values)
const params = {
    dA: 1.0,
    dB: 0.5,
    feed: 0.055,   // f
    kill: 0.062,   // k
    dt: 1.0
};

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
let minLength = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth;
renderer.setSize(minLength, minLength);
renderer.debug.checkShaderErrors = true;
document.body.appendChild(renderer.domElement);

// Ensure float/half-float renderable
const gl = renderer.getContext();
const isWebGL2 = gl.getParameter(gl.VERSION).includes('WebGL 2.0');

if (!isWebGL2) {
    console.warn('WebGL2 is strongly recommended for float render targets.');
}

// ---------- Camera & Scenes ----------
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// One mesh with a fullscreen plane; we will swap materials for sim vs present
const quadGeom = new THREE.PlaneGeometry(2, 2);

// Scenes: simulation scene and present scene
const simScene = new THREE.Scene();
const presentScene = new THREE.Scene();

// ---------- Render Targets (ping-pong) ----------
const targetOpts = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    type: isWebGL2 ? THREE.HalfFloatType : THREE.FloatType,
    format: THREE.RGBAFormat,
    depthBuffer: false,
    stencilBuffer: false
};

let rtA = new THREE.WebGLRenderTarget(SIM_W, SIM_H, targetOpts);
let rtB = new THREE.WebGLRenderTarget(SIM_W, SIM_H, targetOpts);

// ---------- Materials (init, step, render) ----------
const loader = new THREE.FileLoader();
loader.setResponseType('text');

const [passVert, initFrag, stepFrag, renderFrag] = await Promise.all([
    fetch('./shaders/pass.vert').then(r => r.text()),
    fetch('./shaders/init.frag').then(r => r.text()),
    fetch('./shaders/step.frag').then(r => r.text()),
    fetch('./shaders/render.frag').then(r => r.text())
]);

const initMat = new THREE.ShaderMaterial({
    vertexShader: passVert,
    fragmentShader: initFrag,
    uniforms: {
        uResolution: { value: new THREE.Vector2(SIM_W, SIM_H) },
        uSeedCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uSeedRadius: { value: 0.06 }
    }
});

const stepMat = new THREE.ShaderMaterial({
    vertexShader: passVert,
    fragmentShader: stepFrag,
    uniforms: {
        uState: { value: rtA.texture },
        uTexel: { value: new THREE.Vector2(1 / SIM_W, 1 / SIM_H) },
        uDA: { value: params.dA },
        uDB: { value: params.dB },
        uFeed: { value: params.feed },
        uKill: { value: params.kill },
        uDt: { value: params.dt },
        uHasBrush: { value: 0 },
        uBrushPos: { value: new THREE.Vector2(0.5, 0.5) },
        uBrushRadius: { value: 0.03 },
        uBrushStrength: { value: 0.9 }
    }
});
window.stepMat = stepMat;


const renderMat = new THREE.ShaderMaterial({
    vertexShader: passVert,
    fragmentShader: renderFrag,
    uniforms: {
        uState: { value: rtA.texture },
        uThreshold: {value: 0.7},
        uDelta: {value: 0.05},
    }
});
window.renderMat = renderMat;
window.dispatchEvent(new Event('rd-ready'));

// Meshes for each scene
const simQuad = new THREE.Mesh(quadGeom, initMat);    // we’ll swap to stepMat after seeding
simScene.add(simQuad);

const presentQuad = new THREE.Mesh(quadGeom, renderMat);
presentScene.add(presentQuad);

// ---------- Initialization pass ----------
renderer.setRenderTarget(rtA);
renderer.render(simScene, ortho);
renderer.setRenderTarget(null);

// After init, set the sim material for subsequent steps
simQuad.material = stepMat;

// ---------- Interaction (brush) ----------
let brushActive = false;
function setBrushFromEvent(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // Note: vUv.y grows down, so invert y
    stepMat.uniforms.uBrushPos.value.set(x, 1.0 - y);
}

window.addEventListener('pointerdown', (e) => {
    brushActive = true;
    stepMat.uniforms.uHasBrush.value = 1;
    setBrushFromEvent(e);
});
window.addEventListener('pointermove', (e) => {
    if (!brushActive) return;
    setBrushFromEvent(e);
});
window.addEventListener('pointerup', () => {
    brushActive = false;
    stepMat.uniforms.uHasBrush.value = 0;
});
window.addEventListener('pointerleave', () => {
    brushActive = false;
    stepMat.uniforms.uHasBrush.value = 0;
});

// ---------- Resize ----------
function onResize() {
    let minLength = window.innerHeight;
    if (window.innerWidth < window.innerHeight) {
        minLength = window.innerWidth;
    }
    renderer.setSize(minLength, minLength);
}
window.addEventListener('resize', onResize);

// ---------- Simulation loop ----------
function simStep(readRT, writeRT) {
    stepMat.uniforms.uState.value = readRT.texture;
    renderer.setRenderTarget(writeRT);
    renderer.render(simScene, ortho);
    renderer.setRenderTarget(null);
}

window.STEPS_PER_FRAME = window.STEPS_PER_FRAME ?? 30;

function animate() {
    // Run several sim steps per frame for speed of evolution
    for (let i = 0; i < window.STEPS_PER_FRAME; i++) {
        simStep(rtA, rtB);
        // swap
        const tmp = rtA; rtA = rtB; rtB = tmp;
    }

    // Present to screen
    renderMat.uniforms.uState.value = rtA.texture;
    renderer.setRenderTarget(null);
    renderer.render(presentScene, ortho);

    requestAnimationFrame(animate);
}
animate();

// ---------- (Optional) tweak params live in console ----------
// Example:
//   params.feed = 0.037; stepMat.uniforms.uFeed.value = params.feed;
