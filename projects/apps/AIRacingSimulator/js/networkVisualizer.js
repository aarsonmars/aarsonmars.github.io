/**
 * Neural Network Visualizer
 * Displays the neural network structure with live activations and weights
 */
class NetworkVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.brain = null;
        this.inputs = [];
        this.outputs = [];
        this.activations = []; // Stores activation values for all layers
        this.enabled = false;
        this.neuronRadius = 12;
        this.layerSpacing = 120;
        this.neuronSpacing = 35;
        this.showWeights = true;
        this.animationFrame = 0;
        
        // Color schemes
        this.colors = {
            positive: '#00ff88',
            negative: '#ff4444',
            neutral: '#888888',
            background: 'rgba(20, 20, 30, 0.95)',
            neuronInactive: '#2a2a3a',
            neuronActive: '#00ff88',
            text: '#ffffff',
            inputLabel: '#4488ff',
            outputLabel: '#ff8844'
        };
        
        // Input/Output labels
        this.inputLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'Speed'];
        this.outputLabels = ['Steer', 'Throttle'];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    setBrain(brain) {
        this.brain = brain;
        if (brain) {
            this.activations = new Array(brain.layers.length + 1).fill(null).map(() => []);
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }
    
    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }
    
    clear() {
        if (!this.ctx) return;
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Update and render the network with current inputs and outputs
     */
    update(brain, inputs, outputs) {
        if (!this.enabled || !this.canvas || !brain) return;
        
        this.brain = brain;
        this.inputs = inputs || [];
        this.outputs = outputs || [];
        
        // Compute all activations through the network
        this.computeActivations();
        
        // Render
        this.render();
        
        this.animationFrame++;
    }
    
    computeActivations() {
        if (!this.brain || !this.inputs.length) return;
        
        // Store input layer activations
        this.activations[0] = this.inputs.slice();
        
        // Compute activations for each layer
        let currentActivations = this.inputs.slice();
        this.brain.layers.forEach((layer, layerIndex) => {
            const nextActivations = [];
            for (let neuron = 0; neuron < layer.biases.length; neuron++) {
                let sum = layer.biases[neuron];
                const weights = layer.weights[neuron];
                for (let w = 0; w < weights.length; w++) {
                    sum += weights[w] * currentActivations[w];
                }
                // Apply activation function (tanh)
                nextActivations.push(Math.tanh(sum));
            }
            this.activations[layerIndex + 1] = nextActivations;
            currentActivations = nextActivations;
        });
    }
    
    render() {
        if (!this.ctx || !this.brain) return;
        
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate layout
        const layers = [this.inputs.length, ...this.brain.layerSizes.slice(1)];
        const totalLayers = layers.length;
        const maxNeuronsInLayer = Math.max(...layers);
        
        // Calculate dimensions
        const padding = 40;
        const availableWidth = this.canvas.width - padding * 2;
        const availableHeight = this.canvas.height - padding * 2;
        
        const layerSpacing = Math.min(this.layerSpacing, availableWidth / (totalLayers - 1));
        const neuronSpacing = Math.min(this.neuronSpacing, availableHeight / (maxNeuronsInLayer - 1));
        
        // Calculate neuron positions
        const neuronPositions = [];
        layers.forEach((neuronCount, layerIndex) => {
            const layerPositions = [];
            const layerX = padding + layerIndex * layerSpacing;
            const layerHeight = (neuronCount - 1) * neuronSpacing;
            const startY = (this.canvas.height - layerHeight) / 2;
            
            for (let i = 0; i < neuronCount; i++) {
                layerPositions.push({
                    x: layerX,
                    y: startY + i * neuronSpacing
                });
            }
            neuronPositions.push(layerPositions);
        });
        
        // Draw connections (weights)
        if (this.showWeights) {
            this.drawConnections(neuronPositions);
        }
        
        // Draw neurons
        this.drawNeurons(neuronPositions, layers);
        
        // Draw labels
        this.drawLabels(neuronPositions, layers);
        
        // Draw legend
        this.drawLegend();
    }
    
    drawConnections(neuronPositions) {
        if (!this.brain) return;
        
        this.brain.layers.forEach((layer, layerIndex) => {
            const fromLayer = neuronPositions[layerIndex];
            const toLayer = neuronPositions[layerIndex + 1];
            
            layer.weights.forEach((weights, toNeuron) => {
                weights.forEach((weight, fromNeuron) => {
                    const from = fromLayer[fromNeuron];
                    const to = toLayer[toNeuron];
                    
                    // Calculate activation-based opacity
                    const fromActivation = this.activations[layerIndex]?.[fromNeuron] || 0;
                    const toActivation = this.activations[layerIndex + 1]?.[toNeuron] || 0;
                    const activationStrength = Math.abs(fromActivation * toActivation);
                    
                    // Normalize weight for visualization (-2 to 2 typical range)
                    const normalizedWeight = Math.max(-1, Math.min(1, weight / 2));
                    const weightStrength = Math.abs(normalizedWeight);
                    
                    // Color based on weight sign and activation
                    const isPositive = weight > 0;
                    const baseColor = isPositive ? this.colors.positive : this.colors.negative;
                    
                    // Combine weight strength and activation
                    const opacity = Math.max(0.05, Math.min(0.4, weightStrength * 0.3 + activationStrength * 0.3));
                    const lineWidth = 0.5 + weightStrength * 1.5;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(from.x, from.y);
                    this.ctx.lineTo(to.x, to.y);
                    this.ctx.strokeStyle = this.hexToRGBA(baseColor, opacity);
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.stroke();
                });
            });
        });
    }
    
    drawNeurons(neuronPositions, layers) {
        neuronPositions.forEach((layerPositions, layerIndex) => {
            layerPositions.forEach((pos, neuronIndex) => {
                // Get activation value
                const activation = this.activations[layerIndex]?.[neuronIndex] || 0;
                const activationAbs = Math.abs(activation);
                
                // Neuron circle
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, this.neuronRadius, 0, Math.PI * 2);
                
                // Fill based on activation
                if (activationAbs > 0.01) {
                    const intensity = Math.min(1, activationAbs);
                    const color = activation > 0 ? this.colors.positive : this.colors.negative;
                    this.ctx.fillStyle = this.hexToRGBA(color, 0.3 + intensity * 0.5);
                } else {
                    this.ctx.fillStyle = this.colors.neuronInactive;
                }
                this.ctx.fill();
                
                // Border
                this.ctx.strokeStyle = activationAbs > 0.1 ? 
                    this.hexToRGBA(activation > 0 ? this.colors.positive : this.colors.negative, 0.8) : 
                    this.colors.neutral;
                this.ctx.lineWidth = activationAbs > 0.5 ? 2 : 1;
                this.ctx.stroke();
                
                // Activation value text
                if (activationAbs > 0.05) {
                    this.ctx.fillStyle = this.colors.text;
                    this.ctx.font = '10px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(activation.toFixed(2), pos.x, pos.y);
                }
            });
        });
    }
    
    drawLabels(neuronPositions, layers) {
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textBaseline = 'middle';
        
        // Input labels
        neuronPositions[0].forEach((pos, i) => {
            this.ctx.fillStyle = this.colors.inputLabel;
            this.ctx.textAlign = 'right';
            const label = this.inputLabels[i] || `I${i}`;
            this.ctx.fillText(label, pos.x - this.neuronRadius - 5, pos.y);
            
            // Input value
            const value = this.inputs[i] || 0;
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '9px monospace';
            this.ctx.fillText(value.toFixed(2), pos.x - this.neuronRadius - 5, pos.y + 12);
            this.ctx.font = 'bold 11px Arial';
        });
        
        // Output labels
        const outputLayer = neuronPositions[neuronPositions.length - 1];
        outputLayer.forEach((pos, i) => {
            this.ctx.fillStyle = this.colors.outputLabel;
            this.ctx.textAlign = 'left';
            const label = this.outputLabels[i] || `O${i}`;
            this.ctx.fillText(label, pos.x + this.neuronRadius + 5, pos.y);
            
            // Output value
            const value = this.outputs[i] || 0;
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '9px monospace';
            this.ctx.fillText(value.toFixed(2), pos.x + this.neuronRadius + 5, pos.y + 12);
            this.ctx.font = 'bold 11px Arial';
        });
        
        // Layer labels
        this.ctx.fillStyle = this.colors.text;
        this.ctx.textAlign = 'center';
        this.ctx.font = '10px Arial';
        neuronPositions.forEach((layerPos, i) => {
            if (layerPos.length > 0) {
                let layerLabel;
                if (i === 0) layerLabel = 'Input';
                else if (i === neuronPositions.length - 1) layerLabel = 'Output';
                else layerLabel = `Hidden ${i}`;
                
                this.ctx.fillText(layerLabel, layerPos[0].x, 15);
                this.ctx.fillText(`(${layers[i]})`, layerPos[0].x, 27);
            }
        });
    }
    
    drawLegend() {
        const x = this.canvas.width - 150;
        const y = this.canvas.height - 80;
        
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'left';
        
        // Positive
        this.ctx.fillStyle = this.colors.positive;
        this.ctx.fillRect(x, y, 15, 3);
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText('Positive weight', x + 20, y + 2);
        
        // Negative
        this.ctx.fillStyle = this.colors.negative;
        this.ctx.fillRect(x, y + 15, 15, 3);
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText('Negative weight', x + 20, y + 17);
        
        // Active neuron
        this.ctx.beginPath();
        this.ctx.arc(x + 7, y + 35, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = this.hexToRGBA(this.colors.positive, 0.7);
        this.ctx.fill();
        this.ctx.strokeStyle = this.colors.positive;
        this.ctx.stroke();
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText('Active neuron', x + 20, y + 35);
        
        // Generation info
        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText(`Frame: ${this.animationFrame}`, x, y + 55);
    }
    
    hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
