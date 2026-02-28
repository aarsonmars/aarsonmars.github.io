/**
 * Neon Pipe — gradient-lit pipes with glow and animated edge.
 */
class Pipe {
    constructor(canvas, x, gapSize, gapY) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.width = 62;
        this.gapSize = gapSize;
        this.gapY = gapY;     // top of the gap
        this.speed = 3;
        this.passed = false;

        // Neon colours (overridden per-planet from game.js)
        this.color1 = '#b026ff';
        this.color2 = '#ff2d95';
        this.glowColor = '#b026ff';
    }

    /* ── theme colours ── */
    setTheme(c1, c2, glow) {
        this.color1 = c1;
        this.color2 = c2;
        this.glowColor = glow;
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        const ctx = this.ctx;
        const topH = this.gapY;
        const botY = this.gapY + this.gapSize;
        const botH = this.canvas.height - botY;
        const capH = 18;
        const capExtra = 6;

        // ── Gradient for pipe body ──
        const grad = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        grad.addColorStop(0, this.color1);
        grad.addColorStop(0.5, this.color2);
        grad.addColorStop(1, this.color1);

        // ── Glow ──
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 18;

        // Top pipe body
        ctx.fillStyle = grad;
        ctx.fillRect(this.x, 0, this.width, topH - capH);
        // Top cap
        ctx.fillRect(this.x - capExtra, topH - capH, this.width + capExtra * 2, capH);

        // Bottom pipe body
        ctx.fillRect(this.x, botY + capH, this.width, botH - capH);
        // Bottom cap
        ctx.fillRect(this.x - capExtra, botY, this.width + capExtra * 2, capH);

        ctx.shadowBlur = 0;

        // ── Highlight strip ──
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(this.x + 6, 0, 6, topH - capH);
        ctx.fillRect(this.x + 6, botY + capH, 6, botH - capH);

        // ── Dark edge strip ──
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(this.x + this.width - 10, 0, 6, topH - capH);
        ctx.fillRect(this.x + this.width - 10, botY + capH, 6, botH - capH);

        // ── Animated scanline on cap ──
        const t = (Date.now() % 2000) / 2000;
        ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.sin(t * Math.PI * 2) * 0.06})`;
        ctx.fillRect(this.x - capExtra, topH - capH, this.width + capExtra * 2, capH);
        ctx.fillRect(this.x - capExtra, botY, this.width + capExtra * 2, capH);
    }

    isOffScreen() {
        return this.x + this.width + 6 < 0;
    }

    checkCollision(bounds) {
        const capExtra = 6;
        const capH = 18;

        // Top pipe (body + cap)
        if (bounds.right > this.x - capExtra &&
            bounds.left < this.x + this.width + capExtra &&
            bounds.top < this.gapY) {
            return true;
        }
        // Bottom pipe (body + cap)
        if (bounds.right > this.x - capExtra &&
            bounds.left < this.x + this.width + capExtra &&
            bounds.bottom > this.gapY + this.gapSize) {
            return true;
        }
        return false;
    }

    checkPassed(birdX) {
        if (!this.passed && birdX > this.x + this.width) {
            this.passed = true;
            return true;
        }
        return false;
    }
}
