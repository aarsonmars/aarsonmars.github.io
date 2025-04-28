// --- Game Settings ---
const canvasWidth = 600;
const canvasHeight = 600;
const roadWidth = 80;
const carWidth = 15;
const carLength = 30;
const baseCarSpeed = 2;
const stopLineOffset = roadWidth / 2 + 5;
const generationRate = 0.03;
const MAX_VEHICLES = 50; // Slightly increase max vehicles

// Traffic signal timings - change from const to let so they can be modified
let minGreenTime = 180;
let yellowTime = 60;
let allRedTime = 30;

// Traffic patterns
const TRAFFIC_PATTERNS = {
    LIGHT: { nsRate: 0.01, ewRate: 0.01, name: "Light Traffic" },
    BALANCED: { nsRate: 0.03, ewRate: 0.03, name: "Balanced Traffic" },
    NS_HEAVY: { nsRate: 0.05, ewRate: 0.01, name: "N/S Heavy" },
    EW_HEAVY: { nsRate: 0.01, ewRate: 0.05, name: "E/W Heavy" },
    RUSH_HOUR: { nsRate: 0.05, ewRate: 0.05, name: "Rush Hour" }
};

// --- Game State Variables ---
let vehicles = [];
let currentPhase = 0;
let phaseState = 'GREEN';
let phaseTimer = minGreenTime;
let totalDelay = 0;
let switchRequested = false;
let speedFactor = 1;
let vehiclesPassed = 0;
let simulationPaused = false;
let p5Canvas;

// New analytics variables
let nsTrafficCount = 0;
let ewTrafficCount = 0;
let avgWaitTime = 0;
let totalWaitTime = 0;
let vehicleWaitTimes = [];
let currentTrafficPattern = TRAFFIC_PATTERNS.BALANCED;

// Animation variables
let lastFrameTime = 0;
let deltaTime = 0;
const MAX_DELTA = 0.1;
const ACCELERATION = 0.3;
const DECELERATION = 0.4;

// Environment variables
let dayTime = true;
let timeOfDay = 0; // 0 to 1000 (0=dawn, 250=day, 500=dusk, 750=night)
let timeCycleSpeed = 0.2; // How fast day/night cycles
let weatherEffect = 'clear'; // 'clear', 'rain', 'snow'

// Vehicle types - expanded
const vehicleTypes = [
    { type: 'car', width: 15, length: 30, speedMultiplier: 1, probability: 0.65 },
    { type: 'truck', width: 18, length: 45, speedMultiplier: 0.8, probability: 0.15 },
    { type: 'sports_car', width: 14, length: 28, speedMultiplier: 1.3, probability: 0.1 },
    { type: 'emergency', width: 16, length: 35, speedMultiplier: 1.5, probability: 0.02 },
    { type: 'bus', width: 20, length: 50, speedMultiplier: 0.7, probability: 0.08 }
];

// --- Road Graphics ---
let roadTexture;
let roadMarkings = [];

// --- UI Element References ---
let switchButton, resetButton, speedSlider, speedValue, patternSelect, pauseButton;
let phaseDisplay, scoreDisplay, statusDisplay, vehiclesPassedDisplay;
let dayNightToggle, weatherSelect;
// Queue display elements
let nQueueDisplay, sQueueDisplay, eQueueDisplay, wQueueDisplay;

// --- Function Declarations ---
// These need to be defined before setup() uses them
function requestSwitch() {
    if (phaseState === 'GREEN' && phaseTimer <= 0 && !switchRequested) {
        switchRequested = true;
        if (statusDisplay) statusDisplay.html('Switch Requested...');
        // Disable button immediately after successful request
        if (switchButton) switchButton.attribute('disabled', '');
    } else if (phaseState !== 'GREEN') {
        if (statusDisplay) statusDisplay.html('Cannot switch during Yellow/Red!');
    } else if (phaseTimer > 0) {
        if (statusDisplay) statusDisplay.html(`Min Green Time remaining: ${ceil(phaseTimer/60)}s`);
    }
}

function resetSimulation() {
    vehicles = [];
    totalDelay = 0;
    vehiclesPassed = 0;
    nsTrafficCount = 0;
    ewTrafficCount = 0;
    totalWaitTime = 0;
    vehicleWaitTimes = [];
    avgWaitTime = 0;
    currentPhase = 0;
    phaseState = 'GREEN';
    phaseTimer = minGreenTime;
    switchRequested = false;
    simulationPaused = false;
    
    updateUI();
    if (statusDisplay) statusDisplay.html('Running');
    if (pauseButton) pauseButton.html('Pause');
}

function togglePause() {
    simulationPaused = !simulationPaused;
    if (pauseButton) pauseButton.html(simulationPaused ? 'Resume' : 'Pause');
    if (statusDisplay) statusDisplay.html(simulationPaused ? 'Paused' : 'Running');
}

function updateSpeed() {
    if (speedSlider) {
        speedFactor = speedSlider.value();
        if (speedValue) speedValue.html(speedFactor + 'x');
    }
}

// Update these global variables to add weather impact
const WEATHER_EFFECTS = {
    'clear': { 
        speedMultiplier: 1.0,
        safetyDistanceMultiplier: 1.0,
        description: "Normal driving conditions"
    },
    'rain': { 
        speedMultiplier: 0.85, 
        safetyDistanceMultiplier: 1.3,
        description: "Reduced visibility, slower speeds, increased following distance"
    },
    'snow': { 
        speedMultiplier: 0.7, 
        safetyDistanceMultiplier: 1.5,
        description: "Poor traction, much slower speeds, greater following distance"
    }
};

// Add day/night impact factors
const TIME_EFFECTS = {
    'day': {
        speedMultiplier: 1.0,
        safetyDistanceMultiplier: 1.0,
        description: "Normal visibility and driving conditions"
    },
    'night': {
        speedMultiplier: 0.9,
        safetyDistanceMultiplier: 1.2,
        description: "Reduced visibility requiring greater caution"
    }
};

function changeWeather() {
    if (!weatherSelect) return;
    weatherEffect = weatherSelect.value();
    
    // Update tooltip with information
    if (statusDisplay) {
        statusDisplay.html(`Weather: ${WEATHER_EFFECTS[weatherEffect].description}`);
    }
}

function toggleDayNight() {
    if (!dayNightToggle) return;
    dayTime = !dayTime;
    timeOfDay = dayTime ? 250 : 750;
    
    // Update status with time of day effect
    if (statusDisplay) {
        const timeEffectInfo = dayTime ? TIME_EFFECTS.day.description : TIME_EFFECTS.night.description;
        statusDisplay.html(`Time of day: ${timeEffectInfo}`);
    }
}

// Update vehicle behavior based on environmental factors
function getEnvironmentalSpeedFactor() {
    // Get weather effect
    const weatherFactor = WEATHER_EFFECTS[weatherEffect].speedMultiplier;
    
    // Get time of day effect
    const timeFactor = dayTime ? TIME_EFFECTS.day.speedMultiplier : TIME_EFFECTS.night.speedMultiplier;
    
    // Combine effects (multiplicative)
    return weatherFactor * timeFactor;
}

function getEnvironmentalSafetyFactor() {
    // Get weather effect
    const weatherFactor = WEATHER_EFFECTS[weatherEffect].safetyDistanceMultiplier;
    
    // Get time of day effect
    const timeFactor = dayTime ? TIME_EFFECTS.day.safetyDistanceMultiplier : TIME_EFFECTS.night.safetyDistanceMultiplier;
    
    // Combine effects (take the larger factor)
    return Math.max(weatherFactor, timeFactor);
}

// Add the missing handlePhaseLogic function
function handlePhaseLogic() {
    phaseTimer -= deltaTime * 60;

    if (phaseState === 'GREEN') {
        // Auto-switch in pre-timed mode when timer expires
        if (phaseTimer <= 0 && signalTimings.mode === 'pretimed') {
            switchRequested = true;
            if (statusDisplay) statusDisplay.html('Auto-switching phases (pre-timed mode)');
        }
        
        // Start yellow phase when switching is requested
        if (phaseTimer <= 0 && switchRequested) {
            startYellowPhase();
        }
    } else if (phaseState === 'YELLOW') {
        if (phaseTimer <= 0) {
            startAllRedPhase();
        }
    } else if (phaseState === 'ALL_RED') {
        if (phaseTimer <= 0) {
            startNextGreenPhase();
        }
    }

    // Update button state - disabled in pre-timed mode or when not appropriate
    if (switchButton) {
        if (signalTimings.mode === 'pretimed' || phaseState !== 'GREEN' || phaseTimer > 0 || switchRequested) {
            switchButton.attribute('disabled', '');
        } else {
            switchButton.removeAttribute('disabled');
        }
    }
}

function startYellowPhase() {
    phaseState = 'YELLOW';
    phaseTimer = yellowTime;
    if (statusDisplay) statusDisplay.html('Yellow Clearance');
}

function startAllRedPhase() {
    phaseState = 'ALL_RED';
    phaseTimer = allRedTime;
    if (statusDisplay) statusDisplay.html('All Red Clearance');
}

function startNextGreenPhase() {
    currentPhase = (currentPhase + 1) % 2; // Toggle between 0 and 1
    phaseState = 'GREEN';
    
    // Use different min green times for N/S vs E/W based on configuration
    if (currentPhase === 0) { // N/S phase
        phaseTimer = signalTimings.minGreenNS * 60 / speedFactor;
    } else { // E/W phase
        phaseTimer = signalTimings.minGreenEW * 60 / speedFactor;
    }
    
    switchRequested = false;
    if (statusDisplay) {
        const phaseStr = currentPhase === 0 ? "N/S" : "E/W";
        statusDisplay.html(`Running ${phaseStr} phase`);
    }
}

// --- P5.js Setup Function ---
function preload() {
    // Optional: Load textures if needed
}

// --- P5.js Setup Function ---
function setup() {
    console.log("Setting up simulation...");
    
    // Use default P2D renderer instead of WebGL for better compatibility
    p5Canvas = createCanvas(canvasWidth, canvasHeight);
    p5Canvas.parent('canvas-container');
    frameRate(60);
    
    // Initialize UI elements with error handling
    try {
        switchButton = select('#switch-phase-btn');
        resetButton = select('#reset-btn');
        pauseButton = select('#pause-btn');
        speedSlider = select('#speed-slider');
        speedValue = select('#speed-value');
        
        // Check if elements exist before adding event listeners
        const handlers = {
            'apply-config-btn': applyConfiguration,
            'default-config-btn': resetToDefaultConfig,
            'run-simulation-btn': runSimulationForDuration,
            'export-results-btn': exportResults,
            'clear-results-btn': clearResults,
            'switch-phase-btn': requestSwitch,
            'pause-btn': togglePause
        };
        Object.entries(handlers).forEach(([id, fn]) => {
            const el = select(`#${id}`);
            if (el) el.mousePressed(fn);
        });
        
        // Optional UI elements - use try/catch for each one
        try {
            patternSelect = select('#traffic-pattern');
            if (patternSelect) patternSelect.changed(changeTrafficPattern);
        } catch (e) {
            console.log("Traffic pattern selector not found, using default pattern");
            patternSelect = null;
        }
        
        try {
            dayNightToggle = select('#day-night-toggle');
            if (dayNightToggle) dayNightToggle.changed(toggleDayNight);
        } catch (e) {
            console.log("Day/night toggle not found");
            dayNightToggle = null;
        }
        
        try {
            weatherSelect = select('#weather-select');
            if (weatherSelect) weatherSelect.changed(changeWeather);
        } catch (e) {
            console.log("Weather selector not found");
            weatherSelect = null;
        }
        
        phaseDisplay = select('#current-phase');
        scoreDisplay = select('#score');
        statusDisplay = select('#status');
        vehiclesPassedDisplay = select('#vehicles-passed');
        
        // Queue display elements
        nQueueDisplay = select('#n-queue');
        sQueueDisplay = select('#s-queue');
        eQueueDisplay = select('#e-queue');
        wQueueDisplay = select('#w-queue');
    } catch (e) {
        console.error("Error initializing UI elements:", e);
    }
    
    // Initialize
    phaseTimer = minGreenTime;
    lastFrameTime = millis();
    updateSpeed();
    generateRoadMarkings();
    
    console.log("Setup complete");
}

function generateRoadMarkings() {
    // Generate lane markings for road texture
    roadMarkings = [];
    
    // Road centerlines
    for (let i = 0; i < canvasHeight; i += 40) {
        roadMarkings.push({
            x1: width/2, y1: i,
            x2: width/2, y2: i + 20,
            color: color(255, 255, 255),
            width: 2
        });
    }
    
    for (let i = 0; i < canvasWidth; i += 40) {
        roadMarkings.push({
            x1: i, y1: height/2,
            x2: i + 20, y2: height/2,
            color: color(255, 255, 255),
            width: 2
        });
    }
}

// --- P5.js Draw Function (Game Loop) ---
function draw() {
    // Calculate delta time
    const currentTime = millis();
    deltaTime = min((currentTime - lastFrameTime) / 1000, MAX_DELTA);
    lastFrameTime = currentTime;
    
    // Skip frame if delta is too small
    if (deltaTime < 0.001) return;
    
    // Update environment
    updateEnvironment();
    
    // Clear background and set background color based on time of day
    setSceneBackground();
    
    // No need for resetMatrix() and translate() in P2D mode
    
    // Draw environment effects
    if (weatherEffect !== 'clear') {
        drawWeatherEffects();
    }
    
    // Highlight vehicles in intersection (for debugging/visualization)
    drawIntersection();
    handlePhaseLogic();
    drawSignals();

    // render queued vehicles at road ends
    drawCanvasQueue();

    if (!simulationPaused) {
        if (vehicles.length < MAX_VEHICLES) {
            generateVehicles();
        }
        
        // Add intersection collision detection
        debouncedCollisions();
        
        updateAndDisplayVehicles();
        
        // Track simulation time for timed runs
        if (metrics.isRunningTimedSim) {
            metrics.timedSimElapsed += deltaTime;
            metrics.simulationTime += deltaTime;
            
            // Update progress bar
            const progressPercent = (metrics.timedSimElapsed / metrics.timedSimDuration) * 100;
            document.querySelector('.progress-fill').style.width = `${Math.min(progressPercent, 100)}%`;
            
            // Update queue metrics
            updateQueueMetrics();
            
            // Check if simulation time is complete
            if (metrics.timedSimElapsed >= metrics.timedSimDuration) {
                finishTimedSimulation();
            }
        }
    }
    
    updateUI();
    updateAnalytics();
}

// draw queue counts on canvas
function drawCanvasQueue() {
    const q = countQueuedVehicles();
    textAlign(CENTER, CENTER);
    textSize(16);
    const pad = 6;
    const bgCol = color(255, 255, 255, 200);
    const txtCol = color('#FF9800');
    noStroke();

    // helper to draw at (x,y)
    function drawLabel(val, x, y) {
        const txt = val.toString();
        const w = textWidth(txt);
        fill(bgCol);
        rect(x - w/2 - pad, y - 16/2 - pad, w + pad*2, 16 + pad*2, 4);
        fill(txtCol);
        text(txt, x, y);
    }

    drawLabel(q.n, width/2, 20);        // North at top edge
    drawLabel(q.s, width/2, height-20); // South at bottom edge
    drawLabel(q.e, width-20, height/2); // East at right edge
    drawLabel(q.w, 20, height/2);       // West at left edge
}

function setSceneBackground() {
    // Set background based on time of day
    if (timeOfDay < 250) { // Dawn
        const t = map(timeOfDay, 0, 250, 0, 1);
        const bgColor = lerpColor(color(20, 30, 60), color(200, 240, 255), t);
        background(bgColor);
    } else if (timeOfDay < 500) { // Day
        background(200, 240, 255);
    } else if (timeOfDay < 750) { // Dusk
        const t = map(timeOfDay, 500, 750, 0, 1);
        const bgColor = lerpColor(color(200, 240, 255), color(20, 30, 60), t);
        background(bgColor);
    } else { // Night
        background(20, 30, 60);
    }
}

function updateEnvironment() {
    // Update time of day if cycle is enabled
    if (!simulationPaused && dayNightToggle && dayNightToggle.checked()) {
        timeOfDay = (timeOfDay + timeCycleSpeed) % 1000;
        dayTime = timeOfDay > 0 && timeOfDay < 500;
    }
}

function drawWeatherEffects() {
    if (weatherEffect === 'rain') {
        // Simple rain effect
        stroke(200, 230, 255, 120);
        strokeWeight(1);
        for (let i = 0; i < 100; i++) {
            const x = random(width);
            const y = random(height);
            line(x, y, x-2, y+10);
        }
    } else if (weatherEffect === 'snow') {
        // Simple snow effect
        noStroke();
        fill(255, 250, 250, 200);
        for (let i = 0; i < 50; i++) {
            const x = random(width);
            const y = random(height);
            ellipse(x, y, 3, 3);
        }
    }
}

// --- Drawing Functions ---
function drawIntersection() {
    // Road surface
    fill(dayTime ? 100 : 60);
    noStroke();
    rect(width/2 - roadWidth/2, 0, roadWidth, height); // Vertical road
    rect(0, height/2 - roadWidth/2, width, roadWidth); // Horizontal road
    
    // Draw road markings
    for (const marking of roadMarkings) {
        stroke(marking.color);
        strokeWeight(marking.width);
        line(marking.x1, marking.y1, marking.x2, marking.y2);
    }
    
    // Center yellow lines
    stroke(255, 200, 0);
    strokeWeight(2);
    line(width/2, 0, width/2, height/2 - roadWidth/2);
    line(width/2, height/2 + roadWidth/2, width/2, height);
    line(0, height/2, width/2 - roadWidth/2, height/2);
    line(width/2 + roadWidth/2, height/2, width, height/2);
    
    // Stop lines
    stroke(255);
    strokeWeight(3);
    line(width/2 - roadWidth/2, height/2 - stopLineOffset,
         width/2 + roadWidth/2, height/2 - stopLineOffset);
    line(width/2 - roadWidth/2, height/2 + stopLineOffset,
         width/2 + roadWidth/2, height/2 + stopLineOffset);
    line(width/2 - stopLineOffset, height/2 - roadWidth/2,
         width/2 - stopLineOffset, height/2 + roadWidth/2);
    line(width/2 + stopLineOffset, height/2 - roadWidth/2,
         width/2 + stopLineOffset, height/2 + roadWidth/2);
         
    // Crosswalk lines (zebra crossing)
    stroke(255);
    strokeWeight(2);
    for (let i = -roadWidth/2 + 5; i < roadWidth/2 - 5; i += 8) {
        // North crosswalk
        line(width/2 + i, height/2 - stopLineOffset - 15,
             width/2 + i + 4, height/2 - stopLineOffset - 15);
        // South crosswalk
        line(width/2 + i, height/2 + stopLineOffset + 15,
             width/2 + i + 4, height/2 + stopLineOffset + 15);
        // East crosswalk
        line(width/2 + stopLineOffset + 15, height/2 + i,
             width/2 + stopLineOffset + 15, height/2 + i + 4);
        // West crosswalk
        line(width/2 - stopLineOffset - 15, height/2 + i,
             width/2 - stopLineOffset - 15, height/2 + i + 4);
    }
}

function drawSignals() {
    let signalSize = 15;
    noStroke();

    // N/S Signals with improved visuals
    let nsColor = (currentPhase === 0 && phaseState === 'GREEN') ? color(0, 255, 0) :
                  (phaseState === 'YELLOW' && currentPhase === 0) ? color(255, 255, 0) :
                  color(255, 0, 0);
    
    // Draw signal boxes
    fill(50);
    rect(width/2 + roadWidth/2 + 5, height/2 - stopLineOffset - 20, 20, 40, 2);
    rect(width/2 - roadWidth/2 - 25, height/2 + stopLineOffset - 20, 20, 40, 2);
    
    // Draw signal lights
    fill(nsColor);
    ellipse(width/2 + roadWidth/2 + 15, height/2 - stopLineOffset, signalSize, signalSize);
    ellipse(width/2 - roadWidth/2 - 15, height/2 + stopLineOffset, signalSize, signalSize);
    
    // Use simpler glow effect for P2D 
    fill(nsColor);
    ellipse(width/2 + roadWidth/2 + 15, height/2 - stopLineOffset, signalSize-4, signalSize-4);
    ellipse(width/2 - roadWidth/2 - 15, height/2 + stopLineOffset, signalSize-4, signalSize-4);

    // E/W Signals
    let ewColor = (currentPhase === 1 && phaseState === 'GREEN') ? color(0, 255, 0) :
                 (phaseState === 'YELLOW' && currentPhase === 1) ? color(255, 255, 0) :
                 color(255, 0, 0);
                 
    // Draw signal boxes
    fill(50);
    rect(width/2 + stopLineOffset - 20, height/2 + roadWidth/2 + 5, 40, 20, 2);
    rect(width/2 - stopLineOffset - 20, height/2 - roadWidth/2 - 25, 40, 20, 2);
    
    // Draw signal lights
    fill(ewColor);
    ellipse(width/2 + stopLineOffset, height/2 + roadWidth/2 + 15, signalSize, signalSize);
    ellipse(width/2 - stopLineOffset, height/2 - roadWidth/2 - 15, signalSize, signalSize);
    
    // Simpler glow for P2D
    fill(ewColor);
    ellipse(width/2 + stopLineOffset, height/2 + roadWidth/2 + 15, signalSize-4, signalSize-4);
    ellipse(width/2 - stopLineOffset, height/2 - roadWidth/2 - 15, signalSize-4, signalSize-4);
}

// --- Vehicle Logic ---
function generateVehicles() {
    if (metrics.isRunningTimedSim) {
        // Use configured generation rates
        generateVehiclesCustom();
    } else {
        // Use predefined traffic patterns (original code)
        const nsAdjustedRate = currentTrafficPattern.nsRate * deltaTime * 60 * speedFactor;
        const ewAdjustedRate = currentTrafficPattern.ewRate * deltaTime * 60 * speedFactor;
        
        // Northbound (from South)
        if (random() < nsAdjustedRate) {
            const vType = getRandomVehicleType();
            vehicles.push(new Vehicle('S', vType));
            nsTrafficCount++;
        }
        
        // Southbound (from North)
        if (random() < nsAdjustedRate) {
            const vType = getRandomVehicleType();
            vehicles.push(new Vehicle('N', vType));
            nsTrafficCount++;
        }
        
        // Eastbound (from West)
        if (random() < ewAdjustedRate) {
            const vType = getRandomVehicleType();
            vehicles.push(new Vehicle('W', vType));
            ewTrafficCount++;
        }
        
        // Westbound (from East)
        if (random() < ewAdjustedRate) {
            const vType = getRandomVehicleType();
            vehicles.push(new Vehicle('E', vType));
            ewTrafficCount++;
        }
    }
}

function getRandomVehicleType() {
    const rand = random();
    let cumulativeProbability = 0;
    
    for (const vType of vehicleTypes) {
        cumulativeProbability += vType.probability;
        if (rand < cumulativeProbability) {
            return vType;
        }
    }
    
    return vehicleTypes[0];
}

// In the Vehicle class, update the getDrawPriority method
class Vehicle {
    constructor(approach, vehicleType) {
        this.approach = approach;
        this.vehicleType = vehicleType;
        this.width = vehicleType.width;
        this.length = vehicleType.length;
        this.isStopped = false;
        this.delayTime = 0;
        this.waitTime = 0; // Total wait time in seconds
        this.hasPassedIntersection = false;
        this.vehicleAhead = null;
        this.isEmergency = vehicleType.type === 'emergency';
        
        // Color assignment with improved variety
        if (vehicleType.type === 'car') {
            // More car colors: blue, red, silver, black, white, green
            const carColors = [
                color(100, 100, 200), // blue
                color(200, 100, 100), // red
                color(180, 180, 180), // silver
                color(50, 50, 50),    // black
                color(240, 240, 240), // white
                color(100, 180, 100)  // green
            ];
            this.color = random(carColors);
        } else if (vehicleType.type === 'sports_car') {
            // Sports car colors: red, yellow, orange
            const sportsCarColors = [
                color(220, 50, 50),   // bright red
                color(240, 200, 30),  // yellow
                color(240, 120, 30)   // orange
            ];
            this.color = random(sportsCarColors);
        } else if (vehicleType.type === 'truck') {
            // Truck colors
            this.color = color(200 + random(-30, 30), 140 + random(-30, 30), 100 + random(-30, 30));
        } else if (vehicleType.type === 'emergency') {
            // Emergency vehicle is white with flashing light
            this.color = color(240, 240, 240);
            this.flashingLight = true;
            this.flashState = true;
            this.lastFlashTime = 0;
        } else if (vehicleType.type === 'bus') {
            // Bus is yellow
            this.color = color(240, 200, 30);
        }
        
        // Initial positions
        if (approach === 'N') {
            this.x = width/2 + roadWidth/4 - this.width/2;
            this.y = -this.length;
            this.direction = 0; // Heading south
        } else if (approach === 'S') {
            this.x = width/2 - roadWidth/4 - this.width/2;
            this.y = height + this.length;
            this.direction = 180; // Heading north
        } else if (approach === 'W') {
            this.x = -this.length;
            this.y = height/2 - roadWidth/4 - this.width/2;
            this.direction = 90; // Heading east
        } else { // 'E'
            this.x = width + this.length;
            this.y = height/2 + roadWidth/4 - this.width/2;
            this.direction = 270; // Heading west
        }

        // Speed for smooth acceleration/deceleration
        this.targetSpeed = baseCarSpeed * vehicleType.speedMultiplier * speedFactor;
        this.currentSpeed = this.targetSpeed;
        
        // Add restart delay to prevent all vehicles starting at once
        this.restartDelay = 0;
        this.wasStoppedBefore = false;
    }

    // Improved drawing priority based on position, direction and vehicle type
    getDrawPriority() {
        // Base priority starting with Y position
        let priority = this.y;
        
        // Add size factor - larger vehicles should appear on top of smaller ones
        const sizeFactor = (this.width * this.length) / 500; // Normalized size factor
        priority += sizeFactor * 10; // Apply size influence
        
        // Add vehicle type influence (trucks and buses appear on top)
        if (this.vehicleType.type === 'truck' || this.vehicleType.type === 'bus') {
            priority += 5; // Larger vehicles get higher priority
        }
        
        // Emergency vehicles should be on top
        if (this.isEmergency) {
            priority += 10;
        }
        
        // Special handling for intersection area
        const inIntersectionX = Math.abs(this.x - width/2) < roadWidth/2;
        const inIntersectionY = Math.abs(this.y - height/2) < roadWidth/2;
        
        if (inIntersectionX && inIntersectionY) {
            // In the intersection, adjust priority based on approach
            if (this.approach === 'E' || this.approach === 'W') {
                priority += 3; // East-West vehicles should appear above North-South ones
            }
        }
        
        return priority;
    }
    
    checkForVehicleAhead(vehiclesInLane) {
        this.vehicleAhead = null;
        const minDistance = this.length * 1.5; // Increased safety distance
        let closestDistance = Number.MAX_VALUE;
        
        // Find the closest vehicle ahead in the same lane
        for (const other of vehiclesInLane) {
            if (other === this) continue;
            
            let isAhead = false;
            let distance = 0;
            
            // Enhanced position checking with larger threshold
            const laneThreshold = this.width * 1.5; // Increased to catch more vehicles
            
            if (this.approach === 'N' && other.y > this.y && 
                Math.abs(other.x - this.x) < laneThreshold) {
                isAhead = true;
                distance = other.y - this.y - this.length/2 - other.length/2;
            } else if (this.approach === 'S' && other.y < this.y && 
                      Math.abs(other.x - this.x) < laneThreshold) {
                isAhead = true;
                distance = this.y - other.y - this.length/2 - other.length/2;
            } else if (this.approach === 'W' && other.x > this.x && 
                      Math.abs(other.y - this.y) < laneThreshold) {
                isAhead = true;
                distance = other.x - this.x - this.length/2 - other.length/2;
            } else if (this.approach === 'E' && other.x < this.x && 
                      Math.abs(other.y - this.y) < laneThreshold) {
                isAhead = true;
                distance = this.x - other.x - this.length/2 - other.length/2;
            }
            
            // If the vehicle is ahead and closer than any we've seen before
            if (isAhead && distance < closestDistance && distance < minDistance) {
                closestDistance = distance;
                this.vehicleAhead = other;
            }
        }
    }
    
    update(dt) {
        // Flash emergency vehicle lights
        if (this.flashingLight && millis() - this.lastFlashTime > 250) {
            this.flashState = !this.flashState;
            this.lastFlashTime = millis();
        }
        
        // Check signal status
        let signalIsGreen = this.checkSignal();
        // Emergency vehicles can go through red lights
        if (this.isEmergency) signalIsGreen = true;
        
        let stopPosition = this.getStopPosition();
        let shouldStop = false;
        
        // Check if vehicle has passed the stop line - if so, don't stop for yellow/red
        let hasPassedStopLine = false;
        if (this.approach === 'N' && this.y > stopPosition) {
            hasPassedStopLine = true;
        } else if (this.approach === 'S' && this.y < stopPosition) {
            hasPassedStopLine = true;
        } else if (this.approach === 'W' && this.x > stopPosition) {
            hasPassedStopLine = true;
        } else if (this.approach === 'E' && this.x < stopPosition) {
            hasPassedStopLine = true;
        }
        
        // Store the status for reference elsewhere
        this.hasPassedStopLine = hasPassedStopLine;
        
        // Update intersection passing status
        if (!this.hasPassedIntersection) {
            if ((this.approach === 'N' && this.y > height/2) ||
                (this.approach === 'S' && this.y < height/2) ||
                (this.approach === 'W' && this.x > width/2) ||
                (this.approach === 'E' && this.x < width/2)) {
                this.hasPassedIntersection = true;
            }
        }

        // Track if we were stopped in previous frame
        const wasStoppedBefore = this.isStopped;
        
        // Only stop for signal if not already past the stop line
        if (!signalIsGreen && !hasPassedStopLine && this.isApproachingStopline(stopPosition)) {
            shouldStop = true;
        }
        
        // Check for vehicle ahead with increased safety margin during acceleration
        if (this.vehicleAhead) {
            let distance;
            
            if (this.approach === 'N' || this.approach === 'S') {
                distance = Math.abs(this.y - this.vehicleAhead.y) - this.length/2 - this.vehicleAhead.length/2;
            } else {
                distance = Math.abs(this.x - this.vehicleAhead.x) - this.length/2 - this.vehicleAhead.length/2;
            }
            
            // Apply environmental factors to safety distance
            const environmentalSafetyFactor = getEnvironmentalSafetyFactor();
            const safetyFactor = (wasStoppedBefore && !this.isStopped) ? 2.0 : 0.8;
            const adjustedSafetyFactor = safetyFactor * environmentalSafetyFactor;
            
            if (distance < this.length * adjustedSafetyFactor) {
                shouldStop = true;
            }
        }
        
        // Special handling of restart after being stopped
        if (wasStoppedBefore && !shouldStop) {
            // We're transitioning from stopped to moving
            // Set a small random delay before accelerating
            if (this.restartDelay <= 0) {
                // Increased delay range to stagger vehicles more (0.1-0.5s)
                this.restartDelay = random(0.1, 0.5);
                
                // Add extra delay for vehicles not at the front of the queue
                if (this.vehicleAhead && this.vehicleAhead.isStopped) {
                    this.restartDelay += 0.3; // Additional delay for vehicles in queue
                }
            } else {
                // Count down the delay
                this.restartDelay -= dt;
                // Keep vehicle stopped until delay expires
                if (this.restartDelay > 0) {
                    shouldStop = true;
                }
            }
        } else if (!wasStoppedBefore) {
            // If not stopped, reset restart delay
            this.restartDelay = 0;
        }
        
        // Update target speed with environmental factors
        const environmentalSpeedFactor = getEnvironmentalSpeedFactor();
        this.targetSpeed = baseCarSpeed * this.vehicleType.speedMultiplier * speedFactor * environmentalSpeedFactor;
        
        // Set speed based on whether we should stop
        if (shouldStop) {
            this.targetSpeed = 0;
            this.isStopped = true;
        } else {
            this.isStopped = false;
        }
        
        // Adjust acceleration rate based on conditions
        let accelRate = ACCELERATION;
        let decelRate = DECELERATION;
        
        // Decelerate faster than accelerate for more realistic physics
        if (wasStoppedBefore && !this.isStopped) {
            // When starting from stop, accelerate more gradually
            accelRate = ACCELERATION * 0.7;
        }
        
        // Smoothly adjust speed with acceleration/deceleration
        if (this.currentSpeed < this.targetSpeed) {
            this.currentSpeed = lerp(this.currentSpeed, this.targetSpeed, accelRate * dt * 30);
        } else if (this.currentSpeed > this.targetSpeed) {
            this.currentSpeed = lerp(this.currentSpeed, this.targetSpeed, decelRate * dt * 30);
        }
        
        // Calculate movement based on direction and speed
        let moveX = 0, moveY = 0;
        
        if (this.approach === 'N') {
            moveY = this.currentSpeed;
        } else if (this.approach === 'S') {
            moveY = -this.currentSpeed;
        } else if (this.approach === 'W') {
            moveX = this.currentSpeed;
        } else { // 'E'
            moveX = -this.currentSpeed;
        }
        
        // Additional collision prevention - check if the planned move would cause overlap
        if (!this.isStopped && this.vehicleAhead && !this.hasPassedIntersection) {
            let newX = this.x + moveX * dt * 60;
            let newY = this.y + moveY * dt * 60;
            
            let willOverlap = false;
            const safetyDistance = this.length * 0.7;
            
            if (this.approach === 'N' || this.approach === 'S') {
                const yDistance = Math.abs(newY - this.vehicleAhead.y) - this.length/2 - this.vehicleAhead.length/2;
                if (yDistance < safetyDistance && Math.abs(this.x - this.vehicleAhead.x) < this.width) {
                    willOverlap = true;
                }
            } else {
                const xDistance = Math.abs(newX - this.vehicleAhead.x) - this.length/2 - this.vehicleAhead.length/2;
                if (xDistance < safetyDistance && Math.abs(this.y - this.vehicleAhead.y) < this.width) {
                    willOverlap = true;
                }
            }
            
            if (willOverlap) {
                // Adjust speed to avoid overlap
                this.currentSpeed *= 0.5;
                moveX *= 0.5;
                moveY *= 0.5;
            }
        }
        
        // Apply movement with delta time
        this.x += moveX * dt * 60;
        this.y += moveY * dt * 60;
        
        // Reset delay if moving
        if (this.currentSpeed > 0.01) {
            this.delayTime = 0;
        }
        
        // Ensure car doesn't overshoot stop line
        if (this.isStopped && !signalIsGreen && this.isApproachingStopline(stopPosition)) {
            if (this.approach === 'N') this.y = stopPosition - this.length/2;
            if (this.approach === 'S') this.y = stopPosition + this.length/2;
            if (this.approach === 'W') this.x = stopPosition - this.length/2;
            if (this.approach === 'E') this.x = stopPosition + this.length/2;
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        
        if (this.approach === 'N') rotate(PI);
        else if (this.approach === 'W') rotate(PI/2);
        else if (this.approach === 'E') rotate(-PI/2);
        
        // Draw shadow beneath vehicle
        noStroke();
        fill(0, 0, 0, 50);
        ellipse(0, 0, this.width * 0.8, this.length * 0.8);
        
        // Draw vehicle body
        rectMode(CENTER);
        fill(this.color);
        noStroke();
        
        if (this.vehicleType.type === 'car') {
            // Car body
            rect(0, 0, this.width, this.length, 3);
            
            // Windows
            fill(200, 230, 255, 150);
            rect(0, -this.length/6, this.width * 0.7, this.length * 0.3, 1);
            
            // Headlights (visible at night)
            if (timeOfDay > 500 || timeOfDay < 100) {
                fill(255, 255, 200, 200);
                // Simple glow effect using concentric circles
                ellipse(-this.width/3, -this.length/2 + 3, 5, 5);
                ellipse(this.width/3, -this.length/2 + 3, 5, 5);
                fill(255, 255, 200, 100);
                ellipse(-this.width/3, -this.length/2 + 3, 7, 7);
                ellipse(this.width/3, -this.length/2 + 3, 7, 7);
            }
            
            // Taillights
            fill(200, 0, 0, 150);
            rect(-this.width/3, this.length/2 - 3, 3, 2);
            rect(this.width/3, this.length/2 - 3, 3, 2);
            
        } else if (this.vehicleType.type === 'sports_car') {
            // Sports car - streamlined shape
            beginShape();
            vertex(0, -this.length/2);
            vertex(this.width/2, -this.length/4);
            vertex(this.width/2, this.length/3);
            vertex(this.width/3, this.length/2);
            vertex(-this.width/3, this.length/2);
            vertex(-this.width/2, this.length/3);
            vertex(-this.width/2, -this.length/4);
            endShape(CLOSE);
            
            // Windows
            fill(200, 230, 255, 150);
            rect(0, -this.length/8, this.width * 0.7, this.length * 0.25, 1);
            
            // Headlights and taillights
            if (timeOfDay > 500 || timeOfDay < 100) {
                fill(255, 255, 200, 200);
                // Simple glow effect using concentric circles
                ellipse(-this.width/3, -this.length/2 + 3, 5, 5);
                ellipse(this.width/3, -this.length/2 + 3, 5, 5);
                fill(255, 255, 200, 100);
                ellipse(-this.width/3, -this.length/2 + 3, 7, 7);
                ellipse(this.width/3, -this.length/2 + 3, 7, 7);
            }
            
            fill(200, 0, 0, 150);
            rect(-this.width/4, this.length/2 - 2, 4, 2);
            rect(this.width/4, this.length/2 - 2, 4, 2);
            
        } else if (this.vehicleType.type === 'truck') {
            // Truck cab
            fill(this.color);
            rect(0, -this.length/3, this.width * 0.8, this.length * 0.3, 2);
            
            // Truck trailer
            fill(lerpColor(this.color, color(180), 0.3));
            rect(0, this.length/8, this.width, this.length * 0.6, 1);
            
            // Windows
            fill(200, 230, 255, 150);
            rect(0, -this.length/3, this.width * 0.6, this.length * 0.15, 1);
            
            // Headlights and taillights
            if (timeOfDay > 500 || timeOfDay < 100) {
                fill(255, 255, 200, 200);
                // Simple glow effect using concentric circles
                ellipse(-this.width/3, -this.length/2 + 2, 5, 5);
                ellipse(this.width/3, -this.length/2 + 2, 5, 5);
                fill(255, 255, 200, 100);
                ellipse(-this.width/3, -this.length/2 + 2, 7, 7);
                ellipse(this.width/3, -this.length/2 + 2, 7, 7);
            }
            
            fill(200, 0, 0, 150);
            rect(-this.width/3, this.length/2 - 3, 4, 2);
            rect(this.width/3, this.length/2 - 3, 4, 2);
            
        } else if (this.vehicleType.type === 'emergency') {
            // Emergency vehicle
            rect(0, 0, this.width, this.length, 2);
            
            // Light bar on top
            fill(50);
            rect(0, -this.length/4, this.width * 0.7, 6, 1);
            
            // Flashing lights
            if (this.flashState) {
                fill(255, 0, 0);
                drawingContext.shadowBlur = 10;
                drawingContext.shadowColor = 'rgba(255, 0, 0, 0.8)';
            } else {
                fill(0, 0, 255);
                drawingContext.shadowBlur = 10;
                drawingContext.shadowColor = 'rgba(0, 0, 255, 0.8)';
            }
            
            rect(-this.width/4, -this.length/4, 6, 4);
            rect(this.width/4, -this.length/4, 6, 4);
            drawingContext.shadowBlur = 0;
            
            // Windows
            fill(200, 230, 255, 150);
            rect(0, -this.length/8, this.width * 0.7, this.length * 0.3, 1);
            
            // Headlights always on
            fill(255, 255, 200, 200);
            // Simple glow effect using concentric circles
            ellipse(-this.width/3, -this.length/2 + 3, 5, 5);
            ellipse(this.width/3, -this.length/2 + 3, 5, 5);
            fill(255, 255, 200, 100);
            ellipse(-this.width/3, -this.length/2 + 3, 7, 7);
            ellipse(this.width/3, -this.length/2 + 3, 7, 7);
            
        } else if (this.vehicleType.type === 'bus') {
            // Bus body - long and tall
            rect(0, 0, this.width, this.length, 2);
            
            // Windows - series of small windows
            fill(200, 230, 255, 150);
            for (let i = -this.length/3; i < this.length/2; i += this.length/6) {
                rect(-this.width/3, i, 2, this.length/8);
                rect(this.width/3, i, 2, this.length/8);
            }
            
            // Windshield
            rect(0, -this.length/2 + 8, this.width * 0.7, 10, 1);
            
            // Headlights
            if (timeOfDay > 500 || timeOfDay < 100) {
                fill(255, 255, 200, 200);
                // Simple glow effect using concentric circles
                ellipse(-this.width/3, -this.length/2 + 3, 5, 5);
                ellipse(this.width/3, -this.length/2 + 3, 5, 5);
                fill(255, 255, 200, 100);
                ellipse(-this.width/3, -this.length/2 + 3, 7, 7);
                ellipse(this.width/3, -this.length/2 + 3, 7, 7);
            }
            
            // Taillights
            fill(200, 0, 0, 150);
            rect(-this.width/3, this.length/2 - 3, 4, 3);
            rect(this.width/3, this.length/2 - 3, 4, 3);
        }
        
        // Display delay time if stopped
        if (this.isStopped && this.delayTime > 0) {
            fill(255, 0, 0);
            textSize(10);
            textAlign(CENTER);
            text(this.delayTime + "s", 0, -this.length/2 - 5);
        }
        
        pop();
    }

    isApproachingStopline(stopPos) {
        const lookAheadDist = this.length / 2 + 2;
        
        if (this.approach === 'N') return (this.y + lookAheadDist >= stopPos);
        if (this.approach === 'S') return (this.y - lookAheadDist <= stopPos);
        if (this.approach === 'W') return (this.x + lookAheadDist >= stopPos);
        if (this.approach === 'E') return (this.x - lookAheadDist <= stopPos);
        return false;
    }

    isOffscreen() {
        const margin = this.length * 2;
        return (this.x < -margin || this.x > width + margin ||
                this.y < -margin || this.y > height + margin);
    }
    
    // Make sure the checkSignal method allows vehicles past the stop line to proceed
    checkSignal() {
        // For vehicles that have passed the stop line, always return true
        // so they continue through the intersection
        const stopPosition = this.getStopPosition();
        let hasPassedStopLine = false;
        
        if (this.approach === 'N' && this.y > stopPosition) {
            hasPassedStopLine = true;
        } else if (this.approach === 'S' && this.y < stopPosition) {
            hasPassedStopLine = true;
        } else if (this.approach === 'W' && this.x > stopPosition) {
            hasPassedStopLine = true;
        } else if (this.approach === 'E' && this.x < stopPosition) {
            hasPassedStopLine = true;
        }
        
        if (hasPassedStopLine) {
            return true; // Allow vehicle to proceed if already past stop line
        }
        
        // Normal signal checking for vehicles behind the stop line
        if (this.approach === 'N' || this.approach === 'S') {
            // N/S movement allowed during phase 0 Green and Yellow
            return (currentPhase === 0 && (phaseState === 'GREEN' || phaseState === 'YELLOW'));
        } else { // 'E' or 'W'
            // E/W movement allowed during phase 1 Green and Yellow
            return (currentPhase === 1 && (phaseState === 'GREEN' || phaseState === 'YELLOW'));
        }
    }

    getStopPosition() {
        if (this.approach === 'N') return height / 2 - stopLineOffset;
        if (this.approach === 'S') return height / 2 + stopLineOffset;
        if (this.approach === 'W') return width / 2 - stopLineOffset;
        if (this.approach === 'E') return width / 2 + stopLineOffset;
        return 0; // Should not happen
    }
}

// --- UI Updates ---
function updateUI() {
    let phaseText = '';
    if (phaseState === 'GREEN') {
        phaseText = (currentPhase === 0) ? 'N/S Green' : 'E/W Green';
    } else if (phaseState === 'YELLOW') {
        phaseText = (currentPhase === 0) ? 'N/S Yellow' : 'E/W Yellow';
    } else {
        phaseText = 'All Red';
    }
    
    if (phaseDisplay) phaseDisplay.html(phaseText);
    if (scoreDisplay) scoreDisplay.html(Math.floor(totalDelay));
    if (vehiclesPassedDisplay) vehiclesPassedDisplay.html(vehiclesPassed);

    if (statusDisplay) {
        if (phaseState === 'GREEN' && phaseTimer > 0 && !switchRequested) {
            statusDisplay.html(`Running (Min Green: ${ceil(phaseTimer/60)}s)`);
        } else if (phaseState === 'GREEN' && phaseTimer <= 0 && !switchRequested) {
            statusDisplay.html(`Running (Switch available)`);
        }
    }
    
    // Update queue displays
    const queueCounts = countQueuedVehicles();
    if (nQueueDisplay) nQueueDisplay.html(queueCounts.n);
    if (sQueueDisplay) sQueueDisplay.html(queueCounts.s);
    if (eQueueDisplay) eQueueDisplay.html(queueCounts.e);
    if (wQueueDisplay) wQueueDisplay.html(queueCounts.w);
    
    // Highlight queues with high counts
    const highQueueThreshold = 5;
    if (nQueueDisplay && queueCounts.n >= highQueueThreshold) 
        nQueueDisplay.style('color', '#ff0000');
    else if (nQueueDisplay) 
        nQueueDisplay.style('color', '#FF9800');
    
    if (sQueueDisplay && queueCounts.s >= highQueueThreshold) 
        sQueueDisplay.style('color', '#ff0000');
    else if (sQueueDisplay) 
        sQueueDisplay.style('color', '#FF9800');
    
    if (eQueueDisplay && queueCounts.e >= highQueueThreshold) 
        eQueueDisplay.style('color', '#ff0000');
    else if (eQueueDisplay) 
        eQueueDisplay.style('color', '#FF9800');
    
    if (wQueueDisplay && queueCounts.w >= highQueueThreshold) 
        wQueueDisplay.style('color', '#ff0000');
    else if (wQueueDisplay) 
        wQueueDisplay.style('color', '#FF9800');
}

// Fix the countQueuedVehicles function which has incomplete conditionals
function countQueuedVehicles() {
    let nCount = 0, sCount = 0, eCount = 0, wCount = 0;
    
    for (const v of vehicles) {
        // Count vehicles that are stopped at the intersection (not those that
        // have already passed through or are stopped for other reasons)
        if (v.isStopped && !v.hasPassedIntersection) {
            if (v.approach === 'N') nCount++;
            else if (v.approach === 'S') sCount++;
            else if (v.approach === 'E') eCount++;
            else if (v.approach === 'W') wCount++;
        }
    }
    
    return { n: nCount, s: sCount, e: eCount, w: wCount };
}

// Add the missing checkIntersectionCollisions function
function checkIntersectionCollisions() {
    // Find vehicles that are in the intersection area
    const inIntersection = vehicles.filter(v => {
        const inAreaX = Math.abs(v.x - width/2) < roadWidth/2;
        const inAreaY = Math.abs(v.y - height/2) < roadWidth/2;
        return inAreaX && inAreaY;
    });
    
    // Check each pair of vehicles for potential collisions
    for (let i = 0; i < inIntersection.length; i++) {
        for (let j = i + 1; j < inIntersection.length; j++) {
            const v1 = inIntersection[i];
            const v2 = inIntersection[j];
            
            // Skip vehicles from same approach
            if (v1.approach === v2.approach) continue;
            
            // Check for collision
            if (areVehiclesColliding(v1, v2)) {
                // Slow down one of the vehicles to prevent overlap
                if (v1.approach === 'N' || v1.approach === 'S') {
                    v2.currentSpeed *= 0.5; // Slow down E/W vehicle
                } else {
                    v1.currentSpeed *= 0.5; // Slow down N/S vehicle
                }
            }
        }
    }
}

// Add helper function to detect collisions between vehicles
function areVehiclesColliding(v1, v2) {
    // Calculate vehicle boundaries based on approach direction
    let v1Left, v1Right, v1Top, v1Bottom;
    let v2Left, v2Right, v2Top, v2Bottom;
    
    // N/S vehicles are taller than wide
    if (v1.approach === 'N' || v1.approach === 'S') {
        v1Left = v1.x - v1.width/2;
        v1Right = v1.x + v1.width/2;
        v1Top = v1.y - v1.length/2;
        v1Bottom = v1.y + v1.length/2;
    } else { // E/W vehicles are wider than tall
        v1Left = v1.x - v1.length/2;
        v1Right = v1.x + v1.length/2;
        v1Top = v1.y - v1.width/2;
        v1Bottom = v1.y + v1.width/2;
    }
    
    if (v2.approach === 'N' || v2.approach === 'S') {
        v2Left = v2.x - v2.width/2;
        v2Right = v2.x + v2.width/2;
        v2Top = v2.y - v2.length/2;
        v2Bottom = v2.y + v2.length/2;
    } else {
        v2Left = v2.x - v2.length/2;
        v2Right = v2.x + v2.length/2;
        v2Top = v2.y - v2.width/2;
        v2Bottom = v2.y + v2.width/2;
    }
    
    // Check for rectangular overlap
    return !(
        v1Right < v2Left || 
        v1Left > v2Right || 
        v1Bottom < v2Top || 
        v1Top > v2Bottom
    );
}

// Add the changeTrafficPattern function that was referenced but missing
function changeTrafficPattern() {
    if (!patternSelect) return;
    const patternKey = patternSelect.value();
    currentTrafficPattern = TRAFFIC_PATTERNS[patternKey];
    
    if (statusDisplay) {
        statusDisplay.html(`Changed to ${currentTrafficPattern.name} pattern`);
    }
}

// Add the missing updateAndDisplayVehicles function
function updateAndDisplayVehicles() {
    let currentTotalDelay = 0;
    
    // Pre-compute vehicles per lane
    const lanesN = [], lanesS = [], lanesE = [], lanesW = [];
    
    for (const v of vehicles) {
        if (v.approach === 'N') lanesN.push(v);
        else if (v.approach === 'S') lanesS.push(v);
        else if (v.approach === 'E') lanesE.push(v);
        else if (v.approach === 'W') lanesW.push(v);
    }
    
    // Sort lanes by position for proper stacking order and collision detection
    lanesN.sort((a, b) => a.y - b.y);
    lanesS.sort((a, b) => b.y - a.y);
    lanesE.sort((a, b) => b.x - a.x);
    lanesW.sort((a, b) => a.x - b.x);
    
    // First pass: update all vehicles
    for (const v of vehicles) {
        let vehiclesInLane;
        if (v.approach === 'N') vehiclesInLane = lanesN;
        else if (v.approach === 'S') vehiclesInLane = lanesS;
        else if (v.approach === 'E') vehiclesInLane = lanesE;
        else if (v.approach === 'W') vehiclesInLane = lanesW;
        
        v.checkForVehicleAhead(vehiclesInLane);
        v.update(deltaTime);
        
        if (v.isStopped) {
            currentTotalDelay++;
            v.waitTime += deltaTime;
            
            // Track delay metrics for analysis
            if (metrics.isRunningTimedSim) {
                if (v.approach === 'N') {
                    metrics.north.totalDelay += deltaTime;
                } else if (v.approach === 'S') {
                    metrics.south.totalDelay += deltaTime;
                } else if (v.approach === 'E') {
                    metrics.east.totalDelay += deltaTime;
                } else if (v.approach === 'W') {
                    metrics.west.totalDelay += deltaTime;
                }
            }
            
            if (frameCount % 30 === 0) v.delayTime++;
        }
    }
    
    // Second pass: sort vehicles for proper layering during drawing
    vehicles.sort((a, b) => {
        // Get base priorities from vehicles
        const aPriority = a.getDrawPriority();
        const bPriority = b.getDrawPriority();
        
        // If vehicles are near each other vertically
        if (Math.abs(a.y - b.y) < Math.max(a.length, b.length)/2) {
            // First sort by type category for overlapping vehicles
            const aLarge = a.vehicleType.type === 'truck' || a.vehicleType.type === 'bus';
            const bLarge = b.vehicleType.type === 'truck' || b.vehicleType.type === 'bus';
            
            if (aLarge !== bLarge) {
                return aLarge ? 1 : -1; // Large vehicles on top
            }
            
            // Then sort by emergency vehicle status
            if (a.isEmergency !== b.isEmergency) {
                return a.isEmergency ? 1 : -1; // Emergency vehicles on top
            }
            
            // At intersection, E/W traffic generally on top
            if (Math.abs(a.x - width/2) < roadWidth/2 && Math.abs(a.y - height/2) < roadWidth/2) {
                const aIsNS = (a.approach === 'N' || a.approach === 'S');
                const bIsNS = (b.approach === 'N' || b.approach === 'S');
                
                if (aIsNS !== bIsNS) {
                    return aIsNS ? -1 : 1; // NS traffic under EW traffic at intersection
                }
            }
        }
        
        // Default to position-based sorting
        return aPriority - bPriority;
    });
    
    // Draw all vehicles
    for (let i = 0; i < vehicles.length; i++) {
        vehicles[i].display();
    }
    
    // Third pass: check for removal of vehicles that have left the screen
    for (let i = vehicles.length - 1; i >= 0; i--) {
        const v = vehicles[i];
        if (v.isOffscreen()) {
            if (v.hasPassedIntersection) {
                vehiclesPassed++;
                if (v.waitTime > 0) {
                    vehicleWaitTimes.push(v.waitTime);
                    totalWaitTime += v.waitTime;
                    avgWaitTime = totalWaitTime / vehicleWaitTimes.length;
                    
                    // Track wait times for analysis
                    if (metrics.isRunningTimedSim) {
                        if (v.approach === 'N') {
                            metrics.north.waitTimes.push(v.waitTime);
                        } else if (v.approach === 'S') {
                            metrics.south.waitTimes.push(v.waitTime);
                        } else if (v.approach === 'E') {
                            metrics.east.waitTimes.push(v.waitTime);
                        } else if (v.approach === 'W') {
                            metrics.west.waitTimes.push(v.waitTime);
                        }
                    }
                }
            }
            vehicles.splice(i, 1);
        }
    }
    
    totalDelay += currentTotalDelay * deltaTime;
}

// Add updateAnalytics function to update the statistics displays
function updateAnalytics() {
    // Update traffic analytics displays
    const nsTrafficElement = select('#ns-traffic');
    const ewTrafficElement = select('#ew-traffic');
    const avgWaitElement = select('#avg-wait');
    
    if (nsTrafficElement) nsTrafficElement.html(nsTrafficCount);
    if (ewTrafficElement) ewTrafficElement.html(ewTrafficCount);
    if (avgWaitElement) avgWaitElement.html(avgWaitTime.toFixed(1) + "s");
    
    // Update chart if available
    if (window.trafficChart) {
        window.trafficChart.data.datasets[0].data = [nsTrafficCount, ewTrafficCount];
        window.trafficChart.update();
    }
}

// --- Analysis Configuration ---
let customVolumes = {
    north: 300, // vehicles per hour
    south: 300,
    east: 300,
    west: 300
};

let signalTimings = {
    minGreenNS: 30, // seconds
    minGreenEW: 30,
    yellowTime: 3,
    allRedTime: 2,
    mode: 'pretimed' // 'pretimed', 'actuated', 'adaptive'
};

let vehicleMixPercentages = {
    cars: 65,
    trucks: 15,
    sportsCars: 10,
    buses: 8,
    emergency: 2
};

// --- Analysis Metrics ---
let metrics = {
    // Per approach metrics
    north: { volume: 0, totalDelay: 0, maxQueue: 0, waitTimes: [] },
    south: { volume: 0, totalDelay: 0, maxQueue: 0, waitTimes: [] },
    east: { volume: 0, totalDelay: 0, maxQueue: 0, waitTimes: [] },
    west: { volume: 0, totalDelay: 0, maxQueue: 0, waitTimes: [] },
    // Overall metrics
    totalVehicles: 0,
    simulationTime: 0, // in seconds
    isRunningTimedSim: false,
    timedSimDuration: 300, // 5 minutes in seconds
    timedSimElapsed: 0
};

// Apply configuration from UI inputs
function applyConfigFromUI() {
    try {
        // Get traffic volumes
        customVolumes.north = parseInt(document.getElementById('volume-north').value) || 300;
        customVolumes.south = parseInt(document.getElementById('volume-south').value) || 300;
        customVolumes.east = parseInt(document.getElementById('volume-east').value) || 300;
        customVolumes.west = parseInt(document.getElementById('volume-west').value) || 300;
        
        // Get signal timings
        signalTimings.minGreenNS = parseInt(document.getElementById('min-green-ns').value) || 30;
        signalTimings.minGreenEW = parseInt(document.getElementById('min-green-ew').value) || 30;
        signalTimings.yellowTime = parseInt(document.getElementById('yellow-time').value) || 3;
        signalTimings.allRedTime = parseInt(document.getElementById('all-red-time').value) || 2;
        signalTimings.mode = document.getElementById('timing-mode').value;
        
        // Get vehicle mix
        vehicleMixPercentages.cars = parseInt(document.getElementById('percent-cars').value) || 65;
        vehicleMixPercentages.trucks = parseInt(document.getElementById('percent-trucks').value) || 15;
        vehicleMixPercentages.sportsCars = parseInt(document.getElementById('percent-sport').value) || 10;
        vehicleMixPercentages.buses = parseInt(document.getElementById('percent-bus').value) || 8;
        vehicleMixPercentages.emergency = parseInt(document.getElementById('percent-emergency').value) || 2;
        
        // Update probabilities in vehicleTypes array
        updateVehicleTypeProbabilities();
        
        // Apply signal timing to simulation
        minGreenTime = signalTimings.minGreenNS * 60 / speedFactor; // Convert to frames
        yellowTime = signalTimings.yellowTime * 60 / speedFactor;
        allRedTime = signalTimings.allRedTime * 60 / speedFactor;
        
        // Reset phase timer to match new min green time
        phaseTimer = currentPhase === 0 ? signalTimings.minGreenNS * 60 / speedFactor : 
                                         signalTimings.minGreenEW * 60 / speedFactor;
        
        // Update switch button visibility based on timing mode
        if (switchButton) {
            if (signalTimings.mode === 'pretimed') {
                switchButton.attribute('disabled', '');
                if (statusDisplay) statusDisplay.html('Pre-timed mode: Signal phases change automatically');
            } else {
                if (phaseState === 'GREEN' && phaseTimer <= 0 && !switchRequested) {
                    switchButton.removeAttribute('disabled');
                }
            }
        }
        
        // Reset metrics for clean measurement
        resetMetrics();
        
        // Show confirmation message
        if (statusDisplay) {
            statusDisplay.html('Configuration applied');
            setTimeout(() => {
                if (statusDisplay) statusDisplay.html(simulationPaused ? 'Paused' : 'Running');
            }, 2000);
        }
        
        // Switch to simulation tab
        document.querySelector('[data-tab="simulation"]').click();
        
    } catch (error) {
        console.error("Error applying configuration:", error);
        if (statusDisplay) statusDisplay.html('Error applying configuration');
    }
}

// Reset to default configuration
function resetToDefaultConfig() {
    // Traffic volumes
    document.getElementById('volume-north').value = 300;
    document.getElementById('volume-south').value = 300;
    document.getElementById('volume-east').value = 300;
    document.getElementById('volume-west').value = 300;
    
    // Signal timings
    document.getElementById('min-green-ns').value = 30;
    document.getElementById('min-green-ew').value = 30;
    document.getElementById('yellow-time').value = 3;
    document.getElementById('all-red-time').value = 2;
    document.getElementById('timing-mode').value = 'pretimed';
    
    // Vehicle mix
    document.getElementById('percent-cars').value = 65;
    document.getElementById('percent-trucks').value = 15;
    document.getElementById('percent-sport').value = 10;
    document.getElementById('percent-bus').value = 8;
    document.getElementById('percent-emergency').value = 2;
    
    // Validate the form
    validateVehicleMix();
    
    // Show confirmation
    document.getElementById('vehicle-mix-error').textContent = 'Default values restored';
    setTimeout(() => {
        document.getElementById('vehicle-mix-error').textContent = '';
    }, 2000);
}

// Validate vehicle mix percentages
function validateVehicleMix() {
    const cars = parseInt(document.getElementById('percent-cars').value) || 0;
    const trucks = parseInt(document.getElementById('percent-trucks').value) || 0;
    const sport = parseInt(document.getElementById('percent-sport').value) || 0;
    const bus = parseInt(document.getElementById('percent-bus').value) || 0;
    const emergency = parseInt(document.getElementById('percent-emergency').value) || 0;
    
    const total = cars + trucks + sport + bus + emergency;
    const errorElement = document.getElementById('vehicle-mix-error');
    
    if (total !== 100) {
        errorElement.textContent = `Vehicle mix must total 100% (currently ${total}%)`;
        document.getElementById('apply-config-btn').disabled = true;
        return false;
    } else {
        errorElement.textContent = '';
        document.getElementById('apply-config-btn').disabled = false;
        return true;
    }
}

// Update vehicle type probabilities based on percentages
function updateVehicleTypeProbabilities() {
    // First convert percentages to probabilities (0-1)
    const totalPercent = 100;
    vehicleTypes[0].probability = vehicleMixPercentages.cars / totalPercent;
    vehicleTypes[1].probability = vehicleMixPercentages.trucks / totalPercent;
    vehicleTypes[2].probability = vehicleMixPercentages.sportsCars / totalPercent;
    vehicleTypes[3].probability = vehicleMixPercentages.emergency / totalPercent;
    vehicleTypes[4].probability = vehicleMixPercentages.buses / totalPercent;
}

// Run simulation for specified duration
function runSimulationForDuration() {
    const durationMinutes = parseInt(document.getElementById('simulation-duration').value) || 5;
    metrics.timedSimDuration = durationMinutes * 60; // Convert to seconds
    metrics.timedSimElapsed = 0;
    metrics.isRunningTimedSim = true;
    
    // Reset metrics
    resetMetrics();
    
    // Show progress bar
    const progressBar = document.getElementById('simulation-progress');
    progressBar.style.display = 'block';
    document.getElementById('run-simulation-btn').disabled = true;
    
    // Make sure simulation is running
    if (simulationPaused) {
        togglePause();
    }
    
    // Apply configuration if it hasn't been applied
    applyConfigFromUI();
    
    // Show status
    if (statusDisplay) {
        statusDisplay.html(`Running simulation for ${durationMinutes} minutes...`);
    }
}

// Reset metrics for a new simulation run
function resetMetrics() {
    metrics = {
        north: { volume: 0, totalDelay:  0, maxQueue: 0, waitTimes: [] },
        south: { volume: 0, totalDelay: 0, maxQueue: 0, waitTimes: [] },
        east: { volume: 0, totalDelay: 0, maxQueue: 0, waitTimes: [] },
        west: { volume: 0, totalDelay: 0, maxQueue: 0, waitTimes: [] },
        totalVehicles: 0,
        simulationTime: 0,
        isRunningTimedSim: metrics.isRunningTimedSim,
        timedSimDuration: metrics.timedSimDuration,
        timedSimElapsed: 0
    };
}

// Calculate Level of Service (LOS) based on delay
function calculateLOS(delay) {
    // Using HCM 2010 LOS criteria for signalized intersections
    if (delay <=  10) return 'A';
    if (delay <= 20) return 'B';
    if (delay <= 35) return 'C';
    if (delay <= 55) return 'D';
    if (delay <= 80) return 'E';
    return 'F';
}

// Update queue metrics for each approach
function updateQueueMetrics() {
    const queueCounts = countQueuedVehicles();
    
    // Update maximum queue lengths
    metrics.north.maxQueue = Math.max(metrics.north.maxQueue, queueCounts.n);
    metrics.south.maxQueue = Math.max(metrics.south.maxQueue, queueCounts.s);
    metrics.east.maxQueue = Math.max(metrics.east.maxQueue, queueCounts.e);
    metrics.west.maxQueue = Math.max(metrics.west.maxQueue, queueCounts.w);
}

// Updated generateVehicles function to use custom volumes when needed
function generateVehiclesCustom() {
    // Convert vph to vehicles per second, adjusted for simulation speed
    const northRate = customVolumes.north / 3600 * deltaTime * speedFactor;
    const southRate = customVolumes.south / 3600 * deltaTime * speedFactor;
    const eastRate = customVolumes.east / 3600 * deltaTime * speedFactor;
    const westRate = customVolumes.west / 3600 * deltaTime * speedFactor;
    
    // Northbound (from South)
    if (random() < northRate) {
        const vType = getRandomVehicleType();
        vehicles.push(new Vehicle('S', vType));
        nsTrafficCount++;
        metrics.north.volume++;
    }
    
    // Southbound (from North)
    if (random() < southRate) {
        const vType = getRandomVehicleType();
        vehicles.push(new Vehicle('N', vType));
        nsTrafficCount++;
        metrics.south.volume++;
    }
    
    // Eastbound (from West)
    if (random() < eastRate) {
        const vType = getRandomVehicleType();
        vehicles.push(new Vehicle('W', vType));
        ewTrafficCount++;
        metrics.east.volume++;
    }
    
    // Westbound (from East)
    if (random() < westRate) {
        const vType = getRandomVehicleType();
        vehicles.push(new Vehicle('E', vType));
        ewTrafficCount++;
               metrics.west.volume++;
    }
}

// Handle completion of timed simulation
function finishTimedSimulation() {
    metrics.isRunningTimedSim = false;
    
    // Pause the simulation
    if (!simulationPaused) {
        togglePause();
    }
    
    // Hide progress bar
    document.getElementById('simulation-progress').style.display = 'none';
    document.getElementById('run-simulation-btn').disabled = false;
    
    // Calculate final metrics
    calculateFinalMetrics();
    
    // Update results panel
    updateResultsPanel();
    
    // Switch to results tab
    document.querySelector('[data-tab="results"]').click();
    
    // Show completion message
    if (statusDisplay) {
        statusDisplay.html('Simulation complete. View results.');
    }
}

// Calculate final metrics when simulation completes
function calculateFinalMetrics() {
    // Calculate average delays for each approach
    const approaches = ['north', 'south', 'east', 'west'];
    
    approaches.forEach(approach => {
        if (metrics[approach].waitTimes.length > 0) {
            metrics[approach].avgDelay = metrics[approach].totalDelay / metrics[approach].waitTimes.length;
        } else {
            metrics[approach].avgDelay = 0;
        }
        
        // Calculate LOS
        metrics[approach].los = calculateLOS(metrics[approach].avgDelay);
    });
    
    // Calculate overall metrics
    metrics.totalVehicles = metrics.north.volume + metrics.south.volume + 
                           metrics.east.volume + metrics.west.volume;
    
    const totalWaitTime = metrics.north.totalDelay + metrics.south.totalDelay + 
                         metrics.east.totalDelay + metrics.west.totalDelay;
    
    const totalWaitTimeSamples = metrics.north.waitTimes.length + metrics.south.waitTimes.length + 
                                metrics.east.waitTimes.length + metrics.west.waitTimes.length;
    
    if (totalWaitTimeSamples > 0) {
        metrics.overallAvgDelay = totalWaitTime / totalWaitTimeSamples;
    } else {
        metrics.overallAvgDelay = 0;
    }
    
    metrics.overallLos = calculateLOS(metrics.overallAvgDelay);
    metrics.maxQueue = Math.max(
        metrics.north.maxQueue, 
        metrics.south.maxQueue,
        metrics.east.maxQueue,
        metrics.west.maxQueue
    );
}

// Update the results panel with calculated metrics
function updateResultsPanel() {
    // Update summary metrics
    document.getElementById('result-total-vehicles').textContent = metrics.totalVehicles;
    document.getElementById('result-avg-delay').textContent = metrics.overallAvgDelay.toFixed(1) + 's';
    document.getElementById('result-los').textContent = metrics.overallLos;
    document.getElementById('result-max-queue').textContent = metrics.maxQueue;
    
    // Update detailed table
    document.getElementById('north-volume').textContent = metrics.north.volume;
    document.getElementById('north-delay').textContent = metrics.north.avgDelay.toFixed(1);
    document.getElementById('north-queue').textContent = metrics.north.maxQueue;
    document.getElementById('north-los').textContent = metrics.north.los;
    
    document.getElementById('south-volume').textContent = metrics.south.volume;
    document.getElementById('south-delay').textContent = metrics.south.avgDelay.toFixed(1);
    document.getElementById('south-queue').textContent = metrics.south.maxQueue;
    document.getElementById('south-los').textContent = metrics.south.los;
    
    document.getElementById('east-volume').textContent = metrics.east.volume;
    document.getElementById('east-delay').textContent = metrics.east.avgDelay.toFixed(1);
    document.getElementById('east-queue').textContent = metrics.east.maxQueue;
    document.getElementById('east-los').textContent = metrics.east.los;
    
    document.getElementById('west-volume').textContent = metrics.west.volume;
    document.getElementById('west-delay').textContent = metrics.west.avgDelay.toFixed(1);
    document.getElementById('west-queue').textContent = metrics.west.maxQueue;
    document.getElementById('west-los').textContent = metrics.west.los;
    
    // Update charts
    updateResultCharts();
}

// Update the results charts with final data
function updateResultCharts() {
    // Update delay chart
    window.delayChart.data.datasets[0].data = [
        metrics.north.avgDelay,
        metrics.south.avgDelay,
        metrics.east.avgDelay,
        metrics.west.avgDelay
    ];
    window.delayChart.update();
    
    // Update queue chart
    window.queueChart.data.datasets[0].data = [
        metrics.north.maxQueue,
        metrics.south.maxQueue,
        metrics.east.maxQueue,
        metrics.west.maxQueue
    ];
    window.queueChart.update();
}

// debounce helper
function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

// make collision checks debounced
const debouncedCollisions = debounce(checkIntersectionCollisions, 50);

// p5.js window resize handler
function windowResized() {
    const w = select('#canvas-container').elt.clientWidth;
    resizeCanvas(w, w);
}