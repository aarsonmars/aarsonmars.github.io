/**
 * Neon Bird — glowing, rotating bird with a particle trail.
 */
class Bird {
    constructor(canvas, x, y) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.y = y;
        this.width = 42;
        this.height = 32;

        // Physics
        this.baseGravity = 0.28;
        this.gravity = this.baseGravity;
        this.velocity = 0;
        this.baseJump = -6;
        this.jumpStrength = this.baseJump;

        // Rotation (visual tilt based on velocity)
        this.rotation = 0;

        // Wing animation
        this.wingPhase = 0;      // 0‥2π
        this.wingSpeed = 0.15;
        this.isFlapping = false;
        this.flapTimer = 0;

        // Trail particles
        this.trail = [];
        this.maxTrail = 18;

        // Appearance
        this.glowColor = '#00e5ff';
        this.bodyColor = '#00e5ff';
        this.wingColor = '#b026ff';
        this.eyeColor = '#fff';

        // Flap strength / timing
        this.lastFlapTime = 0;
        this.flapStrength = 1;
    }

    /* ── gravity per planet ── */
    setGravity(factor, planetName) {
        // Cap extreme gravity so every planet stays playable
        const f = Math.min(factor, 2.2);
        this.gravity = this.baseGravity * f;
        this.jumpStrength = this.baseJump * Math.sqrt(f + 0.5);
        if (f > 1.5) this.jumpStrength *= 1.15;
        if (f < 0.2) this.jumpStrength *= 0.9;

        // Themed glow colour
        const themeColors = {
            Moon:    { glow: '#b0b0d0', body: '#c8c8e8', wing: '#8888aa' },
            Earth:   { glow: '#00e5ff', body: '#00e5ff', wing: '#b026ff' },
            Jupiter: { glow: '#ffab40', body: '#ffab40', wing: '#ff6d00' },
            Sun:     { glow: '#ff5252', body: '#ff8a80', wing: '#ffff00' },
        };
        const c = themeColors[planetName] || themeColors.Earth;
        this.glowColor = c.glow;
        this.bodyColor = c.body;
        this.wingColor = c.wing;
    }

    /* ── flap ── */
    flap() {
        const now = Date.now();
        const dt = now - this.lastFlapTime;
        this.lastFlapTime = now;

        // Rapid clicks slightly weaker
        this.flapStrength = dt < 180 ? Math.max(0.8, this.flapStrength * 0.92) : Math.min(1.2, this.flapStrength * 1.08);

        this.velocity = this.jumpStrength * this.flapStrength;
        this.isFlapping = true;
        this.flapTimer = 12;

        // Burst particles on flap
        for (let i = 0; i < 6; i++) {
            this.trail.push({
                x: this.x + this.width * 0.25,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                vx: -1.5 - Math.random() * 2,
                vy: (Math.random() - 0.5) * 3,
                life: 1,
                size: 2 + Math.random() * 3,
            });
        }

        // Vibrate on mobile
        if (navigator.vibrate) navigator.vibrate(8);
    }

    /* ── per-frame update ── */
    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;
        if (this.y < 0) { this.y = 0; this.velocity = 0; }

        // Rotation: tilt up when rising, dive when falling
        const targetRot = Math.max(-0.45, Math.min(Math.PI / 2.5, this.velocity * 0.07));
        this.rotation += (targetRot - this.rotation) * 0.12;

        // Wing animation
        if (this.isFlapping) {
            this.wingPhase += 0.5;
            this.flapTimer--;
            if (this.flapTimer <= 0) this.isFlapping = false;
        } else {
            this.wingPhase += this.wingSpeed;
        }

        // Passive trail
        if (Math.random() < 0.4) {
            this.trail.push({
                x: this.x + 4,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 8,
                vx: -0.8 - Math.random(),
                vy: (Math.random() - 0.5) * 0.5,
                life: 1,
                size: 1.5 + Math.random() * 1.5,
            });
        }

        // Update trail
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const p = this.trail[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.04;
            if (p.life <= 0) this.trail.splice(i, 1);
        }
        if (this.trail.length > this.maxTrail * 3) {
            this.trail.splice(0, this.trail.length - this.maxTrail * 3);
        }
    }

    /* ── draw ── */
    draw() {
        const ctx = this.ctx;

        // Draw trail
        for (const p of this.trail) {
            ctx.globalAlpha = p.life * 0.5;
            ctx.fillStyle = this.glowColor;
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Save and rotate around bird center
        ctx.save();
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);

        // Outer glow
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 22;

        // Body
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.ellipse(-3, -4, this.width / 3, this.height / 4, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        const wingY = Math.sin(this.wingPhase) * 8;
        ctx.fillStyle = this.wingColor;
        ctx.shadowColor = this.wingColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(-5, wingY, this.width / 3.5, this.height / 3, wingY * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.width / 4 + 2, -this.height / 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(this.width / 4 + 3.5, -this.height / 6, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 4, -3);
        ctx.lineTo(this.width / 2 + 6, 0);
        ctx.lineTo(this.width / 2 - 4, 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    /* ── hitbox ── */
    getBounds() {
        const m = 6;
        return {
            left: this.x + m,
            top: this.y + m,
            right: this.x + this.width - m,
            bottom: this.y + this.height - m,
        };
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.rotation = 0;
        this.trail = [];
        this.flapStrength = 1;
        this.lastFlapTime = 0;
    }
}
