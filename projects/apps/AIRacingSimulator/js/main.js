// Main game loop and initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to fit new layout
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize game objects
// Get default track from URL parameter, localStorage, or config
function getDefaultTrack() {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('track');
    if (trackParam && window.AIRacingConfig.tracks[trackParam]) {
        return trackParam;
    }
    
    // Check localStorage
    const savedTrack = localStorage.getItem('airRacingDefaultTrack');
    if (savedTrack && window.AIRacingConfig.tracks[savedTrack]) {
        return savedTrack;
    }
    
    // Fall back to config default
    return window.AIRacingConfig.defaultTrack || 'oval';
}

let currentTrack = getDefaultTrack();
const track = new Track(canvas, currentTrack);
const startPos = track.getStartPosition();
const playerStartOffset = -40; // Position player car behind the start line
const playerStartX = startPos.x + Math.cos(startPos.angle) * playerStartOffset;
const playerStartY = startPos.y + Math.sin(startPos.angle) * playerStartOffset;
const playerCar = new Car(playerStartX, playerStartY, startPos.angle);
const controls = new Controls();
const globalConfig = window.AIRacingConfig || {};
const trainingConfig = globalConfig.training || {};
const mergedSensorConfig = Object.assign({}, globalConfig.sensors || {}, trainingConfig.sensorConfig || {});

const trainingManager = new TrainingManager(track, {
    populationSize: trainingConfig.populationSize,
    hiddenLayers: trainingConfig.hiddenLayers,
    sensorConfig: mergedSensorConfig,
    mutationRate: trainingConfig.mutationRate,
    mutationAmount: trainingConfig.mutationAmount,
    frameLimit: trainingConfig.frameLimit,
    idleFrameLimit: trainingConfig.idleFrameLimit,
    minProgress: trainingConfig.minProgress,
    simulationSteps: trainingConfig.simulationSteps,
    renderInterval: trainingConfig.renderInterval,
    autoStopEnabled: trainingConfig.autoStopEnabled,
    autoStopLaps: trainingConfig.autoStopLaps,
    autoStopCars: trainingConfig.autoStopCars
});

const TRAINING_FAST_STEPS = globalConfig.simulation?.fastForwardSteps ?? trainingConfig.simulationSteps ?? 10;

// Handle auto-stop notification
window.onTrainingMastered = function(metadata) {
    console.log('Training auto-stopped! Model has mastered the track.');
    trainingMode = false;
    trainingToggle.textContent = 'Start AI Training';
    resetBtn.disabled = false;
    modeDisplay.textContent = 'Manual';
    
    // Show custom success modal
    showSuccessModal(metadata);
};

// Modal Functions
function showSuccessModal(metadata) {
    document.getElementById('modalGeneration').textContent = metadata.generation || '--';
    document.getElementById('modalLaps').textContent = metadata.lapsCompleted || '--';
    document.getElementById('modalFitness').textContent = metadata.fitness ? Math.round(metadata.fitness) : '--';
    
    successModal.classList.add('show');
}

function hideSuccessModal() {
    successModal.classList.remove('show');
}

function showSettingsModal() {
    // Populate current values
    document.getElementById('populationSize').value = trainingManager.populationSize;
    document.getElementById('mutationRate').value = trainingManager.mutationRate;
    document.getElementById('frameLimit').value = trainingManager.frameLimit;
    document.getElementById('renderInterval').value = trainingManager.renderInterval;
    document.getElementById('simulationSpeed').value = TRAINING_BATCH_SIZE;
    document.getElementById('speedValue').textContent = TRAINING_BATCH_SIZE;
    document.getElementById('autoStopEnabled').checked = trainingManager.autoStopEnabled;
    document.getElementById('autoStopLaps').value = trainingManager.autoStopLaps;
    document.getElementById('autoStopCars').value = trainingManager.autoStopCars;
    
    settingsModal.classList.add('show');
}

function hideSettingsModal() {
    settingsModal.classList.remove('show');
}

function applySettings() {
    // Validate and clamp values
    const populationSize = Math.max(5, Math.min(200, parseInt(document.getElementById('populationSize').value)));
    const mutationRate = Math.max(0.01, Math.min(0.5, parseFloat(document.getElementById('mutationRate').value)));
    const frameLimit = Math.max(300, Math.min(5000, parseInt(document.getElementById('frameLimit').value)));
    const renderInterval = Math.max(1, Math.min(100, parseInt(document.getElementById('renderInterval').value)));
    const simulationSpeed = Math.max(1, Math.min(20, parseInt(document.getElementById('simulationSpeed').value)));
    const autoStopLaps = Math.max(1, Math.min(20, parseInt(document.getElementById('autoStopLaps').value)));
    const autoStopCars = Math.max(1, Math.min(50, parseInt(document.getElementById('autoStopCars').value)));
    
    // Update training manager
    trainingManager.populationSize = populationSize;
    trainingManager.mutationRate = mutationRate;
    trainingManager.frameLimit = frameLimit;
    trainingManager.renderInterval = renderInterval;
    trainingManager.autoStopEnabled = document.getElementById('autoStopEnabled').checked;
    trainingManager.autoStopLaps = autoStopLaps;
    trainingManager.autoStopCars = autoStopCars;
    
    // Update simulation speed
    window.TRAINING_BATCH_SIZE = simulationSpeed;
    
    // Save to localStorage
    localStorage.setItem('aiRacing_settings', JSON.stringify({
        populationSize: populationSize,
        mutationRate: mutationRate,
        frameLimit: frameLimit,
        renderInterval: renderInterval,
        simulationSpeed: simulationSpeed,
        autoStopEnabled: trainingManager.autoStopEnabled,
        autoStopLaps: autoStopLaps,
        autoStopCars: autoStopCars
    }));
    
    hideSettingsModal();
    flashButtonMessage(settingsBtn, 'Settings saved!', 1200);
}

function resetSettings() {
    // Reset to config defaults
    const defaultConfig = window.AIRacingConfig.training;
    document.getElementById('populationSize').value = defaultConfig.populationSize;
    document.getElementById('mutationRate').value = defaultConfig.mutationRate;
    document.getElementById('frameLimit').value = defaultConfig.frameLimit;
    document.getElementById('renderInterval').value = defaultConfig.renderInterval;
    document.getElementById('simulationSpeed').value = 10;
    document.getElementById('speedValue').textContent = 10;
    document.getElementById('autoStopEnabled').checked = defaultConfig.autoStopEnabled;
    document.getElementById('autoStopLaps').value = defaultConfig.autoStopLaps;
    document.getElementById('autoStopCars').value = defaultConfig.autoStopCars;
    
    // Clear localStorage
    localStorage.removeItem('aiRacing_settings');
}

// Load saved settings on startup
function loadSavedSettings() {
    const saved = localStorage.getItem('aiRacing_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            trainingManager.populationSize = settings.populationSize || trainingManager.populationSize;
            trainingManager.mutationRate = settings.mutationRate || trainingManager.mutationRate;
            trainingManager.frameLimit = settings.frameLimit || trainingManager.frameLimit;
            trainingManager.renderInterval = settings.renderInterval || trainingManager.renderInterval;
            trainingManager.autoStopEnabled = settings.autoStopEnabled ?? trainingManager.autoStopEnabled;
            trainingManager.autoStopLaps = settings.autoStopLaps || trainingManager.autoStopLaps;
            trainingManager.autoStopCars = settings.autoStopCars || trainingManager.autoStopCars;
            if (settings.simulationSpeed) {
                window.TRAINING_BATCH_SIZE = settings.simulationSpeed;
            }
        } catch (e) {
            console.error('Failed to load saved settings:', e);
        }
    }
}

loadSavedSettings();

// UI elements
const speedDisplay = document.getElementById('speed');
const lapTimeDisplay = document.getElementById('lapTime');
const bestTimeDisplay = document.getElementById('bestTime');
const modeDisplay = document.getElementById('modeLabel');
const generationDisplay = document.getElementById('generation');
const aliveDisplay = document.getElementById('aliveCount');
const populationDisplay = document.getElementById('population');
const bestFitnessDisplay = document.getElementById('bestFitness');
const resetBtn = document.getElementById('resetBtn');
const viewToggle = document.getElementById('viewToggle');
const trainingToggle = document.getElementById('trainingToggle');
const runModelBtn = document.getElementById('runModelBtn');
const saveModelBtn = document.getElementById('saveModelBtn');
const trackSelector = document.getElementById('trackSelector');
const changeTrackBtn = document.getElementById('changeTrackBtn');
const resetTrackBtn = document.getElementById('resetTrackBtn');
const settingsBtn = document.getElementById('settingsBtn');
const infoBtn = document.getElementById('infoBtn');

// Modal elements
const successModal = document.getElementById('successModal');
const settingsModal = document.getElementById('settingsModal');
const infoModal = document.getElementById('infoModal');
const modelSelectorModal = document.getElementById('modelSelectorModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const testModelBtn = document.getElementById('testModelBtn');
const saveModalBtn = document.getElementById('saveModalBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const closeInfoBtn = document.getElementById('closeInfoBtn');
const closeInfoModalBtn = document.getElementById('closeInfoModalBtn');
const closeModelSelectorBtn = document.getElementById('closeModelSelectorBtn');
const runCurrentModelBtn = document.getElementById('runCurrentModelBtn');
const uploadModelBtn = document.getElementById('uploadModelBtn');
const modelFileInput = document.getElementById('modelFileInput');

// Set initial track selector value
trackSelector.value = currentTrack;

// Game state
let animationId;
let showDebugView = false;
let trainingMode = false;
let bestModelMode = false;

const buttonFeedbackTimers = new Map();

function resetPlayerCar() {
    const spawn = track.getStartPosition();
    const playerStartOffset = -40;
    const resetX = spawn.x + Math.cos(spawn.angle) * playerStartOffset;
    const resetY = spawn.y + Math.sin(spawn.angle) * playerStartOffset;
    playerCar.reset(resetX, resetY, spawn.angle);
    playerCar.disableAutonomous();
    controls.reset();
}

function clearButtonFeedback(button, restore = true) {
    if (!button) {
        return;
    }
    if (buttonFeedbackTimers.has(button)) {
        clearTimeout(buttonFeedbackTimers.get(button));
        buttonFeedbackTimers.delete(button);
    }
    button.classList.remove('shake');
    if (restore && button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
    }
}

function flashButtonMessage(button, message, duration = 1600) {
    if (!button) {
        return;
    }
    const originalText = button.dataset.originalText || button.textContent;
    button.dataset.originalText = originalText;
    clearButtonFeedback(button, false);
    button.textContent = message;
    button.classList.add('shake');
    const timeout = setTimeout(() => {
        button.textContent = button.dataset.originalText;
        button.classList.remove('shake');
        buttonFeedbackTimers.delete(button);
    }, duration);
    buttonFeedbackTimers.set(button, timeout);
}

function notifyMissingModel(button) {
    flashButtonMessage(button, 'Train the model first');
}

function startBestModelRun() {
    const brain = trainingManager.getBestBrain();
    if (!brain) {
        notifyMissingModel(runModelBtn);
        return false;
    }

    if (trainingMode) {
        stopTraining();
    }

    clearButtonFeedback(runModelBtn);
    bestModelMode = true;
    const spawn = track.getStartPosition();
    const playerStartOffset = -40;
    const resetX = spawn.x + Math.cos(spawn.angle) * playerStartOffset;
    const resetY = spawn.y + Math.sin(spawn.angle) * playerStartOffset;
    playerCar.reset(resetX, resetY, spawn.angle);
    playerCar.enableAutonomous(brain);
    controls.reset();
    runModelBtn.textContent = 'Stop Best Model';
    modeDisplay.textContent = 'Autopilot';
    return true;
}

function showModelSelector() {
    // Update current model info
    const stats = trainingManager.getStats();
    const hasBest = trainingManager.hasBestBrain();
    const currentModelMeta = document.getElementById('currentModelMeta');
    
    if (hasBest) {
        const trackName = currentTrack || 'unknown';
        const generation = stats.bestMetadata?.generation || '--';
        const fitness = stats.bestFitness > -Infinity ? Math.round(stats.bestFitness) : '--';
        currentModelMeta.textContent = `Track: ${trackName} | Gen: ${generation} | Fitness: ${fitness}`;
        runCurrentModelBtn.style.opacity = '1';
        runCurrentModelBtn.style.pointerEvents = 'auto';
    } else {
        currentModelMeta.textContent = 'No model trained yet - start training first';
        runCurrentModelBtn.style.opacity = '0.5';
        runCurrentModelBtn.style.pointerEvents = 'none';
    }
    
    modelSelectorModal.classList.add('show');
}

function loadModelFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate the model data
            if (!data.brain || !data.brain.layers || !data.brain.layerSizes) {
                throw new Error('Invalid model file format - missing brain structure');
            }
            
            // Load the brain into training manager
            const loaded = trainingManager.importBrain(data);
            if (!loaded) {
                throw new Error('Failed to load model into training manager');
            }
            
            // Show success message
            const trackName = data.metadata?.trackName || 'unknown';
            const generation = data.metadata?.generation || '--';
            flashButtonMessage(runModelBtn, `Loaded ${trackName} model!`, 2000);
            
            // Close modal and start running
            modelSelectorModal.classList.remove('show');
            startBestModelRun();
            
        } catch (error) {
            console.error('Error loading model:', error);
            alert('Failed to load model file. Please make sure it\'s a valid AI Racing model.');
        }
    };
    reader.readAsText(file);
}

function stopBestModelRun(reset = true) {
    if (!bestModelMode && !playerCar.isAutonomous) {
        return;
    }
    bestModelMode = false;
    playerCar.disableAutonomous();
    if (reset) {
        resetPlayerCar();
    }
    runModelBtn.textContent = 'Run Best Model';
    clearButtonFeedback(runModelBtn);
    if (!trainingMode) {
        modeDisplay.textContent = 'Manual';
    }
}

function restartBestModelRun() {
    if (!bestModelMode) {
        resetPlayerCar();
        return;
    }
    const brain = trainingManager.getBestBrain();
    if (!brain) {
        stopBestModelRun();
        return;
    }
    const spawn = track.getStartPosition();
    const playerStartOffset = -40;
    const resetX = spawn.x + Math.cos(spawn.angle) * playerStartOffset;
    const resetY = spawn.y + Math.sin(spawn.angle) * playerStartOffset;
    playerCar.reset(resetX, resetY, spawn.angle);
    playerCar.enableAutonomous(brain);
    controls.reset();
}

function downloadBestModel() {
    const payload = trainingManager.exportBestBrain();
    if (!payload) {
        notifyMissingModel(saveModelBtn);
        return;
    }
    clearButtonFeedback(saveModelBtn);
    
    // Get current track info for filename
    const trackName = currentTrack || 'unknown';
    const generation = payload.metadata?.generation;
    const fitness = payload.metadata?.bestFitness;
    
    // Include track name in filename
    const fileNameParts = ['ai-racing-brain', trackName];
    if (Number.isFinite(generation)) {
        fileNameParts.push(`gen${generation}`);
    }
    if (Number.isFinite(fitness)) {
        fileNameParts.push(`fit${Math.round(fitness)}`);
    }
    const fileName = `${fileNameParts.join('-')}.json`;
    
    // Add track info to metadata
    if (!payload.metadata) {
        payload.metadata = {};
    }
    payload.metadata.trackName = trackName;
    payload.metadata.savedAt = new Date().toISOString();
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

let trainingInterval = null;
const TRAINING_UPDATE_RATE = 16; // ~60 FPS instead of 0 (maximum speed)
let TRAINING_BATCH_SIZE = 3; // Run fewer simulation steps for more natural movement

function startTraining() {
    if (trainingMode) {
        return;
    }
    if (bestModelMode) {
        stopBestModelRun();
    }
    trainingMode = true;
    trainingManager.start(trainingManager.bestBrain);
    trainingManager.setSpeedMultiplier(showDebugView ? 1 : TRAINING_BATCH_SIZE);
    trainingToggle.textContent = 'Stop AI Training';
    resetBtn.disabled = true;
    modeDisplay.textContent = 'Training';
    
    // Run training in controlled loop for natural pacing
    function trainLoop() {
        if (trainingMode) {
            // Use the current TRAINING_BATCH_SIZE (can be changed in settings)
            trainingManager.update(track, window.TRAINING_BATCH_SIZE || TRAINING_BATCH_SIZE);
            setTimeout(trainLoop, TRAINING_UPDATE_RATE);
        }
    }
    trainLoop();
}

function stopTraining() {
    if (!trainingMode) {
        return;
    }
    trainingMode = false;
    
    trainingManager.stop();
    trainingToggle.textContent = 'Start AI Training';
    resetBtn.disabled = false;
    stopBestModelRun(false);
    resetPlayerCar();
    modeDisplay.textContent = 'Manual';
}

// Reset button handler
resetBtn.addEventListener('click', () => {
    if (trainingMode) {
        stopTraining();
    } else if (bestModelMode) {
        restartBestModelRun();
    } else {
        resetPlayerCar();
    }
});

// View toggle handler
viewToggle.addEventListener('click', () => {
    showDebugView = !showDebugView;
    const speed = showDebugView ? 1 : TRAINING_BATCH_SIZE;
    trainingManager.setSpeedMultiplier(speed);
});

trainingToggle.addEventListener('click', () => {
    if (trainingMode) {
        stopTraining();
    } else {
        startTraining();
    }
});

runModelBtn.addEventListener('click', () => {
    if (bestModelMode) {
        stopBestModelRun();
    } else {
        showModelSelector();
    }
});

saveModelBtn.addEventListener('click', () => {
    downloadBestModel();
});

// Track change handler
changeTrackBtn.addEventListener('click', () => {
    if (trainingMode) {
        flashButtonMessage(changeTrackBtn, 'Stop training first');
        return;
    }
    if (bestModelMode) {
        stopBestModelRun();
    }
    
    const selectedTrack = trackSelector.value;
    if (selectedTrack === currentTrack) {
        flashButtonMessage(changeTrackBtn, 'Already on this track');
        return;
    }
    
    currentTrack = selectedTrack;
    track.loadTrack(currentTrack);
    resetPlayerCar();
    
    // Update training manager with new track
    trainingManager.track = track;
    
    // Save user's preference
    localStorage.setItem('airRacingDefaultTrack', currentTrack);
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('track', currentTrack);
    window.history.replaceState({}, '', url);
    
    flashButtonMessage(changeTrackBtn, 'Track changed!', 1200);
});

// Reset track preference handler
resetTrackBtn.addEventListener('click', () => {
    // Clear saved preference
    localStorage.removeItem('airRacingDefaultTrack');
    
    // Reset to config default
    const configDefault = window.AIRacingConfig.defaultTrack || 'oval';
    trackSelector.value = configDefault;
    
    // Clear URL parameter
    const url = new URL(window.location);
    url.searchParams.delete('track');
    window.history.replaceState({}, '', url);
    
    flashButtonMessage(resetTrackBtn, 'Reset to default!', 1200);
});

// Settings button handler
settingsBtn.addEventListener('click', () => {
    showSettingsModal();
});

// Info button handler
infoBtn.addEventListener('click', () => {
    infoModal.classList.add('show');
});

// Model selector handlers
closeModelSelectorBtn.addEventListener('click', () => {
    modelSelectorModal.classList.remove('show');
});

runCurrentModelBtn.addEventListener('click', () => {
    modelSelectorModal.classList.remove('show');
    startBestModelRun();
});

uploadModelBtn.addEventListener('click', () => {
    modelFileInput.click();
});

modelFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadModelFromFile(file);
    }
    // Reset the input so the same file can be selected again
    modelFileInput.value = '';
});

// Modal button handlers
closeModalBtn.addEventListener('click', hideSuccessModal);
closeSettingsBtn.addEventListener('click', hideSettingsModal);
closeInfoBtn.addEventListener('click', () => {
    infoModal.classList.remove('show');
});
closeInfoModalBtn.addEventListener('click', () => {
    infoModal.classList.remove('show');
});
saveSettingsBtn.addEventListener('click', applySettings);
resetSettingsBtn.addEventListener('click', resetSettings);

testModelBtn.addEventListener('click', () => {
    hideSuccessModal();
    startBestModelRun();
});

saveModalBtn.addEventListener('click', () => {
    hideSuccessModal();
    downloadBestModel();
});

// Close modals on background click
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        hideSuccessModal();
    }
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        hideSettingsModal();
    }
});

infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
        infoModal.classList.remove('show');
    }
});

modelSelectorModal.addEventListener('click', (e) => {
    if (e.target === modelSelectorModal) {
        modelSelectorModal.classList.remove('show');
    }
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideSuccessModal();
        hideSettingsModal();
        infoModal.classList.remove('show');
        modelSelectorModal.classList.remove('show');
    }
});

// Update speed display in settings
document.getElementById('simulationSpeed').addEventListener('input', (e) => {
    document.getElementById('speedValue').textContent = e.target.value;
});

trainingManager.setSpeedMultiplier(TRAINING_FAST_STEPS);

function updateManualCar() {
    if (bestModelMode && playerCar.isAutonomous) {
        playerCar.update(null, track);
    } else {
        playerCar.update(controls, track);
        
        // Auto-reset crashed car in manual mode after a short delay
        if (playerCar.crashed && !trainingMode && !bestModelMode) {
            setTimeout(() => {
                resetPlayerCar();
            }, 1500); // 1.5 second delay to show crash message
        }
    }
}

function updateTraining() {
    // Training now runs in its own interval, just render here
    // No update needed in the render loop
}

function renderManualMode() {
    playerCar.draw(ctx);
    if (showDebugView) {
        playerCar.sensor.draw(ctx);
    }
    if (playerCar.crashed) {
        drawCrashBanner();
    }
}

function renderTrainingMode() {
    trainingManager.draw(ctx, { 
        showSensors: showDebugView
    });
}

function drawCrashBanner() {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CRASHED!', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press Reset to try again', canvas.width / 2, canvas.height / 2 + 50);
    ctx.restore();
}

function gameLoop() {
    track.draw();

    if (trainingMode) {
        updateTraining();
        renderTrainingMode();
    } else {
        updateManualCar();
        renderManualMode();
    }

    updateUI();
    animationId = requestAnimationFrame(gameLoop);
}

function updateUI() {
    const stats = trainingManager.getStats();
    const hasBest = trainingManager.hasBestBrain();
    const bestGeneration = stats.bestMetadata?.generation;
    const bestGenerationText = Number.isFinite(bestGeneration) ? bestGeneration : '--';
    const bestFitnessText = Number.isFinite(stats.bestFitness) && stats.bestFitness > -Infinity
        ? stats.bestFitness.toFixed(0)
        : '--';

    saveModelBtn.disabled = !hasBest;
    runModelBtn.disabled = trainingMode || (!hasBest && !bestModelMode);

    if (trainingMode) {
        const leaderSpeed = stats.leaderSpeed ?? 0;
        const leaderFitness = stats.leaderFitness ?? 0;
        speedDisplay.textContent = leaderSpeed > 0 ? Math.round(leaderSpeed) : '--';
        lapTimeDisplay.textContent = '--';
        bestTimeDisplay.textContent = leaderFitness > 0 ? leaderFitness.toFixed(0) : '--';
        
        // Always show current generation (training every generation internally)
        generationDisplay.textContent = stats.generation;
        
        aliveDisplay.textContent = stats.aliveCount;
        populationDisplay.textContent = stats.populationSize;
        bestFitnessDisplay.textContent = bestFitnessText;
        modeDisplay.textContent = 'Training';
    } else if (bestModelMode && playerCar.isAutonomous) {
        const speed = playerCar.getSpeedKmh();
        speedDisplay.textContent = speed;
        lapTimeDisplay.textContent = playerCar.lapTime.toFixed(2);
        bestTimeDisplay.textContent = playerCar.bestLapTime ? `${playerCar.bestLapTime.toFixed(2)}s` : '--';
        generationDisplay.textContent = bestGenerationText;
        aliveDisplay.textContent = '1';
        populationDisplay.textContent = '1';
        bestFitnessDisplay.textContent = bestFitnessText;
        modeDisplay.textContent = 'Autopilot';
    } else {
        speedDisplay.textContent = playerCar.getSpeedKmh();
        lapTimeDisplay.textContent = playerCar.lapTime.toFixed(2);
        bestTimeDisplay.textContent = playerCar.bestLapTime ? `${playerCar.bestLapTime.toFixed(2)}s` : '--';
        generationDisplay.textContent = '--';
        aliveDisplay.textContent = '--';
        populationDisplay.textContent = '--';
        bestFitnessDisplay.textContent = bestFitnessText;
        modeDisplay.textContent = 'Manual';
    }
}

// Start the game
console.log('AI Racing Simulator initialized!');
console.log('Use Arrow Keys or WASD to drive');
gameLoop();
