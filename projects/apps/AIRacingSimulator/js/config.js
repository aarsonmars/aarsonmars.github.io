window.AIRacingConfig = Object.freeze({
    simulation: {
        fastForwardSteps: 3,  // Default simulation steps per update (lower = more natural)
        renderInterval: 2     // Only render every 2nd generation for visual feedback
    },
    defaultTrack: 'expert', // Default track to load on startup
    tracks: {
        // Track 1: Simple Oval - Perfect for beginners
        oval: {
            name: "Oval Circuit",
            difficulty: "Beginner",
            laneWidthFactor: 0.025,
            minLaneWidth: 24,
            marginFactor: 0.08,
            subdivisions: 20,
            basePath: [
                { x: 0.10, y: 0.10 },
                { x: 0.80, y: 0.10 },
                { x: 0.90, y: 0.90 },
                { x: 0.20, y: 0.70 }
            ]
        },
        
        // Track 2: Simple Track with One Turn
        beginner: {
            name: "Beginner Track",
            difficulty: "Easy",
            laneWidthFactor: 0.023,
            minLaneWidth: 22,
            marginFactor: 0.06,
            subdivisions: 22,
            basePath: [
                { x: 0.15, y: 0.10 },
                { x: 0.50, y: 0.50 },
                { x: 0.80, y: 0.20 },
                { x: 0.90, y: 0.70 },
                { x: 0.50, y: 0.85 },
                { x: 0.15, y: 0.85 }
            ]
        },
        
        // Track 3: Medium Complexity
        intermediate: {
            name: "Intermediate Circuit",
            difficulty: "Medium",
            laneWidthFactor: 0.022,
            minLaneWidth: 21,
            marginFactor: 0.05,
            subdivisions: 24,
            basePath: [
                { x: 0.10, y: 0.10 },
                { x: 0.90, y: 0.10 },
                { x: 0.95, y: 0.85 },
                { x: 0.83, y: 0.90 },
                { x: 0.80, y: 0.60 },
                { x: 0.70, y: 0.50 },
                { x: 0.60, y: 0.80 },
                { x: 0.40, y: 0.65 },
                { x: 0.15, y: 0.90 }
            ]
        },
        
        // Track 4: Complex Track
        advanced: {
            name: "Advanced Circuit",
            difficulty: "Hard",
            laneWidthFactor: 0.020,
            minLaneWidth: 20,
            marginFactor: 0.05,
            subdivisions: 24,
            basePath: [
                { x: 0.05, y: 0.050 },
                { x: 0.95, y: 0.05 },
                { x: 0.97, y: 0.95 },
                { x: 0.85, y: 0.95 },
                { x: 0.93, y: 0.30 },
                { x: 0.75, y: 0.35 },
                { x: 0.60, y: 0.5 },
                { x: 0.5, y: 0.85 },
                { x: 0.35, y: 0.60 },
                { x: 0.20, y: 0.95 },
                { x: 0.1, y: 0.85 }
            ]
        },
        
        // Track 5: Expert - Current Complex Track
        expert: {
            name: "Expert Circuit",
            difficulty: "Expert",
            laneWidthFactor: 0.020,
            minLaneWidth: 20,
            marginFactor: 0.05,
            subdivisions: 24,
            basePath: [
                { x: 0.05, y: 0.05 },
                { x: 0.95, y: 0.05 },
                { x: 0.95, y: 0.85 },
                { x: 0.85, y: 0.95 },
                { x: 0.75, y: 0.95 },
                { x: 0.70, y: 0.80 },
                { x: 0.85, y: 0.35 },
                { x: 0.65, y: 0.15 },
                { x: 0.65, y: 0.85 },
                { x: 0.55, y: 0.85 },
                { x: 0.55, y: 0.35 },
                { x: 0.45, y: 0.35 },
                { x: 0.45, y: 0.95 },
                { x: 0.35, y: 0.95 },
                { x: 0.35, y: 0.25 },
                { x: 0.25, y: 0.25 },
                { x: 0.25, y: 0.85 },
                { x: 0.10, y: 0.85 },
                { x: 0.15, y: 0.5 }
            ]
        }
    },
    track: {
        currentTrack: 'oval', // Default track
        laneWidthFactor: 0.020,
        minLaneWidth: 20,
        marginFactor: 0.05,
        subdivisions: 24,
        runOffExtra: 12,
        curbExtra: 4,
        basePath: [] // Will be populated from selected track
    },
    car: {
        length: 32,
        width: 16,
        maxSpeed: 4.0,        // Reduced from 6.2 for more natural speed
        acceleration: 0.15,   // Reduced from 0.22 for smoother acceleration
        friction: 0.96,       // Increased from 0.93 for less slippery feel
        turnSpeed: 0.055,     // Reduced from 0.078 for more realistic turning
        speedToKmhFactor: 19
    },
    sensors: {
        rayCount: 7,           // Need enough sensors for the AI to "see" properly
        rayLength: 180,        // Reasonable sensing distance
        raySpread: Math.PI * 0.9,
        step: 8                // Balance between speed and accuracy
    },
    training: {
        populationSize: 20,        // Good balance - enough diversity
        hiddenLayers: [16, 12],    // Network needs to be complex enough to learn
        mutationRate: 0.12,        // Lower mutation rate for better learning
        mutationAmount: 0.3,       // Slightly higher mutation amount
        frameLimit: 2800,          // Give cars more time to learn
        idleFrameLimit: 90,        // Be patient with idle cars
        minProgress: 0.18,         // Reasonable progress threshold
        simulationSteps: 1,        // Match the batch size for consistency
        renderInterval: 1,         // Render every 5th generation for natural pacing
        autoStopEnabled: true,     // Automatically stop when model masters the track
        autoStopLaps: 2,           // Number of consecutive laps required to auto-stop
        autoStopCars: 5            // Number of cars that must complete laps to auto-stop
    },
    
    // Helper function to get track configuration
    getTrackConfig: function(trackName) {
        const trackData = this.tracks[trackName] || this.tracks.oval;
        return {
            ...this.track,
            laneWidthFactor: trackData.laneWidthFactor,
            minLaneWidth: trackData.minLaneWidth,
            marginFactor: trackData.marginFactor,
            subdivisions: trackData.subdivisions,
            basePath: trackData.basePath
        };
    },
    
    // Get list of available tracks
    getTrackList: function() {
        return Object.keys(this.tracks).map(key => ({
            id: key,
            name: this.tracks[key].name,
            difficulty: this.tracks[key].difficulty
        }));
    }
});
