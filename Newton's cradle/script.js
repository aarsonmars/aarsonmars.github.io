document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cradleCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Ball {
        constructor(x, y, radius, angle = 0) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.angle = angle;
            this.velocity = 0;
            this.acceleration = 0;
            this.originalX = x;
            this.originalY = y;
        }

        update() {
            this.acceleration = -0.001 * Math.sin(this.angle);
            this.velocity += this.acceleration;
            this.velocity *= 0.999; // Increased damping
            this.angle += this.velocity;
            
            this.x = this.originalX + Math.sin(this.angle) * rodLength;
            this.y = this.originalY + Math.cos(this.angle) * rodLength;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                this.x - this.radius / 2,
                this.y - this.radius / 2,
                this.radius * 0.1,
                this.x,
                this.y,
                this.radius
            );
            gradient.addColorStop(0, "rgba(230,230,230,1)");
            gradient.addColorStop(0.3, "rgba(220,220,220,0.9)");
            gradient.addColorStop(0.7, "rgba(84, 84, 84, 0.8)");
            gradient.addColorStop(1, "rgba(16, 16, 16, 0.7)");
            
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = "#999";
            ctx.stroke();
        }
    }

    // Configuration
    const numBalls = 5;
    const ballRadius = 25;
    const rodLength = 300;
    const spacing = ballRadius * 2;
    const startX = canvas.width/2 - ((numBalls-1) * spacing)/2;
    const startY = canvas.height * 0.25;
    let soundEnabled = false;
    const collisionThreshold = 0.1;
    const collisionSoundDuration = 100;
    let collisionsTimestamps = [];
    let currentCollisions = new Set();

    document.querySelector('.sound-toggle').classList.add('sound-off');

    // Initialize balls
    const balls = [];
    for (let i = 0; i < numBalls; i++) {
        const x = startX + i * spacing;
        const ball = new Ball(x, startY + rodLength, ballRadius);
        ball.originalX = x;
        ball.originalY = startY;
        balls.push(ball);
    }
// Trigger one ball to move by default
    // balls[0].angle = -Math.PI / 3;
    // balls[0].velocity = 0;
    collisionsTimestamps = new Array(numBalls - 1).fill(performance.now());

    // Event listeners
    document.querySelectorAll('.cradle-button').forEach(button => {
        button.addEventListener('click', () => {
            const dropCount = parseInt(button.textContent, 10);
            for (let i = 0; i < dropCount && i < balls.length; i++) {
                balls[i].angle = -Math.PI / 4;
                balls[i].velocity = 0;
            }
        });
    });

    document.querySelector('.sound-toggle').addEventListener('click', function() {
        soundEnabled = !soundEnabled;
        this.classList.toggle('sound-off', !soundEnabled);
    });

    document.querySelector('.reset-button').addEventListener('click', function() {
        location.reload();
    });

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw support structure
        ctx.beginPath();
        ctx.moveTo(startX - 60, startY);
        ctx.lineTo(startX + (numBalls-1)*spacing + 60, startY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#aaa';
        ctx.stroke();

        // Update and draw balls
        balls.forEach((ball, i) => {
            ctx.beginPath();
            ctx.moveTo(ball.originalX, ball.originalY);
            ctx.lineTo(ball.x, ball.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
            ball.update();
            ball.draw();
        });

        const now = performance.now();
        currentCollisions.clear();

        // Collision detection and response
        for (let i = 0; i < balls.length - 1; i++) {
            const ball1 = balls[i];
            const ball2 = balls[i + 1];
            
            const dx = ball2.x - ball1.x;
            const dy = ball2.y - ball1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = ballRadius * 2;

            if (distance < minDistance) {
                const nx = dx / distance;
                const ny = dy / distance;
                
                // Convert angular to linear velocity
                const v1 = ball1.velocity * rodLength;
                const v2 = ball2.velocity * rodLength;
                
                // Calculate relative velocity
                const relVel = (v2 - v1) * (Math.cos(ball1.angle) * nx - Math.sin(ball1.angle) * ny);

                if (relVel < -collisionThreshold) {
                    if (!currentCollisions.has(i) && now - collisionsTimestamps[i] > collisionSoundDuration) {
                        if (soundEnabled) new Audio('./sounds/collision50ms2.mp3').play();
                        collisionsTimestamps[i] = now;
                        currentCollisions.add(i);
                    }

                    // Position correction
                    const overlap = (minDistance - distance) / 2;
                    ball1.x -= overlap * nx;
                    ball1.y -= overlap * ny;
                    ball2.x += overlap * nx;
                    ball2.y += overlap * ny;

                    // Swap velocities
                    [ball1.velocity, ball2.velocity] = [ball2.velocity, ball1.velocity];
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});