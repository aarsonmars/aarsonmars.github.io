/**
 * Mobile Controls Handler
 * Adds touch-specific controls and optimizations for mobile devices
 */

document.addEventListener('DOMContentLoaded', () => {
    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('Mobile device detected. Enabling touch controls.');
        enableTouchControls();
        optimizeForMobile();
    }
});

// Enable touch controls for the game
function enableTouchControls() {
    // Canvas touch handler for flapping
    const canvas = document.getElementById('myCanvas');
    if (canvas) {
        // Use touchstart event instead of click for faster response on mobile
        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Prevent default touch behavior
            
            // Directly trigger clickGamePlay function from sketch.js
            if (typeof clickGamePlay === 'function') {
                clickGamePlay();
            }
            
            // If using the newer game implementation
            if (window.game && window.game.gameState === 'playing') {
                window.game.bird.flap();
                window.game.createFlapEffect();
            }
        });
    }
    
    // Add touch handlers to buttons
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Prevent double-firing with click events
        });
    }
    
    // Planet selection touch handlers
    const planetOptions = document.querySelectorAll('.planet-option');
    planetOptions.forEach(option => {
        option.addEventListener('touchstart', function(e) {
            e.preventDefault();
            
            // Remove selected class from all options
            planetOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to touched option
            this.classList.add('selected');
            
            // Update start button text
            updateStartButtonText();
        });
    });
    
    // Game over screen touch handler
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
        gameOverScreen.addEventListener('touchstart', function(e) {
            e.preventDefault();
            
            // Only handle if game is in game over state
            if (typeof gameover !== 'undefined' && gameover) {
                gameover = false;
                
                // Reset game state in sketch.js
                if (typeof createPipes === 'function') {
                    createPipes();
                }
            }
            
            // For newer game implementation
            if (window.game && window.game.gameState === 'gameOver') {
                window.game.gameState = 'menu';
                const startScreen = document.getElementById('startScreen');
                if (startScreen) startScreen.classList.remove('hidden');
                gameOverScreen.classList.add('hidden');
            }
        });
    }
}

// Update start button text based on selected planet
function updateStartButtonText() {
    const selectedPlanet = document.querySelector('.planet-option.selected');
    const startBtn = document.getElementById('start-game-btn');
    if (selectedPlanet && startBtn) {
        const planetName = selectedPlanet.dataset.name;
        startBtn.textContent = `Play on ${planetName}`;
        
        // Update gravity if possible
        if (typeof gravity !== 'undefined') {
            const gravityValue = parseFloat(selectedPlanet.dataset.gravity);
            gravity = gravityValue;
            
            // Update gravity display
            const gravityElement = document.getElementById('gravity');
            if (gravityElement) {
                gravityElement.textContent = planetName;
            }
            
            const gravityText = document.getElementById('gravityText');
            if (gravityText) {
                gravityText.innerHTML = 'Gravity: <span id="gravity">' + planetName + '</span>';
            }
        }
    }
}

// Optimize the game for mobile devices
function optimizeForMobile() {
    // Apply mobile-specific CSS class to body
    document.body.classList.add('mobile-device');
    
    // Adjust canvas size based on screen dimensions
    fitCanvasToScreen();
    
    // Handle orientation changes
    window.addEventListener('resize', fitCanvasToScreen);
    window.addEventListener('orientationchange', fitCanvasToScreen);
    
    // Add a "tap anywhere to play" hint
    addTapHint();
    
    // Disable debug button on mobile (it's too small)
    const debugBtn = document.querySelector('button');
    if (debugBtn && debugBtn.textContent === 'Debug') {
        debugBtn.style.display = 'none';
    }
    
    // Fix for mobile scrolling issues
    document.addEventListener('touchmove', function(e) {
        if (e.target.id !== 'planet-selector') {
            e.preventDefault();
        }
    }, { passive: false });
}

// Fit canvas to screen size
function fitCanvasToScreen() {
    const canvas = document.getElementById('myCanvas');
    const main = document.querySelector('main');
    
    if (canvas && main) {
        // Check if we're in portrait or landscape
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (isPortrait) {
            // Portrait mode - make canvas smaller but keep aspect ratio
            const maxWidth = Math.min(window.innerWidth * 0.9, 500);
            canvas.style.width = maxWidth + 'px';
            canvas.style.height = 'auto';
            
            // Make planet selector smaller
            const planetSelector = document.getElementById('planet-selector');
            if (planetSelector) {
                planetSelector.classList.add('portrait-layout');
            }
        } else {
            // Landscape mode - optimize for gameplay
            const maxWidth = Math.min(window.innerWidth * 0.85, 800);
            canvas.style.width = maxWidth + 'px';
            canvas.style.height = 'auto';
            
            // Remove portrait-specific classes
            const planetSelector = document.getElementById('planet-selector');
            if (planetSelector) {
                planetSelector.classList.remove('portrait-layout');
            }
        }
        
        // Make sure the canvas internal dimensions match its display size
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
        
        if (needResize && !isNaN(displayWidth) && !isNaN(displayHeight)) {
            // Set canvas internal size to match CSS size
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            
            // Update width/height variables in sketch.js if they exist
            if (typeof width !== 'undefined' && typeof height !== 'undefined') {
                width = displayWidth;
                height = displayHeight;
                
                // Redraw game elements
                if (typeof createPipes === 'function') {
                    createPipes();
                }
            }
        }
        
        // Make sure we update the game when the canvas size changes
        if (window.game && typeof window.game.draw === 'function') {
            setTimeout(() => {
                window.game.draw();
            }, 100);
        }
    }
}

// Add a tap hint for mobile users
function addTapHint() {
    // Create tap hint element
    const tapHint = document.createElement('div');
    tapHint.id = 'tap-hint';
    tapHint.className = 'tap-hint';
    tapHint.innerHTML = `
        <div class="tap-icon">👆</div>
        <div class="tap-text">Tap to Flap</div>
    `;
    
    // Add to DOM
    document.body.appendChild(tapHint);
    
    // Show for 3 seconds then fade out
    setTimeout(() => {
        tapHint.classList.add('fade-out');
        setTimeout(() => {
            tapHint.classList.add('hidden');
        }, 1000);
    }, 3000);
}

// Add compatibility layer with sketch.js
function integrateWithSketchJs() {
    // Override the clickGamePlay function to work better with touch
    if (typeof clickGamePlay === 'function') {
        const originalClickGamePlay = clickGamePlay;
        window.clickGamePlay = function() {
            // Add a small delay on touch to prevent double-triggering
            if (window.lastTouchTime && Date.now() - window.lastTouchTime < 300) {
                return;
            }
            window.lastTouchTime = Date.now();
            
            originalClickGamePlay();
        };
    }
    
    // Override the controlGamePlay function to add better animation
    if (typeof controlGamePlay === 'function') {
        const originalControlGamePlay = controlGamePlay;
        window.controlGamePlay = function() {
            originalControlGamePlay();
            
            // Add flap animation if bird exists
            if (typeof ball !== 'undefined') {
                // Create simple flap effect (optional)
            }
        };
    }
}

// Call the integration function when the document is ready
document.addEventListener('DOMContentLoaded', integrateWithSketchJs);
