/**
 * Neon Flap — main game engine.
 * Features: parallax star-field, per-planet themes, particle FX,
 * screen-shake, score pop-ups, localStorage high-scores.
 */
class NeonFlapGame {
    constructor() {
        /* ── DOM ── */
        this.canvas   = document.getElementById('gameCanvas');
        this.ctx      = this.canvas.getContext('2d');
        this.menuScreen    = document.getElementById('menu-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.readyScreen   = document.getElementById('ready-screen');
        this.scoreDisplay  = document.getElementById('score-display');
        this.bestScoreEl   = document.getElementById('best-score');
        this.finalScoreEl  = document.getElementById('final-score');
        this.finalBestEl   = document.getElementById('final-best');
        this.newBestEl     = document.getElementById('new-best');
        this.planetNameHud = document.getElementById('planet-name-hud');
        this.planetIconHud = document.getElementById('planet-icon-hud');

        /* ── State ── */
        this.state = 'menu'; // menu | ready | playing | dead
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('neonflap_best') || '0', 10);
        this.bestScoreEl.textContent = this.bestScore;

        /* ── Planet / gravity ── */
        this.planetName = 'Earth';
        this.gravityFactor = 0.5;
        this.planetColor = '#00e5ff';
        this.planetIcon = '🌍';

        /* ── Theme palette (per planet) ── */
        this.themes = {
            Moon:    { sky1: '#05050f', sky2: '#0e0e28', ground: '#222238', stars: true,  pipe1: '#6666aa', pipe2: '#9999dd', glow: '#8888cc', particleCol: '#aaaadd' },
            Earth:   { sky1: '#050520', sky2: '#0a1040', ground: '#0d1a30', stars: true,  pipe1: '#b026ff', pipe2: '#ff2d95', glow: '#b026ff', particleCol: '#00e5ff' },
            Jupiter: { sky1: '#1a0f00', sky2: '#2a1800', ground: '#3a2200', stars: false, pipe1: '#ff8800', pipe2: '#ffcc00', glow: '#ff8800', particleCol: '#ffcc00' },
            Sun:     { sky1: '#2a0000', sky2: '#4a0800', ground: '#5a1000', stars: false, pipe1: '#ff2222', pipe2: '#ffaa00', glow: '#ff4444', particleCol: '#ffff44' },
        };
        this.theme = this.themes.Earth;

        /* ── Pipes ── */
        this.pipes = [];
        this.pipeGap = 155;
        this.pipeDistance = 580;
        this.pipeSpeed = 3;
        this.groundHeight = 40;

        /* ── Bird ── */
        this.bird = new Bird(this.canvas, 100, this.canvas.height / 2 - 20);

        /* ── Stars (parallax layers) ── */
        this.starLayers = [];
        this.initStars();

        /* ── Particles ── */
        this.particles = [];

        /* ── Score pop-ups ── */
        this.popups = [];

        /* ── Screen shake ── */
        this.shakeAmount = 0;
        this.shakeDuration = 0;

        /* ── Timing ── */
        this.lastTime = 0;
        this.animFrame = null;

        /* ── Resize handler ── */
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        /* ── Events ── */
        this.bindEvents();

        /* ── Initial draw (behind menu) ── */
        this.drawStaticBg();

        /* ── Try to lock landscape on mobile ── */
        try {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        } catch (_) { /* not supported */ }
    }

    /* ============================
       DYNAMIC CANVAS SIZING
       ============================ */
    resizeCanvas() {
        const wrapper = document.getElementById('game-wrapper');
        const physW = wrapper.clientWidth  || window.innerWidth;
        const physH = wrapper.clientHeight || window.innerHeight;

        // Fixed logical height — width adapts to aspect ratio.
        // This keeps bird size, pipe gaps, gravity & jump consistent
        // on every screen; only horizontal space changes.
        const LOGICAL_H = 500;
        const aspect = physW / physH;
        const logicalW = Math.round(LOGICAL_H * aspect);

        if (this.canvas.width !== logicalW || this.canvas.height !== LOGICAL_H) {
            this.canvas.width  = logicalW;
            this.canvas.height = LOGICAL_H;

            // Re-generate stars for the new dimensions
            this.initStars();

            // Re-center bird if not playing
            if (this.state !== 'playing' && this.bird) {
                this.bird.y = this.canvas.height / 2 - 20;
            }

            // Ground height is fixed in logical space
            this.groundHeight = 40;

            // Redraw static background when on menu
            if (this.state === 'menu') {
                this.drawStaticBg();
            }
        }
    }

    /* ============================
       STARS
       ============================ */
    initStars() {
        this.starLayers = [[], [], []];
        const speeds = [0.15, 0.4, 0.9];
        const counts = [80, 50, 30];
        for (let l = 0; l < 3; l++) {
            for (let i = 0; i < counts[l]; i++) {
                this.starLayers[l].push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * (this.canvas.height - this.groundHeight),
                    size: 0.4 + l * 0.5 + Math.random() * 0.6,
                    speed: speeds[l],
                    twinkle: Math.random() * Math.PI * 2,
                });
            }
        }
    }

    updateStars() {
        for (const layer of this.starLayers) {
            for (const s of layer) {
                s.x -= s.speed;
                s.twinkle += 0.03;
                if (s.x < -2) s.x = this.canvas.width + 2;
            }
        }
    }

    drawStars() {
        if (!this.theme.stars) return;
        const ctx = this.ctx;
        for (const layer of this.starLayers) {
            for (const s of layer) {
                const a = 0.4 + Math.sin(s.twinkle) * 0.3;
                ctx.globalAlpha = a;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    /* ============================
       BACKGROUND
       ============================ */
    drawBackground() {
        const ctx = this.ctx;
        const h = this.canvas.height - this.groundHeight;
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, this.theme.sky1);
        grad.addColorStop(1, this.theme.sky2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, h);

        this.drawStars();

        // Celestial decorations
        if (this.planetName === 'Moon') this.drawMoonDecor();
        else if (this.planetName === 'Jupiter') this.drawJupiterDecor();
        else if (this.planetName === 'Sun') this.drawSunDecor();
        else this.drawEarthDecor();
    }

    drawMoonDecor() {
        const ctx = this.ctx;
        // Distant Earth
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.arc(this.canvas.width - 80, 60, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#33aa55';
        ctx.beginPath();
        ctx.arc(this.canvas.width - 85, 55, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawEarthDecor() {
        // Subtle distant nebula glow
        const ctx = this.ctx;
        const t = Date.now() * 0.0001;
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = '#b026ff';
        ctx.beginPath();
        ctx.arc(200 + Math.sin(t) * 30, 80, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(600 + Math.cos(t) * 20, 120, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawJupiterDecor() {
        const ctx = this.ctx;
        const h = this.canvas.height - this.groundHeight;
        // Horizontal bands
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffcc66' : '#cc8833';
            ctx.fillRect(0, h * 0.15 + i * h * 0.12, this.canvas.width, h * 0.07);
        }
        // Great red spot
        const t = Date.now() * 0.00003;
        const sx = (this.canvas.width * 0.6 + Math.sin(t) * 40);
        ctx.fillStyle = '#cc4422';
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.ellipse(sx, h * 0.45, 55, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawSunDecor() {
        const ctx = this.ctx;
        const t = Date.now() * 0.001;
        const h = this.canvas.height - this.groundHeight;
        // Solar prominences
        ctx.globalAlpha = 0.06;
        for (let i = 0; i < 4; i++) {
            const x = (i * 220 + t * 8) % (this.canvas.width + 100) - 50;
            const fh = 40 + Math.sin(t + i * 2) * 20;
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.moveTo(x - 15, h);
            ctx.quadraticCurveTo(x, h - fh, x + 15, h);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawGround() {
        const ctx = this.ctx;
        const y = this.canvas.height - this.groundHeight;
        // Ground fill
        ctx.fillStyle = this.theme.ground;
        ctx.fillRect(0, y, this.canvas.width, this.groundHeight);
        // Neon line on top
        ctx.strokeStyle = this.theme.glow;
        ctx.shadowColor = this.theme.glow;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvas.width, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        // Grid lines on ground
        ctx.strokeStyle = `${this.theme.glow}22`;
        ctx.lineWidth = 1;
        const gridSize = 24;
        const offset = (Date.now() * 0.05) % gridSize;
        for (let gx = -offset; gx < this.canvas.width; gx += gridSize) {
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx - 10, this.canvas.height);
            ctx.stroke();
        }
        for (let gy = y + 12; gy < this.canvas.height; gy += 12) {
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(this.canvas.width, gy);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    drawStaticBg() {
        this.drawBackground();
        this.drawGround();
    }

    /* ============================
       PIPES
       ============================ */
    spawnPipe() {
        const minTop = 50;
        const maxTop = this.canvas.height - this.groundHeight - this.pipeGap - 50;
        const gapY = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
        const pipe = new Pipe(this.canvas, this.canvas.width + 10, this.pipeGap, gapY);
        pipe.speed = this.pipeSpeed;
        pipe.setTheme(this.theme.pipe1, this.theme.pipe2, this.theme.glow);
        this.pipes.push(pipe);
    }

    updatePipes() {
        // Spawn
        if (this.pipes.length === 0 ||
            this.canvas.width - this.pipes[this.pipes.length - 1].x >= this.pipeDistance) {
            this.spawnPipe();
        }
        // Update
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].update();
            if (this.pipes[i].checkPassed(this.bird.x)) {
                this.addScore();
            }
            if (this.pipes[i].isOffScreen()) {
                this.pipes.splice(i, 1);
            }
        }
    }

    /* ============================
       SCORE
       ============================ */
    addScore() {
        this.score++;
        this.scoreDisplay.textContent = this.score;

        // Pop-up
        this.popups.push({
            x: this.bird.x + this.bird.width,
            y: this.bird.y - 10,
            text: `+1`,
            life: 1,
            vy: -1.2,
        });

        // Burst particles
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 2;
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 1,
                size: 2 + Math.random() * 2,
                color: this.theme.particleCol,
            });
        }

        // Increase difficulty every 5 points (gentle ramp)
        if (this.score % 5 === 0) {
            this.pipeSpeed = Math.min(6, this.pipeSpeed + 0.2);
            this.pipeGap = Math.max(120, this.pipeGap - 3);
            for (const p of this.pipes) p.speed = this.pipeSpeed;
        }
    }

    /* ============================
       PARTICLES & POP-UPS
       ============================ */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.025;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    drawParticles() {
        const ctx = this.ctx;
        for (const p of this.particles) {
            ctx.globalAlpha = p.life * 0.7;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    updatePopups() {
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const pu = this.popups[i];
            pu.y += pu.vy;
            pu.life -= 0.025;
            if (pu.life <= 0) this.popups.splice(i, 1);
        }
    }

    drawPopups() {
        const ctx = this.ctx;
        ctx.font = '700 16px Orbitron, monospace';
        for (const pu of this.popups) {
            ctx.globalAlpha = pu.life;
            ctx.fillStyle = '#fff';
            ctx.shadowColor = this.theme.particleCol;
            ctx.shadowBlur = 8;
            ctx.fillText(pu.text, pu.x, pu.y);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    /* ============================
       SCREEN SHAKE
       ============================ */
    triggerShake(amount = 6, duration = 12) {
        this.shakeAmount = amount;
        this.shakeDuration = duration;
    }

    applyShake() {
        if (this.shakeDuration > 0) {
            const dx = (Math.random() - 0.5) * this.shakeAmount;
            const dy = (Math.random() - 0.5) * this.shakeAmount;
            this.ctx.translate(dx, dy);
            this.shakeDuration--;
            this.shakeAmount *= 0.9;
        }
    }

    /* ============================
       COLLISIONS
       ============================ */
    checkCollisions() {
        const bounds = this.bird.getBounds();
        for (const pipe of this.pipes) {
            if (pipe.checkCollision(bounds)) {
                this.die();
                return;
            }
        }
        if (bounds.bottom > this.canvas.height - this.groundHeight) {
            this.die();
        }
    }

    /* ============================
       STATE MANAGEMENT
       ============================ */
    applyPlanet(gravityFactor, name, icon, color) {
        this.gravityFactor = gravityFactor;
        this.planetName = name;
        this.planetColor = color;
        this.planetIcon = icon;
        this.theme = this.themes[name] || this.themes.Earth;

        // HUD
        this.planetNameHud.textContent = name;
        this.planetIconHud.textContent = icon;

        // Pipe tuning
        if (name === 'Moon') {
            this.pipeDistance = 600;
            this.pipeGap = 190;
        } else if (name === 'Sun') {
            this.pipeDistance = 480;
            this.pipeGap = 200;
        } else if (name === 'Jupiter') {
            this.pipeDistance = 480;
            this.pipeGap = 165;
        } else {
            this.pipeDistance = 500;
            this.pipeGap = 165;
        }
    }

    startReady() {
        this.state = 'ready';
        this.score = 0;
        this.scoreDisplay.textContent = '0';
        this.pipes = [];
        this.particles = [];
        this.popups = [];
        this.shakeAmount = 0;
        this.shakeDuration = 0;

        this.bird = new Bird(this.canvas, 100, this.canvas.height / 2 - 20);
        this.bird.setGravity(this.gravityFactor, this.planetName);

        this.pipeSpeed = Math.min(5, 2 + Math.sqrt(this.gravityFactor * 2));

        this.menuScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.readyScreen.classList.remove('hidden');

        // Gentle bobbing while waiting
        this.lastTime = performance.now();
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = requestAnimationFrame(this.readyLoop.bind(this));
    }

    startPlaying() {
        this.state = 'playing';
        this.readyScreen.classList.add('hidden');
        this.lastTime = performance.now();
        this.bird.flap(); // initial flap
        this.animFrame = requestAnimationFrame(this.gameLoop.bind(this));
    }

    die() {
        this.state = 'dead';

        // Explosion particles
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 4;
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 1,
                size: 2 + Math.random() * 4,
                color: this.bird.glowColor,
            });
        }
        this.triggerShake(10, 18);

        // High score
        let isNewBest = false;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('neonflap_best', this.bestScore.toString());
            isNewBest = true;
        }
        this.bestScoreEl.textContent = this.bestScore;

        // Show game-over after short delay
        setTimeout(() => {
            this.finalScoreEl.textContent = this.score;
            this.finalBestEl.textContent = this.bestScore;
            this.newBestEl.classList.toggle('hidden', !isNewBest);
            this.gameoverScreen.classList.remove('hidden');
        }, 600);
    }

    returnToMenu() {
        this.state = 'menu';
        this.gameoverScreen.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.drawStaticBg();
    }

    /* ============================
       GAME LOOPS
       ============================ */
    readyLoop(ts) {
        if (this.state !== 'ready') return;
        const dt = ts - this.lastTime;
        this.lastTime = ts;

        // Bob bird
        this.bird.y = this.canvas.height / 2 - 20 + Math.sin(ts * 0.003) * 8;
        this.bird.wingPhase += 0.08;

        // Draw
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.updateStars();
        this.bird.draw();
        this.drawGround();

        this.animFrame = requestAnimationFrame(this.readyLoop.bind(this));
    }

    gameLoop(ts) {
        if (this.state !== 'playing' && this.state !== 'dead') return;

        this.lastTime = ts;

        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.applyShake();

        // Background
        this.drawBackground();
        this.updateStars();

        if (this.state === 'playing') {
            // Update
            this.updatePipes();
            this.bird.update();
            this.checkCollisions();
        } else {
            // Dead — let bird fall
            this.bird.velocity += this.bird.gravity;
            this.bird.y += this.bird.velocity;
            // Keep pipes moving briefly
            for (const p of this.pipes) p.update();
        }

        // Draw pipes
        for (const p of this.pipes) p.draw();

        // Bird
        this.bird.update !== undefined && this.state === 'dead' ? null : null;
        this.bird.draw();

        // Ground
        this.drawGround();

        // FX
        this.updateParticles();
        this.drawParticles();
        this.updatePopups();
        this.drawPopups();

        this.ctx.restore();

        // Continue loop even when dead (for particles & shake)
        if (this.state === 'playing' || (this.state === 'dead' && (this.particles.length > 0 || this.shakeDuration > 0))) {
            this.animFrame = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    /* ============================
       INPUT
       ============================ */
    bindEvents() {
        // Canvas click / touch
        const flapInput = (e) => {
            e.preventDefault();
            if (this.state === 'ready') {
                this.startPlaying();
            } else if (this.state === 'playing') {
                this.bird.flap();
            }
        };
        this.canvas.addEventListener('pointerdown', flapInput);

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (this.state === 'ready') this.startPlaying();
                else if (this.state === 'playing') this.bird.flap();
            }
        });

        // Planet selector
        const planetBtns = document.querySelectorAll('.planet-btn');
        planetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                planetBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Play button
        document.getElementById('play-btn').addEventListener('click', () => {
            const sel = document.querySelector('.planet-btn.selected');
            if (!sel) return;
            this.applyPlanet(
                parseFloat(sel.dataset.gravity),
                sel.dataset.name,
                sel.dataset.icon,
                sel.dataset.color,
            );
            this.startReady();
        });

        // Retry button
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.startReady();
        });

        // Menu button
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.returnToMenu();
        });

        // Prevent scroll on mobile
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
}

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
    window.game = new NeonFlapGame();
});
