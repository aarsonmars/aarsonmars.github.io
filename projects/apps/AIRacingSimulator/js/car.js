class Car {
    constructor(x, y, angle, options = {}) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        const carDefaults = (window.AIRacingConfig && window.AIRacingConfig.car) || {};
        
        // Car dimensions in local space (length along heading, width side-to-side)
        this.length = options.length ?? carDefaults.length ?? 46;
        this.width = options.width ?? carDefaults.width ?? 24;
        
        // Physics properties - tuned for controllability
        this.speed = 0;
        this.acceleration = 0;
        this.accelerationRate = carDefaults.acceleration ?? 0.24;
        this.maxSpeed = carDefaults.maxSpeed ?? 7.2;
        this.friction = carDefaults.friction ?? 0.94;
        this.turnSpeed = carDefaults.turnSpeed ?? 0.065;
        this.speedToKmhFactor = carDefaults.speedToKmhFactor ?? 20;
        
        // Car state
        this.crashed = false;
        this.currentCheckpoint = 0;
        this.lapsCompleted = 0;
        this.lapTime = 0;
        this.bestLapTime = null;
        this.lapStartTime = Date.now();
        
        this.isGhost = options.isGhost ?? false;

        // Visual effects
        this.exhaustParticles = [];
        this.sensor = new Sensor(this);

        // AI specific state
        this.isAutonomous = options.autonomous ?? false;
        this.brain = options.brain || null;
        this.aiControl = { forward: false, backward: false, left: false, right: false };
        this.lastSensorInputs = [];
        this.lastOutputs = [];
        // Metrics for analytics and training
        this.distanceTravelled = 0;
        this.framesAlive = 0;
        this.fitness = 0;
    }
    
    update(controls, track) {
        this.sensor.update(track);
        const sensorInputs = this.sensor.getInputs();
        this.lastSensorInputs = sensorInputs.slice();

        if (this.crashed) {
            return;
        }

        const prevX = this.x;
        const prevY = this.y;

        let controlState = controls;
        if (this.isAutonomous && this.#hasUsableBrain()) {
            controlState = this.#decideAutonomousControls(sensorInputs);
        }

        controlState = controlState || { forward: false, backward: false, left: false, right: false };

        const throttleInput = controlState.throttle ?? (controlState.forward ? 1 : controlState.backward ? -1 : 0);
        const steeringInput = controlState.steering ?? ((controlState.right ? 1 : 0) - (controlState.left ? 1 : 0));

        const clampedThrottle = Math.max(-1, Math.min(1, throttleInput));
    this.acceleration = clampedThrottle * this.accelerationRate;
        if (Math.abs(this.acceleration) < 0.01) {
            this.acceleration = 0;
        }
        
        // Update speed
        this.speed += this.acceleration;
        this.speed *= this.friction;
        
        if (Math.abs(this.speed) < 0.02) {
            this.speed = 0;
        }
        
        // Clamp speed
        this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));
        
        // Steering (only when moving) - more realistic physics
        const clampedSteering = Math.max(-1, Math.min(1, steeringInput));
        if (Math.abs(this.speed) > 0.1 && Math.abs(clampedSteering) > 0.01) {
            const steerFactor = this.speed / this.maxSpeed;
            this.angle += this.turnSpeed * clampedSteering * Math.abs(steerFactor);
        }
        
        // Update position
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        const deltaX = this.x - prevX;
        const deltaY = this.y - prevY;
        this.distanceTravelled += Math.hypot(deltaX, deltaY);
        this.framesAlive += 1;
        
        // Add exhaust particles when accelerating
        if (clampedThrottle > 0.1 && Math.abs(this.speed) > 2) {
            this.addExhaustParticle();
        }
        
        // Update particles
        this.updateParticles();
        
        // Refresh sensors to reflect the new pose
        this.sensor.update(track);
        
        // Check collision with track boundaries
        if (!track.isPointOnTrack(this.x, this.y)) {
            this.crashed = true;
            this.speed = 0;
            this.sensor.enabled = false;
        } else {
            this.sensor.enabled = true;
        }
        
        // Update lap time only when car is moving or controls are active
        const isActive = Math.abs(this.speed) > 0.01 || 
                        (controls && (controls.forward || controls.backward || controls.left || controls.right));
        if (isActive) {
            this.lapTime = (Date.now() - this.lapStartTime) / 1000;
        }
    }
    
    addExhaustParticle() {
        const rearOffset = -this.length / 2;
        const exhaustAngle = this.angle + Math.PI;
        const perpAngle = this.angle + Math.PI / 2;

        for (const side of [-1, 1]) {
            const lateral = side * (this.width * 0.35);
            const baseX = this.x + Math.cos(this.angle) * rearOffset + Math.cos(perpAngle) * lateral;
            const baseY = this.y + Math.sin(this.angle) * rearOffset + Math.sin(perpAngle) * lateral;

            this.exhaustParticles.push({
                x: baseX,
                y: baseY,
                vx: Math.cos(exhaustAngle) * (2.5 + Math.random()) + (Math.random() - 0.5) * 0.8,
                vy: Math.sin(exhaustAngle) * (2.5 + Math.random()) + (Math.random() - 0.5) * 0.8,
                life: 18,
                maxLife: 18
            });
        }

        while (this.exhaustParticles.length > 60) {
            this.exhaustParticles.shift();
        }
    }
    
    updateParticles() {
        for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
            const p = this.exhaustParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            if (p.life <= 0) {
                this.exhaustParticles.splice(i, 1);
            }
        }
    }
    
    draw(ctx, options = {}) {
        const { mode = 'full', fitness = 0 } = options;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.crashed) {
            // Crash effect disabled - not required
            // this.#drawCrashEffect(ctx);
        } else {
            switch (mode) {
                case 'leader':
                    this.#drawCarBody(ctx, { isLeader: true });
                    break;
                case 'ghost':
                    this.#drawCarBody(ctx, { isGhost: true });
                    break;
                case 'triangle':
                    this.#drawAsTriangle(ctx, fitness);
                    break;
                case 'full':
                default:
                    this.#drawCarBody(ctx, {});
                    break;
            }
        }

        ctx.restore();
    }

    #drawAsTriangle(ctx, fitness) {
        const halfLength = this.length / 2;
        const halfWidth = this.width / 2;
        const hue = 120 * fitness; // 0=red, 120=green
        ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.8)`;
        ctx.strokeStyle = `hsla(${hue}, 80%, 30%, 0.9)`;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(halfLength, 0);
        ctx.lineTo(-halfLength, -halfWidth);
        ctx.lineTo(-halfLength, halfWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    #drawCrashEffect(ctx) {
        // Subtle crash effect - small particle burst
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ff4444';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = 6 + Math.random() * 4;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    #drawCarBody(ctx, { isLeader = false, isGhost = false }) {
        const halfLength = this.length / 2;
        const halfWidth = this.width / 2;

        if (isGhost) ctx.globalAlpha = 0.3;
        if (isLeader) {
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Paint (NO shadow rectangle - this was causing the issue)
        const gradient = ctx.createLinearGradient(-halfLength, 0, halfLength, 0);
        if (isGhost) {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#e0e0e0');
            gradient.addColorStop(1, '#cccccc');
        } else if (isLeader) {
            gradient.addColorStop(0, '#ccaa00');
            gradient.addColorStop(0.45, '#ffdd00');
            gradient.addColorStop(1, '#ffff66');
        } else {
            gradient.addColorStop(0, '#003d99');
            gradient.addColorStop(0.45, '#0066ff');
            gradient.addColorStop(1, '#66ccff');
        }
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(halfLength, 0);
        ctx.lineTo(halfLength - 12, -halfWidth + 4);
        ctx.lineTo(-halfLength + 8, -halfWidth + 4);
        ctx.lineTo(-halfLength, -halfWidth + 10);
        ctx.lineTo(-halfLength, halfWidth - 10);
        ctx.lineTo(-halfLength + 8, halfWidth - 4);
        ctx.lineTo(halfLength - 12, halfWidth - 4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isGhost ? '#999999' : (isLeader ? '#cc9900' : '#002c71');
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Reset shadow for other elements
        ctx.shadowBlur = 0;

        // Cockpit
        ctx.fillStyle = isGhost ? '#666666' : '#00142e';
        ctx.beginPath();
        ctx.ellipse(halfLength * 0.05, 0, this.length * 0.18, this.width * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isGhost ? 'rgba(200, 200, 220, 0.2)' : 'rgba(160, 200, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(halfLength * 0.05 - 3, -3, this.length * 0.12, this.width * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front wing
        ctx.fillStyle = isGhost ? '#999999' : (isLeader ? '#cc9900' : '#ff0033');
        ctx.fillRect(halfLength - 6, -halfWidth - 2, 2, this.width + 4);
        ctx.fillRect(halfLength - 16, -halfWidth - 2, 4, this.width + 4);

        // Headlights
        ctx.fillStyle = isGhost ? '#eeeeee' : '#ffff66';
        ctx.beginPath();
        ctx.arc(halfLength - 8, -halfWidth + 4, 2.5, 0, Math.PI * 2);
        ctx.arc(halfLength - 8, halfWidth - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Rear wing
        ctx.fillStyle = isGhost ? '#666666' : '#002c71';
        ctx.fillRect(-halfLength - 6, -halfWidth, 6, this.width);

        // Taillights
        ctx.fillStyle = isGhost ? '#bbbbbb' : '#ff1a1a';
        ctx.beginPath();
        ctx.arc(-halfLength + 6, -halfWidth + 4, 2.2, 0, Math.PI * 2);
        ctx.arc(-halfLength + 6, halfWidth - 4, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Racing stripe
        ctx.fillStyle = isGhost ? '#f0f0f0' : '#ffffff';
        ctx.fillRect(-halfLength + 6, -2, this.length - 12, 4);
    }
    
    drawParticles(ctx) {
        ctx.save();
        this.exhaustParticles.forEach(p => {
            const alpha = p.life / p.maxLife;
            const size = 2 + (1 - alpha) * 3;
            
            // Gray smoke with orange tint when fresh
            if (alpha > 0.7) {
                ctx.fillStyle = `rgba(255, 140, 0, ${alpha * 0.6})`;
            } else {
                ctx.fillStyle = `rgba(120, 120, 120, ${alpha * 0.5})`;
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
    
    reset(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 0;
        this.acceleration = 0;
        this.crashed = false;
        this.currentCheckpoint = 0;
        this.lapsCompleted = 0;
        this.lapTime = 0;
        this.lapStartTime = Date.now();
        this.exhaustParticles = [];
        this.sensor.enabled = true;
        this.sensor.rays = [];
        this.sensor.readings = [];
        this.aiControl = { forward: false, backward: false, left: false, right: false };
        this.lastSensorInputs = [];
        this.lastOutputs = [];
        this.distanceTravelled = 0;
        this.framesAlive = 0;
        this.fitness = 0;
    }
    
    getSpeed() {
        return Math.abs(this.speed);
    }
    
    getSpeedKmh() {
        // Convert abstract speed to km/h for display
        return Math.round(Math.abs(this.speed) * this.speedToKmhFactor);
    }

    getNormalizedSpeed() {
        if (!this.maxSpeed) {
            return 0;
        }
        return Math.max(-1, Math.min(1, this.speed / this.maxSpeed));
    }

    enableAutonomous(brain) {
        if (brain && typeof brain.feedForward === 'function') {
            this.brain = brain;
        }
        this.isAutonomous = true;
    }

    disableAutonomous() {
        this.isAutonomous = false;
        this.aiControl = { forward: false, backward: false, left: false, right: false };
    }

    #decideAutonomousControls(sensorInputs) {
        const inputs = sensorInputs.slice();
        inputs.push(this.getNormalizedSpeed());

        const outputs = this.brain.feedForward(inputs) || [];
        const throttle = outputs[0] ?? 0;
        const steering = outputs[1] ?? 0;

        this.lastOutputs = outputs.slice();

        const control = {
            forward: throttle > 0.1,
            backward: throttle < -0.15,
            left: steering < -0.12,
            right: steering > 0.12,
            throttle,
            steering
        };

        this.aiControl = control;
        return control;
    }

    #hasUsableBrain() {
        return !!(this.brain && typeof this.brain.feedForward === 'function');
    }

    getSensorInputs() {
        return this.lastSensorInputs.slice();
    }
}
