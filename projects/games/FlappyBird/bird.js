class Bird {
    constructor(canvas, x, y, usePlaceholder = true) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 45;
        this.baseGravity = 0.25; // Reduced from 0.5 for better control
        this.gravity = this.baseGravity;
        this.velocity = 0;
        this.baseJumpStrength = -5.5; // Reduced from -8 for more nuanced control
        this.jumpStrength = this.baseJumpStrength;
        this.frameIndex = 0;
        this.flapSpeed = 5;
        this.frameCount = 0;
        
        // Flag to track image source preference
        this.usePlaceholderImages = usePlaceholder;
        
        // Load bird image
        this.image = new Image();
        
        // Use placeholder by default if available
        if (this.usePlaceholderImages && window.placeholderImages && window.placeholderImages.bird) {
            this.image.src = window.placeholderImages.bird;
        } else {
            this.image.src = './img/bird.png';
        }
        
        this.imageLoaded = false;
        
        this.image.onload = () => {
            this.imageLoaded = true;
            console.log('Bird image loaded successfully');
        };
        
        this.image.onerror = () => {
            console.log('Failed to load bird image, using placeholder');
            this.usePlaceholder();
        };
        
        // Bird animation frames
        this.frames = 3;
        
        // Create fallback colors for simple drawing
        this.bodyColor = '#FFEB3B'; // Yellow 
        this.wingColor = '#FFC107'; // Dark yellow
        this.beakColor = '#FF5722'; // Orange

        // Animation properties
        this.flapSpeed = 5; // Normal flap speed
        this.flappingTime = 0; // Track how long we've been actively flapping
        this.isFlapping = false; // Whether the bird is actively flapping
        this.flapAnimationDuration = 15; // Duration of flap animation frames
        
        // Additional properties for responsive wing movement
        this.flapStrength = 1.0; // Varies with user input timing
        this.lastFlapTime = 0; // When the user last flapped
    }

    usePlaceholder() {
        if (window.placeholderImages && window.placeholderImages.bird) {
            // Use the generated placeholder
            this.image = new Image();
            this.image.src = window.placeholderImages.bird;
            this.imageLoaded = true;
            this.usePlaceholderImages = true;
            console.log('Bird using placeholder image');
        }
    }
    
    useRealImage() {
        // Switch to real image
        this.image = new Image();
        this.image.src = './img/bird.png';
        this.usePlaceholderImages = false;
        
        // Handle load events
        this.image.onload = () => {
            this.imageLoaded = true;
            console.log('Bird image loaded successfully');
        };
        
        this.image.onerror = () => {
            console.log('Failed to load bird image, falling back to placeholder');
            this.usePlaceholder();
        };
    }

    update() {
        // Apply gravity
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // Handle animation - make wings respond to velocity and flapping
        this.frameCount++;
        
        // When actively flapping (right after user input), animate wings quickly
        if (this.isFlapping) {
            // Count down the active flapping time
            this.flappingTime--;
            
            // Force frame to go through the sequence 0->1->2
            if (this.flappingTime <= 0) {
                this.isFlapping = false;
                // Go to natural gliding animation
            } else if (this.flappingTime > this.flapAnimationDuration * 0.66) {
                this.frameIndex = 0; // Wings up
            } else if (this.flappingTime > this.flapAnimationDuration * 0.33) {
                this.frameIndex = 1; // Wings middle
            } else {
                this.frameIndex = 2; // Wings down
            }
        } 
        // When falling or gliding, animate wings based on velocity
        else {
            // Make wings go up when rising and down when falling
            if (this.frameCount >= this.flapSpeed) {
                this.frameCount = 0;
                
                if (this.velocity < -2) {
                    // Rising quickly - wings up
                    this.frameIndex = 0;
                } else if (this.velocity < 2) {
                    // Neutral/slow - wings middle
                    this.frameIndex = 1;
                } else {
                    // Falling - wings down
                    this.frameIndex = 2;
                }
            }
        }
        
        // Prevent bird from going off the top of the screen
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    }

    draw() {
        try {
            if (this.imageLoaded && this.image.complete && this.image.naturalWidth > 0) {
                // Draw from sprite sheet
                const frameHeight = this.image.height / this.frames;
                
                this.ctx.drawImage(
                    this.image,
                    0,
                    this.frameIndex * frameHeight, 
                    this.image.width,
                    frameHeight,
                    this.x,
                    this.y,
                    this.width,
                    this.height
                );
            } else {
                // Fallback to simple drawing
                this.drawFallbackBird();
            }
        } catch (e) {
            console.error('Error drawing bird:', e);
            this.drawFallbackBird();
        }
    }
    
    drawFallbackBird() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Draw body
        this.ctx.fillStyle = this.bodyColor;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, this.width/2 - 5, this.height/2 - 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw wing - position based on frame and flapping state
        this.ctx.fillStyle = this.wingColor;
        this.ctx.beginPath();
        
        // Wing animation is more exaggerated during active flapping
        const wingOffset = this.isFlapping ? 1.5 : 1.0;
        
        if (this.frameIndex === 0) {
            // Wing up (active flap or rising)
            const wingHeight = this.isFlapping ? this.height/5 : this.height/6;
            this.ctx.ellipse(
                centerX - 5, 
                centerY - 8 * wingOffset, 
                this.width/4, 
                wingHeight, 
                Math.PI/4, 
                0, 
                Math.PI * 2
            );
        } else if (this.frameIndex === 1) {
            // Wing middle (neutral)
            this.ctx.ellipse(
                centerX - 5, 
                centerY, 
                this.width/4, 
                this.height/6, 
                0, 
                0, 
                Math.PI * 2
            );
        } else {
            // Wing down (falling or end of flap)
            const wingHeight = this.isFlapping ? this.height/5 : this.height/6;
            this.ctx.ellipse(
                centerX - 5, 
                centerY + 8 * wingOffset, 
                this.width/4, 
                wingHeight, 
                -Math.PI/4, 
                0, 
                Math.PI * 2
            );
        }
        this.ctx.fill();
        
        // Draw eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(centerX + 10, centerY - 5, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(centerX + 12, centerY - 5, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw beak
        this.ctx.fillStyle = this.beakColor;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + 15, centerY - 3);
        this.ctx.lineTo(centerX + 25, centerY);
        this.ctx.lineTo(centerX + 15, centerY + 3);
        this.ctx.closePath();
        this.ctx.fill();
    }

    flap() {
        // Calculate flap strength based on timing
        const now = Date.now();
        const timeSinceLastFlap = now - this.lastFlapTime;
        this.lastFlapTime = now;
        
        // Rapid clicking gives less strength, spaced clicks give more
        // On mobile, be more forgiving with the timing
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const minGoodInterval = isMobile ? 150 : 200;
        
        if (timeSinceLastFlap < minGoodInterval) {
            // Rapid clicking, reduce effectiveness, but not as much on mobile
            const reduction = isMobile ? 0.95 : 0.9;
            this.flapStrength = Math.max(0.8, this.flapStrength * reduction);
        } else {
            // Well-timed flapping, increase effectiveness
            const boost = isMobile ? 1.05 : 1.1;
            this.flapStrength = Math.min(1.2, this.flapStrength * boost);
        }
        
        // Apply jump velocity with strength modifier (and consider current velocity)
        // Improved formula for better feel across different gravities
        const velocityScale = Math.min(1, Math.abs(this.velocity / 8) + 0.7);
        this.velocity = this.jumpStrength * this.flapStrength * velocityScale;
        
        // Start the flapping animation sequence
        this.isFlapping = true;
        this.flappingTime = this.flapAnimationDuration;
        this.frameIndex = 0; // Start with wings up
        
        // Vibrate device for tactile feedback on mobile
        if (isMobile && navigator.vibrate) {
            navigator.vibrate(10); // Subtle vibration
        }
    }

    getBounds() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const margin = isMobile ? 7 : 5; // More forgiving on mobile
        
        return {
            left: this.x + margin,
            top: this.y + margin,
            right: this.x + this.width - margin,
            bottom: this.y + this.height - margin
        };
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.frameIndex = 1; // Middle position
        this.isFlapping = false;
        this.flappingTime = 0;
        this.flapStrength = 1.0;
        this.lastFlapTime = 0;
    }

    reloadImage() {
        if (this.usePlaceholderImages && window.placeholderImages && window.placeholderImages.bird) {
            this.image.src = window.placeholderImages.bird;
            this.imageLoaded = true;
        }
    }
    
    setGravity(gravityFactor, planetName) {
        // Scale gravity based on the celestial body
        this.gravity = this.baseGravity * gravityFactor;
        
        // Adjust jump strength to be appropriate for the gravity
        // This ensures the gameplay remains challenging but fair
        this.jumpStrength = this.baseJumpStrength * Math.sqrt(gravityFactor + 0.5);
        
        // Additional adjustment for higher gravity bodies
        if (gravityFactor > 1.5) {
            // Give a bit more jump power at high gravity
            this.jumpStrength *= 1.2;
        } else if (gravityFactor < 0.2) {
            // Reduce jump power slightly at very low gravity
            this.jumpStrength *= 0.9;
        }
        
        // Adjust bird appearance based on planet
        this.setPlanetaryAppearance(planetName);
        
        console.log(`Bird gravity set to ${this.gravity} (${planetName}), jump strength: ${this.jumpStrength}`);
    }
    
    setPlanetaryAppearance(planetName) {
        // Adjust bird appearance based on the celestial body
        switch (planetName) {
            case 'Moon':
                // On moon, low gravity means slower flapping
                this.flapSpeed = 8;
                this.flapAnimationDuration = 20;
                break;
                
            case 'Sun':
                // On sun, extreme conditions mean rapid flapping
                this.flapSpeed = 3;
                this.flapAnimationDuration = 10;
                // Faster falling on sun due to extreme gravity
                this.gravity *= 1.1;
                break;
                
            case 'Jupiter':
                // On Jupiter, strong gravity but more manageable
                this.flapSpeed = 4;
                this.flapAnimationDuration = 12;
                break;
                
            default: // Earth
                this.flapSpeed = 5;
                this.flapAnimationDuration = 15;
                break;
        }
    }
}
