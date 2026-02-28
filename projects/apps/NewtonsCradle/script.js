document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cradleCanvas');
    const ctx = canvas.getContext('2d');

    // ───────────────────── Configuration ─────────────────────
    let numBalls = 5;
    let ballRadius = 25;
    let gravityMultiplier = 1.0;
    let showTrails = true;
    let soundEnabled = false;
    let rodLength = 300;
    const collisionThreshold = 0.08;
    const collisionSoundDuration = 80;
    const restitution = 0.995;     // energy kept per collision
    let dampingLevel = 0;          // 0=low, 1=medium, 2=high
    const dampingValues = [0.9998, 0.999, 0.995];

    // ───────────────────── State ─────────────────────
    let balls = [];
    let particles = [];
    let trailPoints = [];
    let collisionsTimestamps = [];
    let currentCollisions = new Set();
    let selectedBall = null;
    let dragStartAngle = 0;
    let infoVisible = false;
    let settingsVisible = false;
    let hasInteracted = false;
    let dpr = 1;

    // Derived / recalculated on resize
    let startX, startY, spacing;

    // ───────────────────── Canvas sizing (DPR-aware) ─────────────────────
    function resize() {
        dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Auto-scale for small screens
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isMobile = vw < 600;
        const isLandscapeMobile = vh < 500;

        if (isLandscapeMobile) {
            rodLength = Math.min(200, vh * 0.38);
            if (ballRadius > 20) ballRadius = 20;
        } else if (isMobile) {
            rodLength = Math.min(380, vh * 0.50);
            if (ballRadius > 22) ballRadius = 22;
        } else {
            rodLength = 300;
        }

        recalcLayout();
    }

    function recalcLayout() {
        spacing = ballRadius * 2;
        startX = window.innerWidth / 2 - ((numBalls - 1) * spacing) / 2;
        const isMobile = window.innerWidth < 600;
        startY = isMobile ? window.innerHeight * 0.14 : window.innerHeight * 0.22;
    }

    resize();
    window.addEventListener('resize', () => {
        resize();
        // Reposition existing balls to new layout
        if (balls.length > 0) {
            for (let i = 0; i < balls.length; i++) {
                balls[i].originalX = startX + i * spacing;
                balls[i].originalY = startY;
                balls[i].x = balls[i].originalX + Math.sin(balls[i].angle) * rodLength;
                balls[i].y = balls[i].originalY + Math.cos(balls[i].angle) * rodLength;
            }
        }
    });

    // ───────────────────── Background gradient ─────────────────────
    let bgGradient;
    function buildBgGradient() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        bgGradient = ctx.createRadialGradient(
            w / 2, h * 0.45, 0,
            w / 2, h * 0.45, h * 0.9
        );
        bgGradient.addColorStop(0, '#141b2d');
        bgGradient.addColorStop(0.6, '#0d1117');
        bgGradient.addColorStop(1, '#080b10');
    }

    // ───────────────────── Ball class ─────────────────────
    class Ball {
        constructor(x, y, radius, index) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.angle = 0;
            this.velocity = 0;
            this.acceleration = 0;
            this.originalX = x;
            this.originalY = y;
            this.isDragging = false;
            this.index = index;
        }

        update() {
            const g = 0.001 * gravityMultiplier;
            this.acceleration = -g * Math.sin(this.angle);
            this.velocity += this.acceleration;
            this.velocity *= dampingValues[dampingLevel];
            this.angle += this.velocity;

            this.x = this.originalX + Math.sin(this.angle) * rodLength;
            this.y = this.originalY + Math.cos(this.angle) * rodLength;
        }

        draw() {
            const r = this.radius;

            // ── Shadow ──
            ctx.beginPath();
            ctx.ellipse(this.x, startY + rodLength * 1.18, r * 0.65, r * 0.18, 0, 0, Math.PI * 2);
            const shadow = ctx.createRadialGradient(
                this.x, startY + rodLength * 1.18, 0,
                this.x, startY + rodLength * 1.18, r * 0.9
            );
            shadow.addColorStop(0, 'rgba(0,0,0,0.35)');
            shadow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = shadow;
            ctx.fill();

            // ── Chrome ball ──
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);

            const grad = ctx.createRadialGradient(
                this.x - r * 0.35, this.y - r * 0.35, r * 0.05,
                this.x + r * 0.1, this.y + r * 0.1, r * 1.05
            );

            if (this.isDragging) {
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.25, '#dce6f0');
                grad.addColorStop(0.55, '#8aa4c8');
                grad.addColorStop(0.85, '#4a6a90');
                grad.addColorStop(1, '#2a3a50');
            } else {
                grad.addColorStop(0, '#f0f4f8');
                grad.addColorStop(0.2, '#c8d0da');
                grad.addColorStop(0.45, '#7a8a9a');
                grad.addColorStop(0.7, '#3a4550');
                grad.addColorStop(0.9, '#1a2028');
                grad.addColorStop(1, '#0e1418');
            }

            ctx.fillStyle = grad;
            ctx.fill();

            // Subtle ring highlight
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.stroke();

            // Specular highlight dot
            ctx.beginPath();
            ctx.arc(this.x - r * 0.28, this.y - r * 0.28, r * 0.18, 0, Math.PI * 2);
            const spec = ctx.createRadialGradient(
                this.x - r * 0.28, this.y - r * 0.28, 0,
                this.x - r * 0.28, this.y - r * 0.28, r * 0.22
            );
            spec.addColorStop(0, 'rgba(255,255,255,0.7)');
            spec.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = spec;
            ctx.fill();

            // Bottom ambient reflection
            ctx.beginPath();
            ctx.arc(this.x + r * 0.2, this.y + r * 0.3, r * 0.12, 0, Math.PI * 2);
            const ambient = ctx.createRadialGradient(
                this.x + r * 0.2, this.y + r * 0.3, 0,
                this.x + r * 0.2, this.y + r * 0.3, r * 0.15
            );
            ambient.addColorStop(0, 'rgba(88,166,255,0.15)');
            ambient.addColorStop(1, 'rgba(88,166,255,0)');
            ctx.fillStyle = ambient;
            ctx.fill();
        }

        containsPoint(px, py) {
            const dx = this.x - px;
            const dy = this.y - py;
            return dx * dx + dy * dy <= this.radius * this.radius;
        }
    }

    // ───────────────────── Spark particles ─────────────────────
    class Particle {
        constructor(x, y, velocity) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3 * velocity;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 1;
            this.life = 1.0;
            this.decay = 0.02 + Math.random() * 0.03;
            this.radius = 1 + Math.random() * 2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.05;      // gravity on particle
            this.vx *= 0.98;
            this.life -= this.decay;
        }

        draw() {
            if (this.life <= 0) return;
            const r = Math.max(0, this.radius * this.life);
            const alpha = this.life * 0.8;

            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(88, 166, 255, ${alpha * 0.2})`;
            ctx.fill();
        }

        get alive() {
            return this.life > 0;
        }
    }

    function spawnParticles(x, y, intensity) {
        const count = Math.min(20, Math.floor(6 + intensity * 12));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, intensity));
        }
    }

    // ───────────────────── Initialise balls ─────────────────────
    function initBalls() {
        balls = [];
        resize(); // ensure scale is correct for current viewport
        for (let i = 0; i < numBalls; i++) {
            const x = startX + i * spacing;
            const ball = new Ball(x, startY + rodLength, ballRadius, i);
            ball.originalX = x;
            ball.originalY = startY;
            balls.push(ball);
        }
        collisionsTimestamps = new Array(numBalls - 1).fill(0);
        trailPoints = [];
        particles = [];
    }

    initBalls();

    // ───────────────────── Draw helpers ─────────────────────
    function drawRod(ball) {
        ctx.beginPath();
        ctx.moveTo(ball.originalX, ball.originalY);
        ctx.lineTo(ball.x, ball.y);
        ctx.lineWidth = 1.5;
        const rodGrad = ctx.createLinearGradient(
            ball.originalX, ball.originalY,
            ball.x, ball.y
        );
        rodGrad.addColorStop(0, '#666');
        rodGrad.addColorStop(0.5, '#999');
        rodGrad.addColorStop(1, '#777');
        ctx.strokeStyle = rodGrad;
        ctx.stroke();
    }

    function drawFrame() {
        const pad = 50;
        const left = startX - pad;
        const right = startX + (numBalls - 1) * spacing + pad;
        const barH = 7;
        const pillarW = 6;
        const pillarH = 40;
        const capR = 5;

        // ── Top horizontal bar ──
        const barGrad = ctx.createLinearGradient(left, startY - barH, left, startY + barH);
        barGrad.addColorStop(0, '#606060');
        barGrad.addColorStop(0.3, '#b0b0b0');
        barGrad.addColorStop(0.5, '#d0d0d0');
        barGrad.addColorStop(0.7, '#b0b0b0');
        barGrad.addColorStop(1, '#606060');

        ctx.beginPath();
        roundRect(ctx, left, startY - barH, right - left, barH * 2, 4);
        ctx.fillStyle = barGrad;
        ctx.fill();

        // Thin highlight line on top edge
        ctx.beginPath();
        ctx.moveTo(left + 4, startY - barH + 1);
        ctx.lineTo(right - 4, startY - barH + 1);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();

        // ── Vertical pillars ──
        drawPillar(left + 10, startY + barH, pillarW, pillarH);
        drawPillar(right - 10 - pillarW, startY + barH, pillarW, pillarH);

        // ── Small mounting caps at pillar tops ──
        drawCap(left + 10 + pillarW / 2, startY + barH, capR);
        drawCap(right - 10 - pillarW / 2, startY + barH, capR);
    }

    function drawPillar(x, y, w, h) {
        const grad = ctx.createLinearGradient(x, y, x + w, y);
        grad.addColorStop(0, '#666');
        grad.addColorStop(0.3, '#b0b0b0');
        grad.addColorStop(0.5, '#ccc');
        grad.addColorStop(0.7, '#b0b0b0');
        grad.addColorStop(1, '#666');

        ctx.beginPath();
        roundRect(ctx, x, y, w, h, 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }

    function drawCap(cx, cy, r) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, r);
        grad.addColorStop(0, '#ddd');
        grad.addColorStop(0.6, '#999');
        grad.addColorStop(1, '#666');
        ctx.fillStyle = grad;
        ctx.fill();
    }

    function roundRect(c, x, y, w, h, r) {
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
    }

    function drawTrails() {
        if (!showTrails) return;

        // Collect current positions
        balls.forEach((ball, i) => {
            if (Math.abs(ball.velocity) > 0.001) {
                if (!trailPoints[i]) trailPoints[i] = [];
                trailPoints[i].push({ x: ball.x, y: ball.y, life: 1.0 });
                if (trailPoints[i].length > 20) trailPoints[i].shift();
            }
        });

        // Draw & decay
        trailPoints.forEach((pts, i) => {
            if (!pts) return;
            for (let j = pts.length - 1; j >= 0; j--) {
                pts[j].life -= 0.04;
                if (pts[j].life <= 0) { pts.splice(j, 1); continue; }
                ctx.beginPath();
                ctx.arc(pts[j].x, pts[j].y, ballRadius * pts[j].life * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(88, 166, 255, ${pts[j].life * 0.12})`;
                ctx.fill();
            }
        });
    }

    // ───────────────────── Collision handling ─────────────────────
    function handleCollisions() {
        const now = performance.now();
        currentCollisions.clear();

        for (let i = 0; i < balls.length - 1; i++) {
            const b1 = balls[i];
            const b2 = balls[i + 1];

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = ballRadius * 2;

            if (dist < minDist) {
                const nx = dx / dist;
                const ny = dy / dist;

                const v1 = b1.velocity * rodLength;
                const v2 = b2.velocity * rodLength;
                const relVel = (v2 - v1) * (Math.cos(b1.angle) * nx - Math.sin(b1.angle) * ny);

                if (relVel < -collisionThreshold) {
                    // Sound
                    if (!currentCollisions.has(i) && now - collisionsTimestamps[i] > collisionSoundDuration) {
                        if (soundEnabled) {
                            const vol = Math.min(1, Math.abs(relVel) * 0.5);
                            const snd = new Audio('./sounds/collision50ms2.mp3');
                            snd.volume = vol;
                            snd.play().catch(() => {});
                        }
                        collisionsTimestamps[i] = now;
                        currentCollisions.add(i);

                        // Particles at collision point
                        const cx = (b1.x + b2.x) / 2;
                        const cy = (b1.y + b2.y) / 2;
                        spawnParticles(cx, cy, Math.min(1, Math.abs(relVel) * 0.4));
                    }

                    // Position correction
                    const overlap = (minDist - dist) / 2;
                    b1.x -= overlap * nx;
                    b1.y -= overlap * ny;
                    b2.x += overlap * nx;
                    b2.y += overlap * ny;

                    // Velocity swap (equal mass)
                    const temp = b1.velocity;
                    b1.velocity = b2.velocity * restitution;
                    b2.velocity = temp * restitution;
                }
            }
        }
    }

    // ───────────────────── Drag & drop ─────────────────────
    function getEventPoint(e) {
        let cx, cy;
        if (e.touches && e.touches.length > 0) {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        } else {
            cx = e.clientX;
            cy = e.clientY;
        }
        const rect = canvas.getBoundingClientRect();
        return { x: cx - rect.left, y: cy - rect.top };
    }

    function handleStart(e) {
        // Close any open panel if tapping the canvas
        if (infoVisible || settingsVisible) {
            infoVisible = false;
            settingsVisible = false;
            document.querySelector('.info-panel').classList.remove('active');
            document.querySelector('.settings-panel').classList.remove('active');
            return; // consume the tap
        }

        if (!hasInteracted) {
            hasInteracted = true;
            document.querySelector('.title-overlay').classList.add('hidden');
        }

        const pt = getEventPoint(e);
        const hitRadius = e.touches ? 1.8 : 1.0;  // even more forgiving on touch

        for (let i = 0; i < balls.length; i++) {
            const dx = balls[i].x - pt.x;
            const dy = balls[i].y - pt.y;
            if (Math.sqrt(dx * dx + dy * dy) <= balls[i].radius * hitRadius) {
                selectedBall = balls[i];
                selectedBall.isDragging = true;
                selectedBall.velocity = 0;
                dragStartAngle = selectedBall.angle;
                break;
            }
        }
    }

    function handleMove(e) {
        e.preventDefault();
        if (!selectedBall) return;

        const pt = getEventPoint(e);
        const dx = pt.x - selectedBall.originalX;
        const dy = pt.y - selectedBall.originalY;
        let newAngle = Math.atan2(dx, dy);
        newAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newAngle));

        const dir = newAngle > selectedBall.angle ? 1 : -1;
        selectedBall.angle = newAngle;

        // Coupled balls follow
        if (dir < 0) {
            for (let i = 0; i < selectedBall.index; i++) {
                balls[i].angle = newAngle;
                balls[i].velocity = 0;
            }
        } else {
            for (let i = selectedBall.index + 1; i < balls.length; i++) {
                balls[i].angle = newAngle;
                balls[i].velocity = 0;
            }
        }

        balls.forEach(b => {
            b.x = b.originalX + Math.sin(b.angle) * rodLength;
            b.y = b.originalY + Math.cos(b.angle) * rodLength;
        });
    }

    function handleEnd(e) {
        e.preventDefault();
        if (selectedBall) {
            selectedBall.isDragging = false;
            balls.forEach(b => (b.velocity = 0));
            selectedBall = null;
        }
    }

    // Mouse
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    // Touch
    canvas.addEventListener('touchstart', e => { e.preventDefault(); handleStart(e); }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); handleMove(e); }, { passive: false });
    canvas.addEventListener('touchend', e => { e.preventDefault(); handleEnd(e); }, { passive: false });
    canvas.addEventListener('touchcancel', e => { e.preventDefault(); handleEnd(e); }, { passive: false });

    // ───────────────────── UI controls ─────────────────────
    const infoPanel = document.querySelector('.info-panel');
    const settingsPanel = document.querySelector('.settings-panel');

    function toggleInfo() {
        infoVisible = !infoVisible;
        settingsVisible = false;
        infoPanel.classList.toggle('active', infoVisible);
        settingsPanel.classList.remove('active');
    }

    function toggleSettings() {
        settingsVisible = !settingsVisible;
        infoVisible = false;
        settingsPanel.classList.toggle('active', settingsVisible);
        infoPanel.classList.remove('active');
    }

    document.querySelector('.info-button').addEventListener('click', toggleInfo);
    document.querySelector('.settings-button').addEventListener('click', toggleSettings);
    infoPanel.querySelector('.close-btn').addEventListener('click', toggleInfo);
    settingsPanel.querySelector('.close-btn').addEventListener('click', toggleSettings);

    // Sound toggle
    const soundBtn = document.querySelector('.sound-toggle');
    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.classList.toggle('sound-on', soundEnabled);
    });

    // Reset
    document.querySelector('.reset-button').addEventListener('click', () => {
        initBalls();
        hasInteracted = false;
        document.querySelector('.title-overlay').classList.remove('hidden');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.key === ' ') {
            e.preventDefault();
            soundEnabled = !soundEnabled;
            soundBtn.classList.toggle('sound-on', soundEnabled);
        } else if (e.key.toLowerCase() === 'r') {
            initBalls();
            hasInteracted = false;
            document.querySelector('.title-overlay').classList.remove('hidden');
        } else if (e.key.toLowerCase() === 'i') {
            toggleInfo();
        } else if (e.key.toLowerCase() === 's') {
            toggleSettings();
        }
    });

    // Ball count buttons
    document.querySelectorAll('.ball-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ball-count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            numBalls = parseInt(btn.dataset.count, 10);
            initBalls();
        });
    });

    // Gravity slider
    const gravitySlider = document.getElementById('gravitySlider');
    const gravityValue = document.getElementById('gravityValue');
    gravitySlider.addEventListener('input', () => {
        gravityMultiplier = parseFloat(gravitySlider.value);
        gravityValue.textContent = gravityMultiplier.toFixed(1) + 'x';
    });

    // Size slider
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeValue = document.getElementById('sizeValue');
    sizeSlider.addEventListener('input', () => {
        ballRadius = parseInt(sizeSlider.value, 10);
        sizeValue.textContent = ballRadius;
        initBalls();
    });

    // Trail toggle
    const trailToggle = document.getElementById('trailToggle');
    trailToggle.addEventListener('change', () => {
        showTrails = trailToggle.checked;
        if (!showTrails) trailPoints = [];
    });

    // Damping slider
    const dampingSlider = document.getElementById('dampingSlider');
    const dampingValue = document.getElementById('dampingValue');
    const dampingLabels = ['Low', 'Medium', 'High'];
    dampingSlider.addEventListener('input', () => {
        dampingLevel = parseInt(dampingSlider.value, 10);
        dampingValue.textContent = dampingLabels[dampingLevel];
    });

    // Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (preset === 'classic') {
                numBalls = 5; ballRadius = 25; gravityMultiplier = 1.0; dampingLevel = 0;
            } else if (preset === 'chaos') {
                numBalls = 7; ballRadius = 18; gravityMultiplier = 2.0; dampingLevel = 0;
            } else if (preset === 'slow') {
                numBalls = 5; ballRadius = 30; gravityMultiplier = 0.4; dampingLevel = 0;
            }
            // Sync UI
            document.querySelectorAll('.ball-count-btn').forEach(b => {
                b.classList.toggle('active', parseInt(b.dataset.count, 10) === numBalls);
            });
            gravitySlider.value = gravityMultiplier;
            gravityValue.textContent = gravityMultiplier.toFixed(1) + 'x';
            sizeSlider.value = ballRadius;
            sizeValue.textContent = ballRadius;
            dampingSlider.value = dampingLevel;
            dampingValue.textContent = dampingLabels[dampingLevel];
            resize(); // recalculate layout with new radius
            initBalls();
        });
    });

    // ───────────────────── Animation loop ─────────────────────
    function animate() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Background
        buildBgGradient();
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, w, h);

        // Subtle grid dots
        drawGridDots(w, h);

        // Frame
        drawFrame();

        // Trails (behind balls)
        drawTrails();

        // Rods + balls
        balls.forEach(ball => {
            drawRod(ball);
            if (!ball.isDragging) ball.update();
            ball.draw();
        });

        // Collisions
        handleCollisions();

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (!particles[i].alive) particles.splice(i, 1);
        }

        requestAnimationFrame(animate);
    }

    function drawGridDots(w, h) {
        ctx.fillStyle = 'rgba(255,255,255,0.015)';
        const gap = 40;
        for (let x = gap; x < w; x += gap) {
            for (let y = gap; y < h; y += gap) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    animate();
});