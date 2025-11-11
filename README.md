# Animated Gray-Scott Reaction-Diffusion

A real-time WebGL implementation of the Gray-Scott reaction-diffusion system with Perlin noise-driven parameter animation. Watch organic patterns continuously evolve through parameter space, creating an ever-changing display of emergent complexity.

[reaction-diffusion demo](./demo.webm)

## Features

- **Real-time GPU simulation** using Three.js and WebGL fragment shaders
- **Perlin noise animation** smoothly varies parameters over time for organic evolution
- **Coupled parameter system** keeps feed/kill rates balanced on the "interesting diagonal band"
- **Interactive seeding** via click-and-drag to inject new patterns
- **Canvas recording** with keyboard shortcut (press R) to capture high-quality video
- **High-performance ping-pong rendering** with float/half-float textures

## How It Works

### The Gray-Scott Model

The simulation implements the Gray-Scott reaction-diffusion equations:

```
∂A/∂t = dA·∇²A - AB² + f(1-A)
∂B/∂t = dB·∇²B + AB² - (k+f)B
```

Where:
- **A** and **B** are two chemical concentrations
- **dA** and **dB** are diffusion rates
- **f** (feed) is the rate of A being fed into the system
- **k** (kill) is the rate of B being removed
- **∇²** is the Laplacian operator (diffusion)

Different combinations of feed and kill parameters produce dramatically different patterns: spots, stripes, spirals, chaos, and more.

### Animated Parameters

Instead of static parameters, this implementation uses **Perlin noise** to smoothly vary values over time:

1. **Feed Rate** - Primary varying parameter (0.015 to 0.06)
2. **Kill Rate** - Calculated from feed using a band formula: `k = 0.055 + 0.5(f - 0.03) + offset`
   - This keeps parameters in the "interesting region" where complex patterns form
   - Small independent noise offset (±0.0035) adds micro-variations
3. **Diffusion Rates** (optional) - dA and dB can vary while maintaining a 2:1 ratio

This creates continuous organic transitions between pattern types (Worms → Dots → Waves → Mitosis → etc.)

## Architecture

### Main Components

**`main.js`** - Core Three.js setup
- WebGL renderer with float textures
- Ping-pong render targets (1080×1080) for GPU state
- Scene management and animation loop
- Interactive brush system
- Canvas recording with MediaRecorder API

**`simulation.js`** - Parameter animation system
- `Parameter` class: Wraps Perlin noise generators for smooth value variation
- Band formula for coupled feed/kill parameters
- Updates shader uniforms each frame

**`shaders/`** - GLSL fragment shaders
- `pass.vert` - Minimal fullscreen vertex shader
- `init.frag` - Initialize simulation state (A=1, B=0 with center seed)
- `step.frag` - Gray-Scott equations with 9-tap Laplacian kernel
- `render.frag` - Visualize B concentration as black/white threshold

### Rendering Pipeline

1. **Initialization**: Render `init.frag` to create initial state (A everywhere, B in center square)
2. **Simulation loop**:
   - Run `step.frag` multiple times per frame (default: 30 steps)
   - Ping-pong between two render targets to preserve state
   - Update uniforms from Perlin noise parameters
3. **Presentation**: Render final state texture through `render.frag` to screen

## Usage

### Running Locally

```bash
# Serve the directory with any static file server
# For example with Python:
python -m http.server 8000

# Or with Node.js http-server:
npx http-server

# Then open http://localhost:8000 in your browser
```

### Interaction

- **Click and drag** to inject B chemical and seed new patterns
- **Press R** to start/stop recording (saves as WebM video)
- **Watch** as parameters smoothly evolve through pattern space
- **Check console** for current parameter values (logged every ~16 seconds)

### Customization

Edit `simulation.js` to adjust animation behavior:

```javascript
// Change feed rate range and speed
const feedParam = new Parameter(0.015, 0.06, 0.0010, "feed");
//                               min    max   speed

// Adjust kill offset variation
const killOffsetParam = new Parameter(-0.0035, 0.0035, 0.005, "killOffset");

// Modify band formula constants
const f0 = 0.03;     // Reference feed value
const k0 = 0.055;    // Reference kill value
const slope = 0.5;   // Kill response to feed changes
```

Edit `main.js` to change simulation resolution or speed:

```javascript
const SIM_W = 1080;  // Simulation width
const SIM_H = 1080;  // Simulation height
window.STEPS_PER_FRAME = 30;  // Evolution speed
```

## Technical Details

- **WebGL 2.0** with float/half-float textures for precision
- **Import maps** for CDN-based dependencies (Three.js, simplex-noise)
- **Ping-pong rendering** maintains simulation state across frames
- **9-tap Laplacian kernel** for accurate diffusion calculation
- **Perlin noise** via simplex-noise library for organic parameter evolution

## Pattern Types

Different feed/kill combinations create distinct patterns:

| Pattern | Feed | Kill | Description |
|---------|------|------|-------------|
| **Spots** | 0.022 | 0.051 | Small stable dots |
| **Stripes** | 0.026 | 0.055 | Wave-like patterns |
| **Worms** | 0.037 | 0.060 | Meandering lines |
| **Dots** | 0.040 | 0.065 | Larger stable circles |
| **Chaos** | 0.030 | 0.062 | Turbulent complexity |
| **Mitosis** | 0.014 | 0.054 | Dividing cells |

The animation system smoothly transitions between these regions automatically.

## Dependencies

- [Three.js](https://threejs.org/) - WebGL rendering library
- [simplex-noise](https://github.com/jwagner/simplex-noise.js) - Perlin noise generation

Both loaded via CDN import maps - no build step required!

## References

- [Gray-Scott Model](https://groups.csail.mit.edu/mac/projects/amorphous/GrayScott/) - Original mathematical model
- [Reaction-Diffusion Tutorial](https://www.karlsims.com/rd.html) - Karl Sims' excellent visual explanation
- [WebGL Reaction-Diffusion](https://pmneila.github.io/jsexp/grayscott/) - Interactive parameter explorer

## License

MIT License - Feel free to use, modify, and share!
