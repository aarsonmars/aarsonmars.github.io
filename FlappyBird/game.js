class FlappyBirdGame {
    constructor(options = {}) {
        // Game configuration
        this.config = {
            usePlaceholders: true, // Use placeholder images by default
            ...options
        };
        
        this.canvas = document.getElementById('myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // Replace level with gravity/planet settings - now using reduced gravity
        this.gravityElement = document.getElementById('gravity');
        this.planetName = "Earth";
        this.gravityFactor = 0.5; // Default Earth gravity (scaled down from 1.0)
        this.planetColor = "#4287f5"; // Default Earth blue
        
        // Game state - set to "menu" (not "start") by default to show the planet menu
        this.gameState = 'menu'; // start, playing, gameOver
        this.score = 0;
        this.level = 1;
        this.pipeGap = 180;
        this.pipeDistance = 250;
        
        // Create bird
        this.bird = new Bird(this.canvas, 100, this.canvas.height / 2 - 30);
        
        // Pipes array
        this.pipes = [];
        
        // Background & ground images
        this.loadGameImages();
        
        // Add flag to track if all images are loaded
        this.imagesLoaded = false;
        
        // Game loop
        this.lastTime = 0;
        
        // Bind event handlers
        this.handleClick = this.handleClick.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        
        // Set up event listeners
        this.canvas.addEventListener('click', this.handleClick);
        document.addEventListener('keyup', this.handleKeyPress);
        this.startScreen.addEventListener('click', this.handleClick);
        this.gameOverScreen.addEventListener('click', this.handleClick);
        
        // Initial draw with loading screen
        this.startScreen.style.display = "block";
        
        // Make game globally accessible for image reloading
        window.game = this;
        
        // Generate placeholders regardless of whether images exist
        this.ensurePlaceholders(true);
        
        // If using placeholders by default, apply them immediately
        if (this.config.usePlaceholders && window.placeholderImages) {
            this.reloadImages();
            setTimeout(() => this.onImagesLoaded(), 100);
        } else {
            this.loadImages();
        }
        
        // Background settings
        this.bgScrollPosition = 0;  // X position for scrolling background
        this.bgScrollSpeed = 0.5;   // Speed multiplier for background scrolling
        
        // Add mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Adjust game parameters for mobile if needed
        if (this.isMobile) {
            this.initMobileSettings();
        }
    }
    
    ensurePlaceholders(force = false) {
        // Generate placeholders if they don't exist or if forced
        if (typeof generateAndApplyPlaceholders === 'function' && 
            (force || !window.placeholderImages)) {
            generateAndApplyPlaceholders();
        }
    }
    
    loadGameImages() {
        // Background
        this.bgImage = new Image();
        
        // Choose image source based on config
        if (this.config.usePlaceholders && window.placeholderImages && window.placeholderImages.background) {
            this.bgImage.src = window.placeholderImages.background;
        } else {
            this.bgImage.src = './img/background.png';
        }
        
        this.bgPattern = null;
        this.bgLoaded = false;
        
        this.bgImage.onload = () => {
            this.bgLoaded = true;
            console.log('Background image loaded, dimensions:', this.bgImage.width, 'x', this.bgImage.height);
        };
        
        this.bgImage.onerror = () => {
            console.log('Failed to load background image, using placeholder');
            this.useBackgroundPlaceholder();
        };
        
        // Ground
        this.groundImage = new Image();
        
        // Choose image source based on config
        if (this.config.usePlaceholders && window.placeholderImages && window.placeholderImages.ground) {
            this.groundImage.src = window.placeholderImages.ground;
        } else {
            this.groundImage.src = './img/ground.png';
        }
        
        this.groundHeight = 50;
        this.groundPos = 0;
        this.groundLoaded = false;
        
        this.groundImage.onload = () => {
            this.groundLoaded = true;
        };
        
        this.groundImage.onerror = () => {
            console.log('Failed to load ground image, using placeholder');
            this.useGroundPlaceholder();
        };
    }
    
    useBackgroundPlaceholder() {
        if (window.placeholderImages && window.placeholderImages.background) {
            this.bgImage = new Image();
            this.bgImage.src = window.placeholderImages.background;
            this.bgLoaded = true;
            
            // Try to create pattern with the placeholder
            this.bgImage.onload = () => {
                try {
                    this.bgPattern = this.ctx.createPattern(this.bgImage, 'repeat');
                } catch (e) {
                    console.log('Could not create background pattern with placeholder:', e);
                }
            };
        }
    }
    
    useGroundPlaceholder() {
        if (window.placeholderImages && window.placeholderImages.ground) {
            this.groundImage = new Image();
            this.groundImage.src = window.placeholderImages.ground;
            this.groundLoaded = true;
        }
    }
    
    reloadImages() {
        // Force immediate placeholder generation if needed
        this.ensurePlaceholders();
        
        if (window.placeholderImages) {
            // Use background placeholder
            this.useBackgroundPlaceholder();
            
            // Use ground placeholder
            this.useGroundPlaceholder();
            
            // Reload bird image
            if (this.bird) {
                this.bird.reloadImage();
            }
            
            // Reload pipe images
            for (const pipe of this.pipes) {
                if (pipe.reloadImages) {
                    pipe.reloadImages();
                }
            }
        }
    }
    
    loadImages() {
        // Create an array of all images used in the game
        const images = [this.bgImage, this.groundImage];
        if (this.bird && this.bird.image) {
            images.push(this.bird.image);
        }
        
        // Count loaded images
        let loadedCount = 0;
        let totalImages = images.length;
        
        // Set up load event for each image
        images.forEach(img => {
            // If already complete, increment counter
            if (img.complete) {
                loadedCount++;
                if (loadedCount === totalImages) {
                    this.onImagesLoaded();
                }
            } else {
                // Set up load handler
                const originalOnload = img.onload;
                img.onload = () => {
                    if (originalOnload) originalOnload();
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        this.onImagesLoaded();
                    }
                };
                
                // Set up error handler
                const originalOnerror = img.onerror;
                img.onerror = () => {
                    if (originalOnerror) originalOnerror();
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        this.onImagesLoaded();
                    }
                };
            }
        });
        
        // Fallback if images don't load within 3 seconds
        setTimeout(() => {
            if (!this.imagesLoaded) {
                this.onImagesLoaded();
            }
        }, 3000);
    }
    
    onImagesLoaded() {
        if (!this.imagesLoaded) {
            this.imagesLoaded = true;
            
            // Don't change the start screen text - leave the planet selector visible
            // this.startScreen.textContent = "Click to Start";
            
            // Create background pattern if needed
            if (this.bgImage.complete && !this.bgPattern) {
                try {
                    this.bgPattern = this.ctx.createPattern(this.bgImage, 'repeat');
                } catch (e) {
                    console.log('Could not create background pattern on load:', e);
                }
            }
            
            // Initial draw - show the game behind the planet selection menu
            this.draw();
        }
    }
    
    setGravity(gravityFactor, planetName, planetColor) {
        this.gravityFactor = gravityFactor;
        this.planetName = planetName;
        this.planetColor = planetColor;
        
        if (this.bird) {
            this.bird.setGravity(gravityFactor, planetName);
        }
        
        // Update UI
        if (this.gravityElement) {
            this.gravityElement.textContent = planetName;
            this.gravityElement.style.color = planetColor;
        }
        
        // Adjust pipe speed based on scaled gravity
        // Keep it fairly responsive even at lower gravity
        const pipeSpeedFactor = Math.sqrt(gravityFactor * 2);
        this.baseSpeed = Math.min(5, 2 + pipeSpeedFactor);
        
        // Update pipe gap based on gravity (inversely proportional)
        // Adjusted for better gameplay at lower gravities
        this.pipeGap = Math.max(100, Math.min(250, 160 / Math.sqrt(gravityFactor)));
        
        // Update pipe distance based on celestial body
        if (planetName === 'Moon') {
            // Significantly increase pipe distance for Moon (low gravity environment)
            this.pipeDistance = 650; // Much more space between pipes on the Moon
        } else if (gravityFactor < 0.5) {
            // For other low gravity planets
            this.pipeDistance = 300;
        } else if (gravityFactor >= 1.5) {
            // For high gravity planets, put pipes closer
            this.pipeDistance = 300;
        } else {
            // Default pipe distance for medium gravity
            this.pipeDistance = 350;
        }
        
        // Update the background scrolling speed
        this.bgScrollSpeed = Math.min(2, 0.4 + gravityFactor * 0.2);
        
        // Set celestial body specific background
        this.setCelestialBackground(planetName);
    }
    
    setCelestialBackground(planetName) {
        // Define background colors and styles for each celestial body
        const celestialBackgrounds = {
            'Moon': {
                skyColor1: '#000000', // Black space
                skyColor2: '#1A1A2E', // Dark blue space
                groundColor: '#D1D1D1', // Gray moon dust
                grassColor: '#A0A0A0', // No grass on moon
                particleColor: 'rgba(220, 220, 220, 0.7)', // Moon dust particles
                atmosphereOpacity: 0.05 // Thin atmosphere
            },
            'Earth': {
                skyColor1: '#64B4FF', // Blue sky
                skyColor2: '#C8F0FF', // Light blue
                groundColor: '#7A5230', // Brown dirt
                grassColor: '#4CAF50', // Green grass
                particleColor: 'rgba(255, 255, 255, 0.7)', // White particles
                atmosphereOpacity: 0.1 // Normal atmosphere
            },
            'Jupiter': {
                skyColor1: '#E8B247', // Jupiter orange
                skyColor2: '#D19C3B', // Darker Jupiter bands
                groundColor: '#C98523', // Dark orange
                grassColor: '#E29539', // Light orange
                particleColor: 'rgba(255, 220, 180, 0.7)', // Orange particles
                atmosphereOpacity: 0.15 // Thick atmosphere
            },
            'Sun': {
                skyColor1: '#FF4500', // Red-orange
                skyColor2: '#FF8C00', // Orange
                groundColor: '#FF0000', // Red "surface"
                grassColor: '#FF6347', // Hot "grass"
                particleColor: 'rgba(255, 200, 50, 0.9)', // Bright particles
                atmosphereOpacity: 0.2 // Very thick atmosphere
            }
        };
        
        // Set default if planet not found
        const bg = celestialBackgrounds[planetName] || celestialBackgrounds['Earth'];
        
        // Store for use in drawing
        this.celestialBackground = bg;
    }
    
    start() {
        // Only allow game to start from menu or gameover states
        if (this.gameState !== 'menu' && this.gameState !== 'gameOver') {
            return;
        }
        
        this.gameState = 'playing';
        this.score = 0;
        this.pipes = [];
        
        // Create a new bird with correct gravity
        this.bird = new Bird(this.canvas, 100, this.canvas.height / 2 - 30, this.config.usePlaceholders);
        this.bird.setGravity(this.gravityFactor, this.planetName);
        
        this.updateScore(0);
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // Set the starting pipe speed based on gravity
        this.pipeSpeed = this.baseSpeed || 3;
        
        // Start game loop
        this.lastTime = performance.now(); // Reset time for smooth animation
        requestAnimationFrame(this.gameLoop.bind(this));
        
        // Reset background scroll position when starting a new game
        this.bgScrollPosition = 0;
        
        // Add a visual feedback for the planet environment
        this.addPlanetAtmosphereEffect();
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (this.gameState === 'playing') {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw background
            this.drawBackground();
            
            // Update pipes
            this.updatePipes();
            
            // Update bird
            this.bird.update();
            
            // Check for collisions
            this.checkCollisions();
            
            // Draw everything
            this.draw();
            
            // Update and draw particles
            this.updateParticles();
            
            // Continue game loop
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    updatePipes() {
        // Add new pipes if needed
        if (this.pipes.length === 0 || 
            this.canvas.width - this.pipes[this.pipes.length - 1].x > this.pipeDistance) {
            const minHeight = 50;
            const maxHeight = this.canvas.height - this.pipeGap - minHeight - this.groundHeight;
            const gapHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            
            const pipe = new Pipe(
                this.canvas, 
                this.canvas.width, 
                this.pipeGap, 
                gapHeight,
                this.config.usePlaceholders
            );
            
            // Set pipe speed based on gravity
            pipe.speed = this.pipeSpeed;
            
            this.pipes.push(pipe);
        }
        
        // Update and remove off-screen pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].update();
            
            // Check if pipe is passed for scoring
            if (this.pipes[i].checkPassed(this.bird.x)) {
                this.updateScore(this.score + 1);
            }
            
            // Remove pipes that are off screen
            if (this.pipes[i].isOffScreen()) {
                this.pipes.splice(i, 1);
            }
        }
        
        // Move ground for parallax effect
        this.groundPos = (this.groundPos - 2) % 24; // 24 is the repeat width of ground pattern
        
        // Scroll background along with the game
        this.bgScrollPosition += this.pipes.length > 0 ? 
            this.pipes[0].speed * this.bgScrollSpeed : this.bgScrollSpeed;
            
        // Reset background position if it exceeds the image width
        if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
            if (this.bgScrollPosition >= this.bgImage.width) {
                this.bgScrollPosition = 0;
            }
        }
    }
    
    checkCollisions() {
        const birdBounds = this.bird.getBounds();
        
        // Apply mobile hitbox forgiveness if applicable
        if (this.isMobile && this.hitboxForgiveness) {
            birdBounds.left += this.hitboxForgiveness;
            birdBounds.top += this.hitboxForgiveness;
            birdBounds.right -= this.hitboxForgiveness;
            birdBounds.bottom -= this.hitboxForgiveness;
        }
        
        // Check for pipe collisions
        for (const pipe of this.pipes) {
            if (pipe.checkCollision(birdBounds)) {
                this.gameOver();
                return;
            }
        }
        
        // Check for ground collision
        if (birdBounds.bottom > this.canvas.height - this.groundHeight) {
            this.gameOver();
            return;
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = `Score: ${this.score} on ${this.planetName}`;
        this.gameOverScreen.classList.remove('hidden');
        
        // Remove planet atmosphere effect
        const planetAtmosphere = document.getElementById('planet-atmosphere');
        if (planetAtmosphere) {
            planetAtmosphere.parentNode.removeChild(planetAtmosphere);
        }
    }
    
    draw() {
        // Draw background and ground
        this.drawBackground();
        
        // Draw pipes
        for (const pipe of this.pipes) {
            pipe.draw();
        }
        
        // Draw bird
        this.bird.draw();
        
        // Draw ground
        this.drawGround();
    }
    
    drawBackground() {
        try {
            // Handle large scrolling background
            if (this.bgLoaded && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
                // Calculate the vertical position to center the background
                const bgHeight = this.bgImage.height;
                const canvasHeight = this.canvas.height - this.groundHeight;
                
                // Center the background vertically
                const yOffset = Math.max(0, (bgHeight - canvasHeight) / 2);
                
                // Draw the background with scrolling
                this.ctx.drawImage(
                    this.bgImage,
                    this.bgScrollPosition, // Source X (scrolling position)
                    yOffset, // Source Y (center vertically)
                    this.canvas.width, // Source width (viewport width)
                    canvasHeight, // Source height (viewport height)
                    0, // Destination X
                    0, // Destination Y
                    this.canvas.width, // Destination width
                    canvasHeight // Destination height
                );
                
                // If we're near the end of the image, draw the beginning part too for seamless loop
                if (this.bgScrollPosition + this.canvas.width > this.bgImage.width) {
                    const remainingWidth = this.bgImage.width - this.bgScrollPosition;
                    this.ctx.drawImage(
                        this.bgImage,
                        0, // Start from beginning of the image
                        yOffset,
                        this.canvas.width - remainingWidth, // Only draw the remaining width needed
                        canvasHeight,
                        remainingWidth, // Position after the first part
                        0,
                        this.canvas.width - remainingWidth,
                        canvasHeight
                    );
                }
            } else {
                // Fall back to simple background if image isn't loaded
                throw new Error('Background image not loaded');
            }
        } catch (e) {
            console.error('Error drawing background:', e);
            // Fallback to simple sky gradient
            this.drawFallbackBackground();
        }
    }
    
    drawFallbackBackground() {
        const bg = this.celestialBackground || {
            skyColor1: '#64B4FF',
            skyColor2: '#C8F0FF'
        };
        
        // Create a sky gradient using the celestial body colors
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height - this.groundHeight);
        gradient.addColorStop(0, bg.skyColor1);
        gradient.addColorStop(1, bg.skyColor2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - this.groundHeight);
        
        // Draw celestial features based on planet
        if (this.planetName === 'Moon') {
            this.drawMoonBackground();
        } else if (this.planetName === 'Sun') {
            this.drawSunBackground();
        } else if (this.planetName === 'Jupiter') {
            this.drawJupiterBackground();
        } else {
            this.drawEarthBackground();
        }
    }
    
    drawMoonBackground() {
        // Draw stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * (this.canvas.height - this.groundHeight);
            const size = Math.random() * 2;
            
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw craters
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.canvas.width;
            const y = 20 + Math.random() * (this.canvas.height - this.groundHeight - 40);
            const size = 5 + Math.random() * 15;
            
            // Crater rim
            this.ctx.fillStyle = '#A0A0A0';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Crater depression
            this.ctx.fillStyle = '#808080';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawSunBackground() {
        // Draw solar flares
        const time = Date.now() * 0.0001;
        for (let i = 0; i < 5; i++) {
            const x = ((i * 200) + Math.sin(time + i) * 100) % this.canvas.width;
            const y = 30 + i * 40 + Math.sin(time * 2 + i) * 20;
            
            // Draw flame
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            const height = 50 + Math.sin(time * 3 + i) * 20;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x - 20, y);
            this.ctx.quadraticCurveTo(x, y - height, x + 20, y);
            this.ctx.fill();
        }
        
        // Draw sun spots
        for (let i = 0; i < 8; i++) {
            const x = (i * this.canvas.width / 8 + time * 100) % this.canvas.width;
            const y = this.canvas.height / 3 + Math.sin(x / 50) * 30;
            const size = 5 + Math.random() * 10;
            
            this.ctx.fillStyle = 'rgba(150, 50, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawJupiterBackground() {
        // Draw Jupiter's bands
        const y1 = this.canvas.height / 5;
        const y2 = this.canvas.height / 2.5;
        const y3 = this.canvas.height / 1.5;
        
        // Band 1
        this.ctx.fillStyle = 'rgba(200, 130, 60, 0.3)';
        this.ctx.fillRect(0, y1, this.canvas.width, 50);
        
        // Band 2
        this.ctx.fillStyle = 'rgba(210, 150, 70, 0.3)';
        this.ctx.fillRect(0, y2, this.canvas.width, 70);
        
        // Band 3
        this.ctx.fillStyle = 'rgba(220, 170, 80, 0.3)';
        this.ctx.fillRect(0, y3, this.canvas.width, 60);
        
        // Jupiter's great red spot
        const time = Date.now() * 0.00005;
        const spotX = (this.canvas.width + 100 - time * 50) % (this.canvas.width + 200) - 100;
        
        this.ctx.fillStyle = 'rgba(200, 60, 20, 0.5)';
        this.ctx.beginPath();
        this.ctx.ellipse(spotX, y2 + 35, 60, 30, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawEarthBackground() {
        // Draw some clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const time = Date.now() * 0.0001;
        for (let i = 0; i < 5; i++) {
            const x = ((i * 200) + Math.sin(time + i) * 50) % this.canvas.width;
            const y = 30 + i * 20 + Math.sin(time * 2 + i) * 10;
            const size = 20 + i * 10;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + size * 0.7, y, size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x - size * 0.7, y, size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawGround() {
        try {
            if (this.groundLoaded && this.groundImage.complete && this.groundImage.naturalWidth > 0) {
                // Draw repeating ground
                const groundWidth = this.groundImage.width || 24;
                for (let i = this.groundPos; i < this.canvas.width; i += groundWidth) {
                    this.ctx.drawImage(
                        this.groundImage, 
                        i, 
                        this.canvas.height - this.groundHeight, 
                        groundWidth, 
                        this.groundHeight
                    );
                }
            } else {
                throw new Error('Ground image not loaded');
            }
        } catch (e) {
            console.error('Error drawing ground:', e);
            // Draw a simple ground
            this.drawFallbackGround();
        }
    }
    
    drawFallbackGround() {
        const bg = this.celestialBackground || {
            groundColor: '#7A5230',
            grassColor: '#4CAF50'
        };
        
        // Draw dirt with celestial body color
        this.ctx.fillStyle = bg.groundColor;
        this.ctx.fillRect(0, this.canvas.height - this.groundHeight, this.canvas.width, this.groundHeight);
        
        // Only draw grass on Earth (or default)
        if (this.planetName === 'Earth' || !this.planetName) {
            // Draw grass on top
            this.ctx.fillStyle = bg.grassColor;
            this.ctx.fillRect(0, this.canvas.height - this.groundHeight, this.canvas.width, 12);
            
            // Add texture to grass
            this.ctx.fillStyle = '#8BC34A'; // Light green
            for (let i = 0; i < this.canvas.width; i += 24) {
                const height = 3 + Math.random() * 5;
                const width = 1 + Math.random() * 3;
                this.ctx.fillRect(i, this.canvas.height - this.groundHeight, width, height);
            }
        } else {
            // For non-Earth bodies, add texture to the ground
            const textureColor = this.planetName === 'Moon' ? 'rgba(0, 0, 0, 0.2)' :
                                this.planetName === 'Jupiter' ? 'rgba(255, 220, 150, 0.2)' :
                                this.planetName === 'Sun' ? 'rgba(255, 255, 0, 0.3)' : 
                                'rgba(0, 0, 0, 0.2)';
            
            this.ctx.fillStyle = textureColor;
            for (let i = 0; i < this.canvas.width; i += 15) {
                const y = this.canvas.height - this.groundHeight + Math.random() * this.groundHeight;
                const size = 1 + Math.random() * 3;
                this.ctx.fillRect(i, y, size, size);
            }
        }
    }
    
    updateScore(newScore) {
        this.score = newScore;
        this.scoreElement.textContent = `Score: ${this.score}`;
        
        // Increase difficulty with score, but based on gravity setting
        if (this.score > 0 && this.score % 5 === 0) {
            this.increaseDifficulty();
        }
    }
    
    increaseDifficulty() {
        // Gradually reduce pipe gap (but don't go too small)
        this.pipeGap = Math.max(80, this.pipeGap - 5);
        
        // Increase pipe speed
        this.pipeSpeed = Math.min(8, this.pipeSpeed + 0.2);
        for (const pipe of this.pipes) {
            pipe.speed = this.pipeSpeed;
        }
        
        // Increase background scroll speed too
        this.bgScrollSpeed = Math.min(2.5, this.bgScrollSpeed + 0.1);
        
        console.log(`Difficulty increased: Gap=${this.pipeGap}, Speed=${this.pipeSpeed}`);
    }
    
    handleClick(event) {
        // Prevent default on mobile to avoid double-triggering
        if (this.isMobile && event.type === 'click' && event.pointerType === 'touch') {
            return; // Skip processing duplicate touch events
        }
        
        switch (this.gameState) {
            case 'menu':
                // Don't start on menu click - let the start button handle it
                break;
            case 'playing':
                // On mobile, enforce minimum time between flaps
                if (this.isMobile) {
                    const now = Date.now();
                    if (now - this.lastFlapTime < this.minFlapInterval) {
                        return; // Too soon after last flap
                    }
                    this.lastFlapTime = now;
                }
                
                this.bird.flap();
                this.createFlapEffect();
                break;
            case 'gameOver':
                // When game over, go back to menu (planet selection)
                this.gameState = 'menu';
                this.startScreen.classList.remove('hidden');
                this.gameOverScreen.classList.add('hidden');
                break;
        }
    }
    
    handleKeyPress(e) {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
            if (this.gameState === 'playing') {
                this.bird.flap();
                this.createFlapEffect();
            } else if (this.gameState === 'gameOver') {
                // On game over, show start screen again to choose planet
                this.gameState = 'menu';
                this.startScreen.classList.remove('hidden');
                this.gameOverScreen.classList.add('hidden');
            }
            // Don't start the game on space/arrow key when in menu
        }
    }
    
    // Method to toggle between real and placeholder images
    toggleImageSource(usePlaceholders) {
        this.config.usePlaceholders = usePlaceholders;
        
        // Make sure placeholders exist
        this.ensurePlaceholders(true);
        
        // Reload images with the new source preference
        this.loadGameImages();
        
        // Apply to existing game objects
        if (this.bird) {
            if (usePlaceholders && window.placeholderImages && window.placeholderImages.bird) {
                this.bird.usePlaceholder();
            } else {
                this.bird.useRealImage();
            }
        }
        
        // Update pipes
        for (const pipe of this.pipes) {
            if (usePlaceholders && window.placeholderImages) {
                pipe.useTopPlaceholder();
                pipe.useBottomPlaceholder();
            } else {
                pipe.useRealImages();
            }
        }
    }
    
    // Create a visual effect when the bird flaps
    createFlapEffect() {
        // Create a small "whoosh" effect around the bird
        const birdCenter = {
            x: this.bird.x + this.bird.width/2,
            y: this.bird.y + this.bird.height/2
        };
        
        // Get particle color for the current celestial body
        const bg = this.celestialBackground || { particleColor: 'rgba(255, 255, 255, 0.7)' };
        const particleColor = bg.particleColor;
        
        // Add particles behind the bird to simulate air movement
        for (let i = 0; i < 5; i++) {
            const particle = {
                x: birdCenter.x - this.bird.width/2,
                y: birdCenter.y + (Math.random() - 0.5) * this.bird.height,
                size: 2 + Math.random() * 3,
                life: 10 + Math.random() * 10,
                maxLife: 20,
                vx: -2 - Math.random() * 2,
                vy: (Math.random() - 0.5) * 2,
                color: particleColor
            };
            
            // If we don't already have an particles array, create one
            if (!this.particles) {
                this.particles = [];
            }
            
            this.particles.push(particle);
        }
    }
    
    // Update and draw particles
    updateParticles() {
        if (!this.particles || this.particles.length === 0) return;
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Move particle
            p.x += p.vx;
            p.y += p.vy;
            
            // Reduce life
            p.life--;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Draw particles
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            // Use the particle's specific color if available, else use white
            this.ctx.fillStyle = p.color || `rgba(255, 255, 255, ${alpha * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    addPlanetAtmosphereEffect() {
        // Add a subtle color overlay to simulate planet atmosphere
        const overlay = document.createElement('div');
        overlay.id = 'planet-atmosphere';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = this.planetColor;
        
        // Set opacity based on celestial body
        const bg = this.celestialBackground || { atmosphereOpacity: 0.1 };
        overlay.style.opacity = bg.atmosphereOpacity.toString();
        
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '5';
        
        // Remove any existing overlay
        const existingOverlay = document.getElementById('planet-atmosphere');
        if (existingOverlay) {
            existingOverlay.parentNode.removeChild(existingOverlay);
        }
        
        this.canvas.parentNode.appendChild(overlay);
    }
    
    initMobileSettings() {
        // Adjust pipe spacing for mobile devices
        this.pipeDistance = 300; // More forgiving spacing on mobile
        
        // Increase hitbox forgiveness on mobile
        this.hitboxForgiveness = 5;
        
        // Adjust minimum touch time between flaps to prevent rapid tapping
        this.minFlapInterval = 150; // milliseconds
        this.lastFlapTime = 0;
    }
    
    // Handle device orientation changes
    handleOrientationChange() {
        // Redraw the game when orientation changes
        this.draw();
        
        // Re-center the bird vertically
        if (this.gameState !== 'playing' && this.bird) {
            this.bird.y = this.canvas.height / 2 - 30;
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    // Generate placeholder images
    if (typeof generateAndApplyPlaceholders === 'function') {
        generateAndApplyPlaceholders();
    }
    
    // Create the game instance with default configuration
    const game = new FlappyBirdGame({
        usePlaceholders: true // Use placeholder images by default
    });
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (window.game) {
                window.game.handleOrientationChange();
            }
        }, 300); // Short delay to ensure dimensions have updated
    });
});
