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
        canvas.addEventListener('touchstart', handleTouch);
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
            if (window.game && window.game.gameState === 'gameOver') {
                window.game.gameState = 'menu';
                const startScreen = document.getElementById('startScreen');
                if (startScreen) startScreen.classList.remove('hidden');
                gameOverScreen.classList.add('hidden');
            }
        });
    }
}

// Touch handler for bird flapping
function handleTouch(e) {
    e.preventDefault(); // Prevent default touch behavior
    
    if (window.game) {
        if (window.game.gameState === 'playing') {
            // Make the bird flap
            window.game.bird.flap();
            window.game.createFlapEffect();
        }
    }
}

// Update start button text based on selected planet
function updateStartButtonText() {
    const selectedPlanet = document.querySelector('.planet-option.selected');
    const startBtn = document.getElementById('start-game-btn');
    if (selectedPlanet && startBtn) {
        const planetName = selectedPlanet.dataset.name;
        startBtn.textContent = `Play on ${planetName}`;
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
        
        // Make sure we update the game when the canvas size changes
        if (window.game) {
            setTimeout(() => {
                window.game.draw();
            }, 100);
        }
    }
}

// Add a tap hint for mobile users
function addTapHint() {
    const game = window.game;
    if (!game) return;
    
    // Create tap hint element
    const tapHint = document.createElement('div');
    tapHint.id = 'tap-hint';
    tapHint.className = 'tap-hint hidden';
    tapHint.innerHTML = `
        <div class="tap-icon">👆</div>
        <div class="tap-text">Tap to Flap</div>
    `;
    
    // Add to DOM
    document.body.appendChild(tapHint);
    
    // Show the hint when the game starts
    const originalStart = game.start;
    game.start = function() {
        originalStart.call(game);
        
        // Show tap hint
        tapHint.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            tapHint.classList.add('fade-out');
            setTimeout(() => {
                tapHint.classList.add('hidden');
                tapHint.classList.remove('fade-out');
            }, 1000);
        }, 3000);
    };
}
