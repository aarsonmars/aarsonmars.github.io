/**
 * Debug Helper for Flappy Bird
 * Provides tools to debug image loading and display issues
 */

// Create a simple debug UI
function createDebugUI() {
    // Create the debug container
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.style.position = 'fixed';
    debugContainer.style.top = '0';
    debugContainer.style.right = '0';
    debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugContainer.style.color = 'white';
    debugContainer.style.padding = '10px';
    debugContainer.style.fontSize = '12px';
    debugContainer.style.zIndex = '9999';
    debugContainer.style.display = 'none';
    
    // Create a toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Debug';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '9999';
    toggleButton.style.padding = '5px';
    toggleButton.style.fontSize = '10px';
    
    // Toggle debug panel
    toggleButton.addEventListener('click', () => {
        debugContainer.style.display = 
            debugContainer.style.display === 'none' ? 'block' : 'none';
    });
    
    // Populate the debug container with updated gravity values
    debugContainer.innerHTML = `
        <h3>Space Flappy Bird Debug</h3>
        <div id="image-status"></div>
        <hr>
        <div id="image-controls">
            <h4>Image Controls</h4>
            <label>
                <input type="checkbox" id="use-placeholders" checked>
                Use Placeholder Images
            </label>
        </div>
        <hr>
        <div id="gravity-controls">
            <h4>Gravity Controls</h4>
            <label>Planet:
                <select id="planet-select">
                    <option value="0.16,Moon,#D1D1D1">Moon (0.16g)</option>
                    <option value="0.3,Mars,#E27B58">Mars (0.3g)</option>
                    <option value="0.5,Earth,#4287f5" selected>Earth (0.5g)</option>
                    <option value="1.0,Jupiter,#E8B247">Jupiter (1.0g)</option>
                    <option value="1.5,Venus,#EE82EE">Venus (1.5g)</option>
                    <option value="2.0,Sun,#FFA500">Sun (2.0g)</option>
                </select>
            </label>
            <button id="apply-gravity">Apply Gravity</button>
        </div>
        <hr>
        <div id="bird-controls">
            <h4>Bird Animation</h4>
            <label>Flap Duration: 
                <input type="range" id="flap-duration" min="5" max="30" step="1" value="15">
                <span id="flap-duration-value">15</span> frames
            </label>
            <button id="test-flap">Test Flap</button>
        </div>
        <hr>
        <div id="bg-controls">
            <h4>Background Controls</h4>
            <label>Scroll Speed: 
                <input type="range" id="bg-speed" min="0" max="5" step="0.1" value="0.5">
                <span id="bg-speed-value">0.5</span>
            </label>
            <div>
                <button id="reset-bg">Reset Position</button>
            </div>
        </div>
        <hr>
        <div id="game-controls">
            <h4>Game Controls</h4>
            <label>Pipe Gap: 
                <input type="range" id="pipe-gap" min="80" max="220" step="10" value="180">
                <span id="pipe-gap-value">180</span>px
            </label>
            <label>Pipe Speed: 
                <input type="range" id="pipe-speed" min="1" max="10" step="0.5" value="3">
                <span id="pipe-speed-value">3</span>
            </label>
        </div>
        <hr>
        <button id="reload-placeholders">Regenerate Placeholders</button>
        <button id="display-placeholders">Show Placeholders</button>
    `;
    
    // Add to document
    document.body.appendChild(debugContainer);
    document.body.appendChild(toggleButton);
    
    // Add event listeners
    document.getElementById('reload-placeholders').addEventListener('click', () => {
        if (typeof generateAndApplyPlaceholders === 'function') {
            generateAndApplyPlaceholders();
            if (window.game && window.game.reloadImages) {
                window.game.reloadImages();
            }
        }
    });
    
    document.getElementById('display-placeholders').addEventListener('click', showPlaceholderImages);
    
    // Add background control event listeners
    const bgSpeedSlider = document.getElementById('bg-speed');
    const bgSpeedValue = document.getElementById('bg-speed-value');
    
    if (bgSpeedSlider && bgSpeedValue) {
        bgSpeedSlider.addEventListener('input', () => {
            const value = parseFloat(bgSpeedSlider.value);
            bgSpeedValue.textContent = value.toFixed(1);
            
            if (window.game) {
                window.game.bgScrollSpeed = value;
            }
        });
    }
    
    const resetBgButton = document.getElementById('reset-bg');
    if (resetBgButton) {
        resetBgButton.addEventListener('click', () => {
            if (window.game) {
                window.game.bgScrollPosition = 0;
            }
        });
    }
    
    // Add image source toggle event listener
    const usePlaceholdersCheckbox = document.getElementById('use-placeholders');
    if (usePlaceholdersCheckbox && window.game) {
        // Set initial state based on game config
        usePlaceholdersCheckbox.checked = window.game.config.usePlaceholders;
        
        usePlaceholdersCheckbox.addEventListener('change', () => {
            if (window.game) {
                window.game.toggleImageSource(usePlaceholdersCheckbox.checked);
            }
        });
    }
    
    // Add bird animation controls
    const flapDurationSlider = document.getElementById('flap-duration');
    const flapDurationValue = document.getElementById('flap-duration-value');
    const testFlapButton = document.getElementById('test-flap');
    
    if (flapDurationSlider && flapDurationValue) {
        flapDurationSlider.addEventListener('input', () => {
            const value = parseInt(flapDurationSlider.value);
            flapDurationValue.textContent = value;
            
            if (window.game && window.game.bird) {
                window.game.bird.flapAnimationDuration = value;
            }
        });
    }
    
    if (testFlapButton) {
        testFlapButton.addEventListener('click', () => {
            if (window.game && window.game.bird) {
                window.game.bird.flap();
                window.game.createFlapEffect();
            }
        });
    }
    
    // Add gravity controls
    const planetSelect = document.getElementById('planet-select');
    const applyGravityButton = document.getElementById('apply-gravity');
    
    if (planetSelect && applyGravityButton && window.game) {
        applyGravityButton.addEventListener('click', () => {
            if (window.game) {
                const [gravity, name, color] = planetSelect.value.split(',');
                window.game.setGravity(parseFloat(gravity), name, color);
                
                // Don't automatically start the game - just update the gravity setting
                // The user should click the Start button to actually start
            }
        });
    }
    
    // Add game controls
    const pipeGapSlider = document.getElementById('pipe-gap');
    const pipeGapValue = document.getElementById('pipe-gap-value');
    
    if (pipeGapSlider && pipeGapValue && window.game) {
        pipeGapSlider.value = window.game.pipeGap;
        pipeGapValue.textContent = window.game.pipeGap;
        
        pipeGapSlider.addEventListener('input', () => {
            const value = parseInt(pipeGapSlider.value);
            pipeGapValue.textContent = value;
            
            if (window.game) {
                window.game.pipeGap = value;
            }
        });
    }
    
    const pipeSpeedSlider = document.getElementById('pipe-speed');
    const pipeSpeedValue = document.getElementById('pipe-speed-value');
    
    if (pipeSpeedSlider && pipeSpeedValue && window.game) {
        pipeSpeedSlider.value = window.game.pipeSpeed || 3;
        pipeSpeedValue.textContent = window.game.pipeSpeed || 3;
        
        pipeSpeedSlider.addEventListener('input', () => {
            const value = parseFloat(pipeSpeedSlider.value);
            pipeSpeedValue.textContent = value;
            
            if (window.game) {
                window.game.pipeSpeed = value;
                
                for (const pipe of window.game.pipes) {
                    pipe.speed = value;
                }
            }
        });
    }
    
    // Update image status
    updateImageStatus();
    
    // Periodically update background info
    setInterval(updateBackgroundInfo, 500);
}

// Update the status of images
function updateImageStatus() {
    const imageStatus = document.getElementById('image-status');
    if (!imageStatus) return;
    
    // Don't check for real files if we're in placeholder mode
    const usesPlaceholders = window.game ? window.game.config.usePlaceholders : true;
    
    let html = '<table border="1" style="border-collapse: collapse;">';
    html += '<tr><th>Image</th>';
    
    // Only add the real file check column if we're not using placeholders exclusively
    if (!usesPlaceholders) {
        html += '<th>Real File</th>';
    }
    
    html += '<th>Source Used</th></tr>';
    
    // Paths to check
    const imagePaths = [
        './img/background.png',
        './img/ground.png',
        './img/pipe-top.png',
        './img/pipe-bottom.png',
        './img/bird.png'
    ];
    
    // Check each image
    imagePaths.forEach(path => {
        const pathId = path.replace(/[\/\.]/g, '_');
        const fileName = path.split('/').pop();
        
        html += `
            <tr>
                <td>${fileName}</td>`;
        
        // Only check for real files if we're not using placeholders exclusively
        if (!usesPlaceholders) {
            html += `<td data-real="${pathId}">Checking...</td>`;
            
            // Set up the check for the real file
            const img = new Image();
            
            img.onload = () => {
                const cell = document.querySelector(`[data-real="${pathId}"]`);
                if (cell) {
                    cell.textContent = 'Found';
                    cell.style.color = 'lightgreen';
                }
            };
            
            img.onerror = () => {
                const cell = document.querySelector(`[data-real="${pathId}"]`);
                if (cell) {
                    cell.textContent = 'Missing';
                    cell.style.color = 'red';
                }
            };
            
            // Add a cache-busting parameter to avoid caching issues
            img.src = path + '?t=' + new Date().getTime();
        }
        
        // Source column
        html += `<td>${usesPlaceholders ? 
            '<span style="color: lightgreen">Placeholder</span>' : 
            '<span style="color: orange">Real (if available)</span>'}</td>
        </tr>`;
    });
    
    html += '</table>';
    
    // Check placeholders
    html += '<h4>Placeholders</h4>';
    if (window.placeholderImages) {
        html += '<ul>';
        Object.keys(window.placeholderImages).forEach(key => {
            html += `<li>${key}: <span style="color: lightgreen">Available</span></li>`;
        });
        html += '</ul>';
    } else {
        html += '<p><span style="color: red">No placeholders available</span></p>';
    }
    
    imageStatus.innerHTML = html;
}

// Show placeholder images in a modal
function showPlaceholderImages() {
    if (!window.placeholderImages) {
        alert('No placeholder images available');
        return;
    }
    
    // Create a modal to display the images
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.overflow = 'auto';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '10px';
    closeButton.style.margin = '10px';
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add placeholder images
    let html = '<h2 style="color: white;">Placeholder Images</h2>';
    
    Object.entries(window.placeholderImages).forEach(([name, src]) => {
        html += `
            <div style="margin: 10px; background: white; padding: 10px; border-radius: 5px;">
                <h3>${name}</h3>
                <img src="${src}" alt="${name}" style="border: 1px solid black; margin: 10px;">
            </div>
        `;
    });
    
    // Add HTML and close button
    const content = document.createElement('div');
    content.innerHTML = html;
    modal.appendChild(content);
    modal.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(modal);
}

// Update background information in debug panel
function updateBackgroundInfo() {
    if (!window.game || !document.getElementById('bg-controls')) return;
    
    const game = window.game;
    const bgControls = document.getElementById('bg-controls');
    
    // Check if we need to add the info div
    let infoDiv = document.getElementById('bg-info');
    if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'bg-info';
        bgControls.appendChild(infoDiv);
    }
    
    // Update the info
    if (game.bgImage && game.bgImage.complete) {
        infoDiv.innerHTML = `
            <p>Background size: ${game.bgImage.width}x${game.bgImage.height}</p>
            <p>Current position: ${Math.round(game.bgScrollPosition)} / ${game.bgImage.width}</p>
            <div style="width: 100%; height: 10px; background: #444; margin-top: 5px;">
                <div style="width: ${(game.bgScrollPosition / game.bgImage.width * 100).toFixed(1)}%; 
                     height: 10px; background: #8AF;"></div>
            </div>
        `;
    } else {
        infoDiv.innerHTML = '<p>Background image not loaded</p>';
    }
    
    // Update the speed slider to match current speed
    const bgSpeedSlider = document.getElementById('bg-speed');
    const bgSpeedValue = document.getElementById('bg-speed-value');
    if (bgSpeedSlider && bgSpeedValue && game.bgScrollSpeed !== undefined) {
        bgSpeedSlider.value = game.bgScrollSpeed;
        bgSpeedValue.textContent = game.bgScrollSpeed.toFixed(1);
    }
}

// Update debug panel with current values
function updateGameInfo() {
    if (!window.game) return;
    
    const pipeGapSlider = document.getElementById('pipe-gap');
    const pipeGapValue = document.getElementById('pipe-gap-value');
    
    if (pipeGapSlider && pipeGapValue) {
        pipeGapSlider.value = window.game.pipeGap;
        pipeGapValue.textContent = window.game.pipeGap;
    }
    
    const pipeSpeedSlider = document.getElementById('pipe-speed');
    const pipeSpeedValue = document.getElementById('pipe-speed-value');
    
    if (pipeSpeedSlider && pipeSpeedValue) {
        pipeSpeedSlider.value = window.game.pipeSpeed || 3;
        pipeSpeedValue.textContent = window.game.pipeSpeed || 3;
    }
    
    const planetSelect = document.getElementById('planet-select');
    if (planetSelect && window.game.planetName) {
        // Find and select the current gravity option
        Array.from(planetSelect.options).forEach(option => {
            const [optGravity, optName] = option.value.split(',');
            if (optName === window.game.planetName) {
                planetSelect.value = option.value;
            }
        });
    }
}

// Initialize the debug UI when the document is ready
document.addEventListener('DOMContentLoaded', createDebugUI);

// Update all debug info periodically
setInterval(() => {
    updateGameInfo();
    updateBackgroundInfo();
}, 1000);
