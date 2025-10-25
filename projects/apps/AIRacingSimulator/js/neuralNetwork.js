class NeuralNetwork {
    constructor(layerSizes) {
        if (!Array.isArray(layerSizes) || layerSizes.length < 2) {
            throw new Error('NeuralNetwork requires at least two layer sizes.');
        }
        this.layerSizes = layerSizes.slice();
        this.layers = this.layerSizes.slice(0, -1).map((size, index) => {
            const nextSize = this.layerSizes[index + 1];
            return {
                weights: Array.from({ length: nextSize }, () => Array.from({ length: size }, () => 0)),
                biases: Array.from({ length: nextSize }, () => 0)
            };
        });
    }

    static createRandom(layerSizes, range = 1) {
        const net = new NeuralNetwork(layerSizes);
        net.randomize(range);
        return net;
    }

    randomize(range = 1) {
        const half = range / 2;
        this.layers.forEach(layer => {
            layer.weights.forEach(row => {
                for (let i = 0; i < row.length; i++) {
                    row[i] = NeuralNetwork.#rand(-half, half);
                }
            });
            for (let i = 0; i < layer.biases.length; i++) {
                layer.biases[i] = NeuralNetwork.#rand(-half, half);
            }
        });
        return this;
    }

    feedForward(inputs) {
        let activations = inputs.slice();
        this.layers.forEach((layer, layerIndex) => {
            const next = new Array(layer.biases.length);
            for (let neuron = 0; neuron < layer.biases.length; neuron++) {
                let sum = layer.biases[neuron];
                const weights = layer.weights[neuron];
                for (let w = 0; w < weights.length; w++) {
                    sum += weights[w] * activations[w];
                }
                next[neuron] = NeuralNetwork.#activation(sum, layerIndex === this.layers.length - 1);
            }
            activations = next;
        });
        return activations;
    }

    clone() {
        const clone = new NeuralNetwork(this.layerSizes);
        clone.layers = this.layers.map(layer => ({
            weights: layer.weights.map(row => row.slice()),
            biases: layer.biases.slice()
        }));
        return clone;
    }

    mutate(rate = 0.1, amount = 0.3) {
        this.layers.forEach(layer => {
            layer.weights.forEach(row => {
                for (let i = 0; i < row.length; i++) {
                    if (Math.random() < rate) {
                        row[i] += NeuralNetwork.#rand(-amount, amount);
                    }
                }
            });
            for (let i = 0; i < layer.biases.length; i++) {
                if (Math.random() < rate) {
                    layer.biases[i] += NeuralNetwork.#rand(-amount, amount);
                }
            }
        });
        return this;
    }

    serialize() {
        return {
            layerSizes: this.layerSizes.slice(),
            layers: this.layers.map(layer => ({
                weights: layer.weights.map(row => row.slice()),
                biases: layer.biases.slice()
            }))
        };
    }

    static deserialize(serialized) {
        const data = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
        if (!data || !Array.isArray(data.layerSizes) || !Array.isArray(data.layers)) {
            throw new Error('Invalid neural network data.');
        }
        const net = new NeuralNetwork(data.layerSizes);
        net.layers.forEach((layer, index) => {
            const payload = data.layers[index];
            for (let neuron = 0; neuron < layer.biases.length; neuron++) {
                layer.biases[neuron] = payload.biases[neuron];
                for (let w = 0; w < layer.weights[neuron].length; w++) {
                    layer.weights[neuron][w] = payload.weights[neuron][w];
                }
            }
        });
        return net;
    }

    static crossover(parentA, parentB) {
        if (!parentA || !parentB) {
            throw new Error('Two parent networks are required for crossover.');
        }
        if (parentA.layerSizes.join(',') !== parentB.layerSizes.join(',')) {
            throw new Error('Parent networks must share the same topology.');
        }
        const child = new NeuralNetwork(parentA.layerSizes);
        child.layers.forEach((layer, index) => {
            const layerA = parentA.layers[index];
            const layerB = parentB.layers[index];
            for (let neuron = 0; neuron < layer.biases.length; neuron++) {
                const chooseA = Math.random() < 0.5;
                layer.biases[neuron] = chooseA ? layerA.biases[neuron] : layerB.biases[neuron];
                for (let w = 0; w < layer.weights[neuron].length; w++) {
                    layer.weights[neuron][w] = Math.random() < 0.5 ? layerA.weights[neuron][w] : layerB.weights[neuron][w];
                }
            }
        });
        return child;
    }

    static #activation(value, isOutputLayer) {
        // Hidden layers use tanh for smooth saturation; output layer also tanh to keep signals in [-1, 1]
        return Math.tanh(value);
    }

    static #rand(min, max) {
        return Math.random() * (max - min) + min;
    }
}
