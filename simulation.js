import { createNoise2D } from 'simplex-noise';

class Parameter {
    constructor(lowerBound, upperBound, noiseSpeed, name) {
        this.lowerBound = lowerBound; 
        this.upperBound = upperBound;
        this.noiseSpeed = noiseSpeed;
        this.noise2D = createNoise2D();
        this.name = name;
    }

    get(cTime) {
        let time = cTime * this.noiseSpeed;
        const noiseValue = this.noise2D(time, 0);
        const delta = this.upperBound - this.lowerBound;
        const mappedValue = this.lowerBound + (noiseValue + 1) * 0.5 * delta;
        return mappedValue;
    }
}

function initSimulation() {
    console.log("simulation is ready to occur");
    console.log(window.stepMat);
    console.log(window.renderMat);

    // ===== Core simulation parameters =====
    // Primary varying parameter
    const feedParam = new Parameter(0.015, 0.06, 0.0010, "feed");

    // Small independent variation for kill
    const killOffsetParam = new Parameter(-0.0035, 0.0035, 0.005, "killOffset");

    // Diffusion rate (dA), dB will be calculated as dA/2.0
    const diffusionParam = new Parameter(1.0, 1.2, 0.001, "dA");

    // Optional: steps per frame (currently commented out)
    // const spfParam = new Parameter(1, 20, 0.2, "spf");

    let time = 0;
    const heartbeat = 1000;

    // Band formula constants (keeps feed/kill in interesting region)
    const f0 = 0.03;
    const k0 = 0.055;
    const slope = 0.5;

    // Calculate kill from feed using the "interesting band" formula
    function calculateKill(feed, offset = 0) {
        return k0 + slope * (feed - f0) + offset;
    }

    // Animate the feed parameter over time using Perlin noise
    function animate() {
        time += 1;

        // ===== Update core simulation parameters =====
        const customFeed = feedParam.get(time);
        const killOffset = killOffsetParam.get(time);
        const customKill = calculateKill(customFeed, killOffset);

        // Diffusion rates with fixed ratio
        const dA = diffusionParam.get(time);
        const dB = dA / 2.0;

        window.stepMat.uniforms.uFeed.value = customFeed;
        window.stepMat.uniforms.uKill.value = customKill;
        // window.stepMat.uniforms.uDA.value = dA;
        // window.stepMat.uniforms.uDB.value = dB;

        // Optional: vary steps per frame
        // window.STEPS_PER_FRAME = parseInt(spfParam.get(time));

        // Continue animation loop
        requestAnimationFrame(animate);

        // Debug logging
        if (time % heartbeat == 0) {
            console.log(
                "feed:", customFeed.toFixed(4),
                "kill:", customKill.toFixed(4),
                "dA:", dA.toFixed(3),
                "dB:", dB.toFixed(3)
            );
        }
    }

    // Start the animation
    animate();
}

if (window.renderMat && window.stepMat) {
    initSimulation();
} else {
    window.addEventListener('rd-ready', initSimulation, {once: true});
}


