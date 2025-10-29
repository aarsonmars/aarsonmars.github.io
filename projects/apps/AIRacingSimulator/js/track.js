class Track {
    constructor(canvas, trackName = 'oval') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentTrackName = trackName;

        // Resolve shared configuration
        this.config = window.AIRacingConfig || {};
        this.loadTrack(trackName);
    }
    
    loadTrack(trackName) {
        // Get track-specific configuration
        this.trackConfig = this.config.getTrackConfig ? 
            this.config.getTrackConfig(trackName) : 
            this.config.track || {};

        const minDim = Math.min(this.canvas.width, this.canvas.height);
        const minLaneWidth = this.trackConfig.minLaneWidth ?? 28;
        const laneFactor = this.trackConfig.laneWidthFactor ?? 0.032;
        this.trackWidth = Math.max(minLaneWidth, minDim * laneFactor);
        this.runoffExtra = this.trackConfig.runOffExtra ?? 18;
        this.curbExtra = this.trackConfig.curbExtra ?? 6;
        this.marginFactor = this.trackConfig.marginFactor ?? 0.16;
        this.subdivisions = Math.max(1, this.trackConfig.subdivisions ?? 14);

        this.checkpoints = [];

        // Define track path as series of points (creating a racing circuit)
        this.trackPoints = this.createRaceTrack();
        this.generateCheckpoints();
        this.currentTrackName = trackName;
    }
    
    createRaceTrack() {
        const basePath = Array.isArray(this.trackConfig.basePath) && this.trackConfig.basePath.length >= 4
            ? this.trackConfig.basePath
            : this.defaultBasePath();

        const scaledPoints = this.mapNormalizedPoints(basePath);
        const smoothedPoints = this.catmullRomSpline(scaledPoints, this.subdivisions);

        return this.repositionStartOnStraight(smoothedPoints);
    }

    defaultBasePath() {
        return [
            { x: 0.08, y: 0.60 },
            { x: 0.10, y: 0.46 },
            { x: 0.18, y: 0.33 },
            { x: 0.30, y: 0.22 },
            { x: 0.45, y: 0.18 },
            { x: 0.62, y: 0.20 },
            { x: 0.76, y: 0.28 },
            { x: 0.85, y: 0.40 },
            { x: 0.88, y: 0.52 },
            { x: 0.84, y: 0.62 },
            { x: 0.72, y: 0.70 },
            { x: 0.56, y: 0.74 },
            { x: 0.40, y: 0.76 },
            { x: 0.28, y: 0.82 },
            { x: 0.22, y: 0.90 },
            { x: 0.28, y: 0.96 },
            { x: 0.44, y: 0.94 },
            { x: 0.60, y: 0.88 },
            { x: 0.76, y: 0.80 },
            { x: 0.86, y: 0.68 },
            { x: 0.90, y: 0.54 },
            { x: 0.86, y: 0.38 },
            { x: 0.74, y: 0.26 },
            { x: 0.58, y: 0.20 },
            { x: 0.40, y: 0.22 },
            { x: 0.26, y: 0.32 },
            { x: 0.18, y: 0.44 }
        ];
    }

    mapNormalizedPoints(points) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const minDim = Math.min(width, height);
        const margin = Math.max(this.trackWidth * 3, minDim * this.marginFactor);

        return points.map(pt => ({
            x: margin + pt.x * (width - margin * 2),
            y: margin + pt.y * (height - margin * 2)
        }));
    }

    catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;

        return {
            x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        };
    }

    catmullRomSpline(points, subdivisions) {
        const count = points.length;
        const samples = [];

        if (!count) {
            return samples;
        }

        samples.push(points[0]);

        for (let i = 0; i < count; i++) {
            const p0 = points[(i - 1 + count) % count];
            const p1 = points[i];
            const p2 = points[(i + 1) % count];
            const p3 = points[(i + 2) % count];

            for (let j = 1; j <= subdivisions; j++) {
                const t = j / subdivisions;
                samples.push(this.catmullRom(p0, p1, p2, p3, t));
            }
        }

        return samples;
    }

    repositionStartOnStraight(points) {
        const len = points.length;
        let bestIndex = 0;
        let bestScore = -Infinity;

        for (let i = 0; i < len; i++) {
            const prev = points[(i - 1 + len) % len];
            const current = points[i];
            const next = points[(i + 1) % len];

            const v1x = current.x - prev.x;
            const v1y = current.y - prev.y;
            const v2x = next.x - current.x;
            const v2y = next.y - current.y;

            const len1 = Math.hypot(v1x, v1y);
            const len2 = Math.hypot(v2x, v2y);

            if (len1 < 1e-3 || len2 < 1e-3) {
                continue;
            }

            const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
            const heading = Math.atan2(v2y, v2x);
            const straightness = Math.max(-1, Math.min(1, dot));
            const lengthBonus = (len1 + len2) * 0.0025;
            const horizontalBonus = 1 - Math.min(1, Math.abs(Math.sin(heading)));
            const forwardBonus = Math.cos(heading) > 0 ? 0.2 : 0;
            const score = straightness + lengthBonus + horizontalBonus * 0.6 + forwardBonus;

            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }

        if (bestIndex === 0) {
            return points;
        }

        const rotated = [];
        for (let i = 0; i < len; i++) {
            rotated.push(points[(bestIndex + i) % len]);
        }

        return rotated;
    }
    
    generateCheckpoints() {
        // Create checkpoints along the track for lap detection
        this.checkpoints = [];
        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            
            this.checkpoints.push({
                x: (current.x + next.x) / 2,
                y: (current.y + next.y) / 2,
                angle: Math.atan2(next.y - current.y, next.x - current.x)
            });
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grass background with texture
        this.drawGrassBackground();

        // Draw track shadows for depth
        this.drawTrackShadow();

        // Draw track asphalt
        this.drawTrackAsphalt();

        // Draw lane markings
        this.drawLaneMarkings();

        // Draw track borders and curbing
        this.drawTrackBorders();

        // Draw start/finish line
        this.drawStartLine();

        // Draw tire marks for realism
        this.drawTireMarks();

        // Draw checkpoints (for debugging - can be toggled off)
        // this.drawCheckpoints();
    }
    
    drawGrassBackground() {
        // Create a more realistic grass background with texture
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height) / 2
        );
        gradient.addColorStop(0, '#4a7c2e');
        gradient.addColorStop(0.5, '#2e8303ff');
        gradient.addColorStop(0.8, '#368403ff');
        gradient.addColorStop(1, '#256303ff');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Add subtle grass texture (static, no animation)
        this.ctx.save();
        // Use a seeded pattern to avoid blinking
        const seed = 12345; // Fixed seed for consistent pattern
        const random = (s) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
        };
        
        for (let i = 0; i < 500; i++) {
            const x = random(seed + i * 2) * this.canvas.width;
            const y = random(seed + i * 3) * this.canvas.height;
            const size = random(seed + i * 5) * 1.5 + 0.5;
            const shade = Math.floor(random(seed + i * 7) * 3);
            
            if (shade === 0) {
                this.ctx.fillStyle = 'rgba(58, 100, 38, 0.3)';
            } else if (shade === 1) {
                this.ctx.fillStyle = 'rgba(42, 80, 28, 0.25)';
            } else {
                this.ctx.fillStyle = 'rgba(35, 65, 22, 0.35)';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawTrackShadow() {
        // Add shadow under the track for depth
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = this.trackWidth * 2 + this.runoffExtra + 10;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawTrackAsphalt() {
        // Draw realistic asphalt with professional appearance
        
        // Base asphalt layer with darker, more realistic color
        const asphaltGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        asphaltGradient.addColorStop(0, '#252525');
        asphaltGradient.addColorStop(0.3, '#1a1a1a');
        asphaltGradient.addColorStop(0.5, '#151515');
        asphaltGradient.addColorStop(0.7, '#1a1a1a');
        asphaltGradient.addColorStop(1, '#252525');

        this.ctx.strokeStyle = asphaltGradient;
        this.ctx.lineWidth = this.trackWidth * 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.setLineDash([]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();

        // Add asphalt grain texture overlay
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(30, 30, 30, 0.3)';
        this.ctx.lineWidth = this.trackWidth * 2 - 1;

        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();

        // Add subtle wear/aging marks for realism
        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        this.ctx.strokeStyle = '#0a0a0a';
        this.ctx.lineWidth = this.trackWidth * 2 - 3;

        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawLaneMarkings() {
        // Draw proper lane markings like real race tracks

        // White solid lines on track edges
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.setLineDash([]); // Ensure no dash pattern

        // Inner edge (drawn at track width)
        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();

        // Outer edge (drawn at track width + small offset for visibility)
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();

        // Yellow dashed center line
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        const dashLength = Math.max(12, this.trackWidth * 0.4);
        const gapLength = Math.max(8, this.trackWidth * 0.25);
        this.ctx.setLineDash([dashLength, gapLength]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset dash pattern
    }
    
    drawTrackBorders() {
        const runOffWidth = this.trackWidth * 2 + this.runoffExtra;
        const curbWidth = this.trackWidth * 2 + this.curbExtra;

        // Draw gravel run-off area with more realistic texture
        const gravelGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gravelGradient.addColorStop(0, '#a89070');
        gravelGradient.addColorStop(0.3, '#8B7355');
        gravelGradient.addColorStop(0.6, '#756347');
        gravelGradient.addColorStop(1, '#a89070');

        this.ctx.strokeStyle = gravelGradient;
        this.ctx.lineWidth = runOffWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();

        // Draw racing kerbs (red and white stripes) - Formula 1 style
        this.drawRacingKerbs(curbWidth);
    }

    drawRacingKerbs(curbWidth) {
        // Natural bitumen/asphalt style kerb - darker than track
        this.ctx.save();
        this.ctx.lineWidth = curbWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw dark bitumen kerb with subtle gradient
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(0.5, '#1f0a0aff');
        gradient.addColorStop(1, '#1c1b1bff');
        
        this.ctx.strokeStyle = gradient;

        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();

        // Add slight texture to kerb for realism
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = curbWidth - 2;

        this.ctx.beginPath();
        this.ctx.moveTo(this.trackPoints[0].x, this.trackPoints[0].y);

        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const nextNext = this.trackPoints[(i + 2) % this.trackPoints.length];

            const cpX = next.x;
            const cpY = next.y;
            const endX = (next.x + nextNext.x) / 2;
            const endY = (next.y + nextNext.y) / 2;

            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawTireMarks() {
        // Add realistic tire marks on the track (static, not random each frame)
        this.ctx.strokeStyle = 'rgba(20, 20, 20, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';

        // Draw tire marks at fixed positions along the track
        for (let i = 0; i < this.trackPoints.length; i += 5) { // Every 5th point for spacing
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];

            // Use deterministic placement based on position
            const seed = (i * 7) % 10; // Deterministic "random" based on position
            if (seed > 3) { // ~70% chance, but deterministic
                const angle = Math.atan2(next.y - current.y, next.x - current.x);
                const perpAngle = angle + Math.PI / 2;

                // Draw parallel tire marks
                for (let side = -1; side <= 1; side += 2) {
                    const offset = side * (this.trackWidth * 0.3);
                    const startX = current.x + Math.cos(perpAngle) * offset;
                    const startY = current.y + Math.sin(perpAngle) * offset;
                    const endX = next.x + Math.cos(perpAngle) * offset;
                    const endY = next.y + Math.sin(perpAngle) * offset;

                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    drawStartLine() {
        const startPoint = this.trackPoints[0];
        const nextPoint = this.trackPoints[1];
        const dx = nextPoint.x - startPoint.x;
        const dy = nextPoint.y - startPoint.y;
        const angle = Math.atan2(dy, dx);
        const stripWidth = this.trackWidth * 0.9;
        const span = this.trackWidth * 1.8;
        const numSquares = 10;

        this.ctx.save();
        this.ctx.translate(startPoint.x, startPoint.y);
        this.ctx.rotate(angle);

        // Draw classic checkered flag pattern (2 rows x N columns)
        const squareSize = span / numSquares;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < numSquares; col++) {
                // Alternating pattern
                const isBlack = (row + col) % 2 === 0;
                this.ctx.fillStyle = isBlack ? '#000000' : '#ffffff';
                
                this.ctx.fillRect(
                    -stripWidth / 2,
                    -span/2 + col * squareSize,
                    stripWidth / 2,
                    squareSize
                );
                
                this.ctx.fillStyle = !isBlack ? '#000000' : '#ffffff';
                this.ctx.fillRect(
                    0,
                    -span/2 + col * squareSize,
                    stripWidth / 2,
                    squareSize
                );
            }
        }

        // Add red border for emphasis
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(-stripWidth / 2, -span/2, stripWidth, span);

        // Add subtle 3D shadow effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(-stripWidth / 2 + 3, -span/2 + 3, stripWidth, span);

        this.ctx.restore();
    }
    
    drawCheckpoints() {
        // Draw checkpoints for debugging
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.checkpoints.forEach((cp, i) => {
            this.ctx.beginPath();
            this.ctx.arc(cp.x, cp.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(i, cp.x - 5, cp.y + 5);
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        });
    }
    
    isPointOnTrack(x, y) {
        // Check if a point is within track boundaries
        // For now, we'll use a simple distance check from track center line
        let minDist = Infinity;
        
        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            
            const dist = this.pointToLineDistance(x, y, current.x, current.y, next.x, next.y);
            minDist = Math.min(minDist, dist);
        }
        
        return minDist <= this.trackWidth;
    }
    
    // Check if car crossed a checkpoint and update lap progress
    updateCarCheckpoint(car) {
        if (!this.checkpoints || this.checkpoints.length === 0) {
            return false;
        }
        
        const nextCheckpoint = (car.currentCheckpoint + 1) % this.checkpoints.length;
        const checkpoint = this.checkpoints[nextCheckpoint];
        
        // Check if car is near the checkpoint
        const dist = Math.hypot(car.x - checkpoint.x, car.y - checkpoint.y);
        const checkpointRadius = this.trackWidth * 0.8;
        
        if (dist < checkpointRadius) {
            car.currentCheckpoint = nextCheckpoint;
            
            // Check if lap completed (crossed start/finish line)
            if (nextCheckpoint === 0) {
                car.lapsCompleted++;
                return true; // Lap completed
            }
        }
        
        return false;
    }
    
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getStartPosition() {
        // Return starting position and angle for the car
        const start = this.trackPoints[0];
        const next = this.trackPoints[1];
        const angle = Math.atan2(next.y - start.y, next.x - start.x);
        
        return {
            x: start.x,
            y: start.y,
            angle: angle
        };
    }
}
