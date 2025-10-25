class TrainingManager {
    constructor(track, options = {}) {
        if (!track) {
            throw new Error('TrainingManager requires a track reference.');
        }
        if (typeof NeuralNetwork === 'undefined') {
            throw new Error('NeuralNetwork must be loaded before TrainingManager.');
        }

        this.track = track;
        this.populationSize = Math.max(2, options.populationSize || 30);
        this.eliteFraction = Math.min(0.5, Math.max(0.05, options.eliteFraction ?? 0.2));
        this.mutationRate = options.mutationRate ?? 0.12;
        this.mutationAmount = options.mutationAmount ?? 0.28;
        this.frameLimit = options.frameLimit || 2600;
        this.idleFrameLimit = options.idleFrameLimit || 220;
        this.minProgress = options.minProgress || 0.18;
        this.simulationSteps = Math.max(1, options.simulationSteps || 1);
        this.renderInterval = options.renderInterval || 1; // Only render every Nth generation
        this.autoStopEnabled = options.autoStopEnabled ?? true;
        this.autoStopLaps = options.autoStopLaps || 3;
        this.autoStopCars = options.autoStopCars || 5;
        this.sensorConfig = Object.assign({
            rayCount: 9,
            rayLength: 240,
            raySpread: Math.PI * 0.95
        }, options.sensorConfig || {});
        this.hiddenLayers = Array.isArray(options.hiddenLayers) && options.hiddenLayers.length
            ? options.hiddenLayers.slice()
            : [12, 8];

        this.inputSize = (this.sensorConfig.rayCount || 9) + 1; // sensors + speed
        this.networkTopology = [this.inputSize, ...this.hiddenLayers, 2];

        this.generation = 0;
        this.framesInGeneration = 0;
        this.isRunning = false;

        this.cars = [];
        this.agentMeta = [];
        this.currentLeader = null;
        this.aliveCount = 0;
        this.ghostCar = null;

    this.bestScore = -Infinity;
    this.bestBrain = null;
    this.ghostBrain = null;
    this.bestMetadata = null;
    this.lastSummary = null;
    }

    start(seedBrain = null) {
        if (seedBrain && typeof seedBrain.clone === 'function') {
            this.bestBrain = seedBrain.clone();
        }
        this.isRunning = true;
        this.generation = 0;
        this.framesInGeneration = 0;
        this.bestScore = -Infinity;
        this.currentLeader = null;
        this.cars = [];
        this.agentMeta = [];
        this.#spawnInitialPopulation();
    }

    stop() {
        this.isRunning = false;
        this.cars = [];
        this.agentMeta = [];
        this.currentLeader = null;
        this.aliveCount = 0;
    }

    setSpeedMultiplier(multiplier) {
        this.simulationSteps = Math.max(1, Math.floor(multiplier));
    }

    update(track, steps = this.simulationSteps) {
        if (!this.isRunning) {
            return;
        }
        const activeTrack = track || this.track;
        const iterations = Math.max(1, steps | 0);
        for (let i = 0; i < iterations; i++) {
            this.#stepSimulation(activeTrack);
            if (!this.isRunning) {
                break;
            }
        }
    }

    draw(ctx, options = {}) {
        if (!this.isRunning) {
            return;
        }
        
        // Only render every Nth generation for performance
        // Still train every generation internally
        if (this.renderInterval > 1 && this.generation % this.renderInterval !== 0) {
            // Skip rendering, but show generation counter
            return;
        }
        
        const { showSensors = false } = options;
        const leader = this.currentLeader;

        // Sort by fitness
        const ranked = [...this.agentMeta]
            .map(agent => ({ car: agent.car, fitness: agent.car.fitness ?? 0 }))
            .sort((a, b) => a.fitness - b.fitness);

        // Calculate fitness range for color mapping
        const fitnesses = ranked.map(r => r.fitness);
        const minFitness = Math.min(...fitnesses);
        const maxFitness = Math.max(...fitnesses);
        const fitnessRange = maxFitness - minFitness || 1;

        // Draw ghost car first (behind everything)
        if (this.ghostCar && !this.ghostCar.crashed) {
            this.ghostCar.draw(ctx, { isGhost: true });
        }

        // Draw all cars as simple dots except leader and top performers
        ranked.forEach(({ car, fitness }, index) => {
            if (!car) return;

            const isLeader = car === leader;
            const isTopPerformer = index >= ranked.length - 3 && !isLeader;

            if (isLeader) {
                // Draw leader with highlight
                car.draw(ctx, { isLeader: true });
                if (showSensors) {
                    car.sensor.draw(ctx);
                }
            } else if (isTopPerformer) {
                // Draw top 3 performers with slight transparency
                ctx.save();
                ctx.globalAlpha = 0.7;
                car.draw(ctx);
                ctx.restore();
            } else {
                // Draw rest as colored dots based on fitness
                const normalizedFitness = (fitness - minFitness) / fitnessRange;
                let color;
                if (car.crashed) {
                    color = 'rgba(100, 100, 100, 0.4)';
                } else if (normalizedFitness < 0.33) {
                    color = `rgba(255, ${Math.floor(normalizedFitness * 3 * 200)}, 0, 0.6)`;
                } else if (normalizedFitness < 0.67) {
                    color = `rgba(${Math.floor((1 - (normalizedFitness - 0.33) * 3) * 255)}, 200, 0, 0.6)`;
                } else {
                    color = `rgba(0, ${200 + Math.floor((normalizedFitness - 0.67) * 3 * 55)}, 0, 0.7)`;
                }
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(car.x, car.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    forceNextGeneration() {
        if (!this.isRunning) {
            return;
        }
        this.#prepareNextGeneration();
    }

    getLeader() {
        return this.currentLeader;
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            generation: this.generation,
            framesInGeneration: this.framesInGeneration,
            aliveCount: this.aliveCount,
            populationSize: this.populationSize,
            leaderSpeed: this.currentLeader ? this.currentLeader.getSpeedKmh() : 0,
            leaderFitness: this.currentLeader ? this.currentLeader.fitness ?? 0 : 0,
            bestFitness: this.bestScore,
            bestMetadata: this.bestMetadata,
            lastSummary: this.lastSummary
        };
    }

    #stepSimulation(track) {
        if (!this.isRunning) {
            return;
        }

        const activeTrack = track || this.track;
        if (!activeTrack) {
            throw new Error('TrainingManager requires a track to simulate.');
        }

        // Determine if we should do expensive operations this frame
        const shouldRender = this.renderInterval <= 1 || this.generation % this.renderInterval === 0;

        if (this.ghostCar && !this.ghostCar.crashed) {
            this.ghostCar.update(null, activeTrack);
        }

        this.framesInGeneration += 1;

        let active = 0;
        let leader = null;
        let leaderFitness = -Infinity;

        for (const agent of this.agentMeta) {
            const car = agent.car;
            if (car.crashed) {
                continue;
            }

            active += 1;

            const previousDistance = car.distanceTravelled;
            
            // Skip expensive particle updates if not rendering
            if (!shouldRender) {
                car.exhaustParticles = []; // Clear particles to save memory
            }
            
            car.update(null, activeTrack);
            const distanceGain = car.distanceTravelled - previousDistance;
            
            // Update lap tracking
            activeTrack.updateCarCheckpoint(car);

            if (distanceGain < this.minProgress) {
                agent.idleFrames += 1;
            } else {
                agent.idleFrames = 0;
            }

            if (agent.idleFrames > this.idleFrameLimit) {
                car.crashed = true;
                car.speed = 0;
                car.sensor.enabled = false;
                continue;
            }

            car.fitness = this.#computeFitness(car);

            if (car.fitness > leaderFitness) {
                leaderFitness = car.fitness;
                leader = car;
            }
        }

        this.aliveCount = active;
        this.currentLeader = leader;

        // Check for auto-stop condition
        if (this.autoStopEnabled && this.#checkMasteryAchieved()) {
            this.#handleMasteryAchieved();
            return;
        }

        if (active === 0 || this.framesInGeneration >= this.frameLimit) {
            this.#prepareNextGeneration();
        }
    }
    
    #checkMasteryAchieved() {
        // Check if enough cars have completed required laps
        const successfulCars = this.agentMeta.filter(agent => 
            !agent.car.crashed && agent.car.lapsCompleted >= this.autoStopLaps
        );
        
        return successfulCars.length >= this.autoStopCars;
    }
    
    #handleMasteryAchieved() {
        console.log('🎉 Track Mastered! Auto-stopping training...');
        
        // Find the best performing car
        const rankedCars = [...this.agentMeta]
            .filter(agent => agent.car.lapsCompleted >= this.autoStopLaps)
            .sort((a, b) => (b.car.fitness ?? 0) - (a.car.fitness ?? 0));
        
        if (rankedCars.length > 0 && rankedCars[0].car.brain) {
            this.bestBrain = rankedCars[0].car.brain.clone();
            this.bestScore = rankedCars[0].car.fitness;
            this.bestMetadata = {
                generation: this.generation,
                fitness: this.bestScore,
                lapsCompleted: rankedCars[0].car.lapsCompleted,
                autoStopped: true,
                recordedAt: new Date().toISOString()
            };
        }
        
        // Stop training
        this.stop();
        
        // Trigger UI notification
        if (typeof window !== 'undefined' && window.onTrainingMastered) {
            window.onTrainingMastered(this.bestMetadata);
        }
    }

    #computeFitness(car) {
        // Heavily reward distance traveled (main objective)
        const distanceScore = car.distanceTravelled * 2.0;
        
        // Massive bonus for completing laps
        const lapBonus = car.lapsCompleted * 5000;
        
        // Reward survival but less than distance
        const survivalBonus = car.framesAlive * 0.2;
        
        // Reward maintaining good speed (but don't over-reward it)
        const speedBonus = Math.max(0, car.getNormalizedSpeed()) * 8;
        
        // Penalize crashes by not giving them any distance credit after crash
        const crashPenalty = car.crashed ? -50 : 0;
        
        return Math.max(0, distanceScore + lapBonus + survivalBonus + speedBonus + crashPenalty);
    }

    #prepareNextGeneration() {
        if (!this.isRunning || this.agentMeta.length === 0) {
            return;
        }

        const ranked = [...this.agentMeta].sort((a, b) => (b.car.fitness ?? 0) - (a.car.fitness ?? 0));
        const bestCar = ranked[0]?.car;
        const bestFitness = bestCar?.fitness ?? -Infinity;

        const averageFitness = ranked.reduce((sum, agent) => sum + (agent.car.fitness ?? 0), 0) / ranked.length;
        this.lastSummary = {
            generation: this.generation,
            bestFitness,
            averageFitness: Number.isFinite(averageFitness) ? averageFitness : 0
        };

        if (bestCar && bestFitness > this.bestScore && bestCar.brain && typeof bestCar.brain.clone === 'function') {
            this.bestScore = bestFitness;
            this.ghostBrain = this.bestBrain ? this.bestBrain.clone() : null; // Old best becomes ghost
            this.bestBrain = bestCar.brain.clone();
            this.bestMetadata = {
                generation: this.generation,
                fitness: bestFitness,
                recordedAt: new Date().toISOString()
            };
        }

        const parentCount = Math.max(2, Math.round(this.populationSize * this.eliteFraction));
        const parents = ranked.slice(0, parentCount).map(agent => agent.car);
        const newBrains = [];

        for (let i = 0; i < this.populationSize; i++) {
            if (i < parents.length) {
                newBrains.push(parents[i].brain.clone());
                continue;
            }

            const parentA = this.#selectParent(parents);
            const parentB = this.#selectParent(parents);
            let childBrain = NeuralNetwork.crossover(parentA.brain, parentB.brain);
            childBrain.mutate(this.mutationRate, this.mutationAmount);
            newBrains.push(childBrain);
        }

        this.generation += 1;
        this.framesInGeneration = 0;
        this.#spawnPopulation(newBrains);
    }

    #spawnInitialPopulation() {
        const brains = [];
        for (let i = 0; i < this.populationSize; i++) {
            if (i === 0 && this.bestBrain) {
                brains.push(this.bestBrain.clone());
            } else {
                brains.push(NeuralNetwork.createRandom(this.networkTopology, 2));
            }
        }
        this.#spawnPopulation(brains);
    }

    #spawnPopulation(brains) {
        this.cars = [];
        this.agentMeta = [];
        this.currentLeader = null;
        this.aliveCount = brains.length;

        const start = this.track.getStartPosition();

        // Spawn ghost car behind the start line
        if (this.ghostBrain) {
            const ghostOffset = -40;
            const ghostX = start.x + Math.cos(start.angle) * ghostOffset;
            const ghostY = start.y + Math.sin(start.angle) * ghostOffset;
            this.ghostCar = new Car(ghostX, ghostY, start.angle, {
                autonomous: true,
                brain: this.ghostBrain.clone(),
                isGhost: true
            });
            this.#configureSensor(this.ghostCar);
        } else {
            this.ghostCar = null;
        }

        const columns = Math.ceil(Math.sqrt(brains.length));
        const maxLateralOffset = this.track.trackWidth * 0.4; // Allow spawning within 80% of track width
        const lateralSpacing = Math.min(10, Math.max(2, maxLateralOffset / ((columns - 1) / 2)));
        const longitudinalSpacing = 18;
        const perpendicularAngle = start.angle + Math.PI / 2;
        const startLineOffset = -40; // Move cars back behind the start line

        brains.forEach((brain, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const lateralOffset = (column - (columns - 1) / 2) * lateralSpacing;
            const longitudinalOffset = startLineOffset - row * longitudinalSpacing;

            const spawnX = start.x + Math.cos(perpendicularAngle) * lateralOffset + Math.cos(start.angle) * longitudinalOffset;
            const spawnY = start.y + Math.sin(perpendicularAngle) * lateralOffset + Math.sin(start.angle) * longitudinalOffset;

            // Ensure spawn position is on track
            let finalX = spawnX;
            let finalY = spawnY;
            if (!this.track.isPointOnTrack(spawnX, spawnY)) {
                // If outside track, place at track edge in the direction of the offset
                const dist = Math.hypot(lateralOffset, longitudinalOffset);
                if (dist > 0) {
                    const dirX = lateralOffset / dist;
                    const dirY = longitudinalOffset / dist;
                    const edgeDist = this.track.trackWidth * 0.45; // Slightly inside track edge
                    finalX = start.x + dirX * edgeDist;
                    finalY = start.y + dirY * edgeDist;
                }
            }

            const brainInstance = brain && typeof brain.clone === 'function' ? brain.clone() : brain;
            const car = new Car(finalX, finalY, start.angle, { autonomous: true, brain: brainInstance });
            this.#configureSensor(car);
            car.distanceTravelled = 0;
            car.framesAlive = 0;
            car.fitness = 0;

            this.cars.push(car);
            this.agentMeta.push({
                car,
                idleFrames: 0
            });
        });
    }

    #configureSensor(car) {
        if (!car || !car.sensor) {
            return;
        }
        const config = this.sensorConfig;
        if (config.rayCount) {
            car.sensor.rayCount = config.rayCount;
        }
        if (config.rayLength) {
            car.sensor.rayLength = config.rayLength;
        }
        if (config.raySpread) {
            car.sensor.raySpread = config.raySpread;
        }
        if (config.step) {
            car.sensor.step = config.step;
        }
        car.sensor.rays = [];
        car.sensor.readings = [];
    }

    #selectParent(parents) {
        if (!parents.length) {
            throw new Error('Parent pool is empty.');
        }
        const totalFitness = parents.reduce((sum, car) => sum + Math.max(0.0001, car.fitness ?? 0), 0);
        let selection = Math.random() * totalFitness;
        for (const car of parents) {
            selection -= Math.max(0.0001, car.fitness ?? 0);
            if (selection <= 0) {
                return car;
            }
        }
        return parents[0];
    }

    hasBestBrain() {
        return !!this.bestBrain;
    }

    getBestBrain() {
        return this.bestBrain ? this.bestBrain.clone() : null;
    }

    exportBestBrain() {
        if (!this.bestBrain || typeof this.bestBrain.serialize !== 'function') {
            return null;
        }
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            metadata: {
                bestFitness: this.bestScore,
                generation: this.bestMetadata?.generation ?? this.generation,
                recordedAt: this.bestMetadata?.recordedAt ?? null
            },
            topology: this.networkTopology.slice(),
            brain: this.bestBrain.serialize()
        };
    }
    
    importBrain(data) {
        try {
            // Validate data structure
            if (!data || !data.brain || !data.brain.levels) {
                console.error('Invalid brain data structure');
                return false;
            }
            
            // Create a new neural network and deserialize the brain
            const brain = new NeuralNetwork(this.networkTopology);
            if (typeof brain.deserialize !== 'function') {
                console.error('NeuralNetwork.deserialize not available');
                return false;
            }
            
            brain.deserialize(data.brain);
            
            // Set as the best brain
            this.bestBrain = brain;
            this.bestScore = data.metadata?.bestFitness || 0;
            this.bestMetadata = {
                generation: data.metadata?.generation || 0,
                recordedAt: data.metadata?.recordedAt || new Date().toISOString(),
                trackName: data.metadata?.trackName || 'unknown'
            };
            
            console.log('Brain imported successfully:', this.bestMetadata);
            return true;
        } catch (error) {
            console.error('Failed to import brain:', error);
            return false;
        }
    }
}
