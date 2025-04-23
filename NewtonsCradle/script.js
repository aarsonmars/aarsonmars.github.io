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
            this.color = `hsl(${Math.random() * 40 + 200}, 70%, 50%)`;
            this.isDragging = false;
        }

        update(timeScale) {
            // Simplified physics model without mass
            this.acceleration = -0.001 * Math.sin(this.angle);
            this.velocity += this.acceleration;
            // Simple damping
            this.velocity *= 0.999;
            this.angle += this.velocity * timeScale;
            
            this.x = this.originalX + Math.sin(this.angle) * rodLength;
            this.y = this.originalY + Math.cos(this.angle) * rodLength;
        }

        draw() {
            // Draw shadow first - update shadow position to follow the ball's x position
            ctx.beginPath();
            ctx.ellipse(
                this.x, // Changed from this.originalX to this.x so shadow follows ball
                startY + rodLength * 1.2, 
                this.radius * 0.7, 
                this.radius * 0.2, 
                0, 0, Math.PI * 2
            );
            const shadowGradient = ctx.createRadialGradient(
                this.x, // Changed from this.originalX to this.x for consistent positioning
                startY + rodLength * 1.2,
                0,
                this.x, // Changed from this.originalX to this.x for consistent positioning
                startY + rodLength * 1.2,
                this.radius
            );
            shadowGradient.addColorStop(0, "rgba(0,0,0,0.5)");
            shadowGradient.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = shadowGradient;
            ctx.fill();
            
            // Draw the ball
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
            
            // Highlight ball when dragging
            if (this.isDragging) {
                gradient.addColorStop(0, "rgba(255,255,255,1)");
                gradient.addColorStop(0.3, "rgba(240,240,240,0.9)");
                gradient.addColorStop(0.7, "rgba(150, 150, 220, 0.8)");
                gradient.addColorStop(1, "rgba(100, 100, 200, 0.7)");
            } else {
                gradient.addColorStop(0, "rgba(230,230,230,1)");
                gradient.addColorStop(0.3, "rgba(220,220,220,0.9)");
                gradient.addColorStop(0.7, "rgba(84, 84, 84, 0.8)");
                gradient.addColorStop(1, "rgba(16, 16, 16, 0.7)");
            }
            
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = "#999";
            ctx.stroke();
        }
        
        containsPoint(x, y) {
            // Check if a point is within this ball
            const dx = this.x - x;
            const dy = this.y - y;
            return dx * dx + dy * dy <= this.radius * this.radius;
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
    let infoVisible = false;
    const timeScale = 1.0; // Constant time scale factor
    let selectedBall = null;
    let dragStartAngle = 0;

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

    // Keyboard event listeners
    document.addEventListener('keydown', (e) => {
        // Space to toggle sound
        if (e.key === ' ') {
            soundEnabled = !soundEnabled;
            document.querySelector('.sound-toggle').classList.toggle('sound-off', !soundEnabled);
        }
        // 'R' to reset
        else if (e.key.toLowerCase() === 'r') {
            location.reload();
        }
        // 'I' to toggle info panel
        else if (e.key.toLowerCase() === 'i') {
            toggleInfoPanel();
        }
    });

    // Info panel toggle
    function toggleInfoPanel() {
        const infoPanel = document.querySelector('.info-panel');
        infoVisible = !infoVisible;
        if (infoVisible) {
            infoPanel.classList.add('active');
        } else {
            infoPanel.classList.remove('active');
        }
    }

    document.querySelector('.info-button').addEventListener('click', toggleInfoPanel);
    document.querySelector('.close-btn').addEventListener('click', toggleInfoPanel);

    // Drag and drop functionality
    function handleStart(e) {
        const point = getEventPoint(e);
        
        // Visual debug for touch point
        if (e.touches) {
            touchIndicator.active = true;
            touchIndicator.x = point.x;
            touchIndicator.y = point.y;
        }
        
        // Find if we're clicking/touching a ball
        let ballFound = false;
        for (let i = 0; i < balls.length; i++) {
            if (balls[i].containsPoint(point.x, point.y)) {
                selectedBall = balls[i];
                selectedBall.isDragging = true;
                selectedBall.velocity = 0; // Reset velocity when starting a drag
                dragStartAngle = selectedBall.angle;
                
                // Store the index of the selected ball
                selectedBall.index = i;
                ballFound = true;
                break;
            }
        }
        
        // Make touching more forgiving by extending the hit area if no ball was detected
        if (!ballFound && e.touches) {
            // Try with a larger detection radius for touch
            for (let i = 0; i < balls.length; i++) {
                const dx = balls[i].x - point.x;
                const dy = balls[i].y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Use a bigger detection area for touch (1.5x the ball radius)
                if (distance <= balls[i].radius * 1.5) {
                    selectedBall = balls[i];
                    selectedBall.isDragging = true;
                    selectedBall.velocity = 0;
                    dragStartAngle = selectedBall.angle;
                    selectedBall.index = i;
                    break;
                }
            }
        }
    }
    
    function handleMove(e) {
        e.preventDefault();
        if (selectedBall) {
            const point = getEventPoint(e);
            
            // Calculate new angle based on the dragged point
            const dx = point.x - selectedBall.originalX;
            const dy = point.y - selectedBall.originalY;
            
            // Calculate angle from the center point (rod anchor)
            let newAngle = Math.atan2(dx, dy);
            
            // Limit the swing angle to a reasonable range
            newAngle = Math.max(-Math.PI/2, Math.min(Math.PI/2, newAngle));
            
            // Determine drag direction (-1 for left, 1 for right)
            const dragDirection = newAngle > selectedBall.angle ? 1 : -1;
            
            // Update selected ball's angle
            selectedBall.angle = newAngle;
            
            // Newton's cradle logic: when dragging a ball, all balls in drag direction move together
            if (dragDirection < 0) {
                // Dragging left - all balls to the left of selected ball follow
                for (let i = 0; i < selectedBall.index; i++) {
                    balls[i].angle = newAngle;
                    balls[i].velocity = 0;
                }
            } else {
                // Dragging right - all balls to the right of selected ball follow
                for (let i = selectedBall.index + 1; i < balls.length; i++) {
                    balls[i].angle = newAngle;
                    balls[i].velocity = 0;
                }
            }
            
            // Update positions of all affected balls based on their new angles
            balls.forEach(ball => {
                ball.x = ball.originalX + Math.sin(ball.angle) * rodLength;
                ball.y = ball.originalY + Math.cos(ball.angle) * rodLength;
            });
        }
    }
    
    function handleEnd(e) {
        e.preventDefault();
        if (selectedBall) {
            // When releasing, all balls maintain their current angles/positions but start with zero velocity
            selectedBall.isDragging = false;
            
            // Reset all ball velocities for smooth transition back to physics simulation
            balls.forEach(ball => {
                ball.velocity = 0;
            });
            
            selectedBall = null;
        }
    }
    
    function getEventPoint(e) {
        let clientX, clientY;
        
        // Handle both touch and mouse events
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Convert to canvas coordinates
        const rect = canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    // Add mouse event listeners
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    
    // Add touch event listeners for mobile
    canvas.addEventListener('touchstart', function(e) {
        // Prevent default to avoid scrolling while interacting with the cradle
        e.preventDefault();
        handleStart(e);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', function(e) {
        // Prevent default to avoid scrolling while dragging
        e.preventDefault();
        handleMove(e);
    }, { passive: false });
    
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleEnd(e);
    }, { passive: false });
    
    canvas.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        handleEnd(e);
    }, { passive: false });

    // Debug touch indicator
    let touchIndicator = {
        active: false,
        x: 0,
        y: 0,
        draw: function() {
            if (this.active) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fill();
            }
        }
    };

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw improved support structure
        drawCradleFrame();

        // Draw touch debug indicator
        touchIndicator.draw();

        // Fade out touch indicator over time
        if (touchIndicator.active) {
            setTimeout(() => {
                touchIndicator.active = false;
            }, 1000);
        }

        // Update and draw balls
        balls.forEach((ball, i) => {
            // Draw rods
            ctx.beginPath();
            ctx.moveTo(ball.originalX, ball.originalY);
            ctx.lineTo(ball.x, ball.y);
            ctx.lineWidth = 2;
            const rodGradient = ctx.createLinearGradient(
                ball.originalX, ball.originalY, 
                ball.x, ball.y
            );
            rodGradient.addColorStop(0, '#aaaaaa');
            rodGradient.addColorStop(1, '#dddddd');
            ctx.strokeStyle = rodGradient;
            ctx.stroke();
            
            // Only update physics for non-dragged balls
            if (!ball.isDragging) {
                // Apply simulation speed to updates
                ball.update(timeScale);
            }
            ball.draw();
        });

        const now = performance.now();
        currentCollisions.clear();

        // Collision detection and response - simplify to remove mass consideration
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
                    // Sound logic is correct: only play sound when balls are approaching (negative relative velocity)
                    // and we haven't played a sound for this collision recently
                    if (!currentCollisions.has(i) && now - collisionsTimestamps[i] > collisionSoundDuration) {
                        if (soundEnabled) {
                            // Fixed volume instead of mass-based volume
                            const volume = Math.min(1.0, Math.abs(relVel) * 0.5);
                            const collisionSound = new Audio('./sounds/collision50ms2.mp3');
                            collisionSound.volume = volume;
                            collisionSound.play();
                        }
                        collisionsTimestamps[i] = now;
                        currentCollisions.add(i);
                    }

                    // Position correction
                    const overlap = (minDistance - distance) / 2;
                    ball1.x -= overlap * nx;
                    ball1.y -= overlap * ny;
                    ball2.x += overlap * nx;
                    ball2.y += overlap * ny;

                    // Simple velocity swap for equal mass balls
                    [ball1.velocity, ball2.velocity] = [ball2.velocity, ball1.velocity];
                }
            }
        }

        requestAnimationFrame(animate);
    }

    // Draw an improved cradle frame
    function drawCradleFrame() {
        // Top bar
        ctx.beginPath();
        ctx.moveTo(startX - 80, startY - 10);
        ctx.lineTo(startX + (numBalls-1)*spacing + 80, startY - 10);
        ctx.lineTo(startX + (numBalls-1)*spacing + 80, startY + 10);
        ctx.lineTo(startX - 80, startY + 10);
        ctx.closePath();
        
        const frameGradient = ctx.createLinearGradient(
            startX - 80, startY - 10,
            startX - 80, startY + 10
        );
        frameGradient.addColorStop(0, '#888');
        frameGradient.addColorStop(0.5, '#ddd');
        frameGradient.addColorStop(1, '#888');
        ctx.fillStyle = frameGradient;
        ctx.fill();
        
        // Left support
        ctx.beginPath();
        ctx.moveTo(startX - 80, startY + 10);
        ctx.lineTo(startX - 60, startY + 80);
        ctx.lineTo(startX - 40, startY + 80);
        ctx.lineTo(startX - 60, startY + 10);
        ctx.closePath();
        ctx.fillStyle = frameGradient;
        ctx.fill();
        
        // Right support
        ctx.beginPath();
        ctx.moveTo(startX + (numBalls-1)*spacing + 80, startY + 10);
        ctx.lineTo(startX + (numBalls-1)*spacing + 60, startY + 80);
        ctx.lineTo(startX + (numBalls-1)*spacing + 40, startY + 80);
        ctx.lineTo(startX + (numBalls-1)*spacing + 60, startY + 10);
        ctx.closePath();
        ctx.fillStyle = frameGradient;
        ctx.fill();
    }

    animate();

    // Resize handling
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Recalculate positions
        const newStartX = canvas.width/2 - ((numBalls-1) * spacing)/2;
        const offsetX = newStartX - startX;
        
        // Update all ball positions
        balls.forEach(ball => {
            ball.originalX += offsetX;
            ball.x += offsetX;
        });
        startX = newStartX;
    });
});