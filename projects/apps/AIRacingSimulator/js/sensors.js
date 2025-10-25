class Sensor {
    constructor(car, options = {}) {
        this.car = car;
        const sensorDefaults = (window.AIRacingConfig && window.AIRacingConfig.sensors) || {};
        this.rayCount = options.rayCount ?? sensorDefaults.rayCount ?? 7;
        this.rayLength = options.rayLength ?? sensorDefaults.rayLength ?? 220;
        this.raySpread = options.raySpread ?? sensorDefaults.raySpread ?? Math.PI * 0.9;
        this.step = options.step ?? sensorDefaults.step ?? 6;
        this.rays = [];
        this.readings = [];
        this.enabled = true;
    }

    update(track) {
        if (!this.enabled) {
            this.rays = [];
            this.readings = [];
            return;
        }

        this.#castRays();
        this.readings = this.rays.map(ray => this.#sampleRay(ray, track));
    }

    #castRays() {
        this.rays = [];
        const { x, y, angle } = this.car;
        const count = this.rayCount;

        for (let i = 0; i < count; i++) {
            const lerp = count === 1 ? 0.5 : i / (count - 1);
            const rayAngle = angle + (lerp - 0.5) * this.raySpread;
            const endX = x + Math.cos(rayAngle) * this.rayLength;
            const endY = y + Math.sin(rayAngle) * this.rayLength;
            this.rays.push({ start: { x, y }, end: { x: endX, y: endY }, angle: rayAngle });
        }
    }

    #sampleRay(ray, track) {
        const { start, end } = ray;
        const steps = Math.ceil(this.rayLength / this.step);

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const px = start.x + (end.x - start.x) * t;
            const py = start.y + (end.y - start.y) * t;

            if (!track.isPointOnTrack(px, py)) {
                const dist = Math.hypot(px - start.x, py - start.y);
                return {
                    distance: dist,
                    normalized: Math.max(0, 1 - dist / this.rayLength),
                    point: { x: px, y: py }
                };
            }
        }

        return {
            distance: this.rayLength,
            normalized: 0,
            point: { x: end.x, y: end.y }
        };
    }

    draw(ctx) {
        if (!this.enabled) return;
        ctx.save();
        this.rays.forEach((ray, index) => {
            const reading = this.readings[index];
            const hitPoint = reading?.point || ray.end;

            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(ray.start.x, ray.start.y);
            ctx.lineTo(hitPoint.x, hitPoint.y);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.moveTo(hitPoint.x, hitPoint.y);
            ctx.lineTo(ray.end.x, ray.end.y);
            ctx.stroke();

            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(hitPoint.x, hitPoint.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    getInputs() {
        if (!this.enabled) {
            return new Array(this.rayCount).fill(0);
        }
        return this.readings.map(r => r?.normalized ?? 0);
    }
}
