# AI Racing Simulator 🏎️

An interactive web-based AI racing simulator that trains cars to race autonomously using genetic algorithms and neural networks. Watch as AI cars evolve from random movement to expert racing strategies!

![AI Racing Simulator](https://img.shields.io/badge/Status-Active-brightgreen) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-blue) ![Canvas](https://img.shields.io/badge/HTML5-Canvas-orange)

## 🎮 Live Demo

[🚀 Try it now!](https://aarsonmars.github.io/projects/apps/AIRacingSimulator/)

## ✨ Features

### 🧠 AI Training System
- **Genetic Algorithm**: Population-based evolution with crossover and mutation
- **Neural Networks**: 16-12 neuron architecture with sensor inputs
- **Auto-Stop**: Automatically stops when cars master the track (3+ laps by 5+ cars)
- **Progressive Difficulty**: 5 tracks from beginner to expert level

### 🎯 Track System
- **5 Progressive Tracks**:
  - 🟢 Oval Circuit (Beginner)
  - 🟡 Beginner Track (Easy)
  - 🟠 Intermediate Circuit (Medium)
  - 🔴 Advanced Circuit (Hard)
  - ⚫ Expert Circuit (Expert)
- **Lap Tracking**: Real-time lap counting and completion detection
- **Checkpoint System**: Accurate lap timing and progress tracking

### 🎮 Manual Controls
- **Arrow Keys**: Drive manually (↑ accelerate, ↓ brake, ←→ steer)
- **Real-time Feedback**: Speed, lap time, and best lap tracking
- **Collision Detection**: Realistic crash mechanics

### ⚙️ Advanced Settings
- **Population Size**: 5-200 cars (configurable)
- **Mutation Rate**: 0.01-0.5 (genetic variation control)
- **Frame Limit**: 300-5000 frames per generation
- **Render Interval**: Skip generations for faster training
- **Simulation Speed**: 1-20 steps per update
- **Auto-Stop Parameters**: Customizable mastery thresholds

### 💾 Model Management
- **Save/Load Models**: Export trained models as JSON files
- **Track-Aware Naming**: Models include track difficulty in filename
- **Model Selector**: Choose between current model or load saved models
- **Metadata Storage**: Generation, fitness, and track information

### 📊 Real-Time Stats
- **Training Progress**: Generation counter and alive car count
- **Performance Metrics**: Best fitness scores and lap times
- **Visual Feedback**: Training visualization with adjustable speed

## 🚀 How to Use

### Quick Start
1. **Open the simulator** in your web browser
2. **Select a track** from the dropdown (start with Oval for beginners)
3. **Click "🧠 Start AI Training"** to begin evolution
4. **Watch the AI learn** - cars will improve over generations
5. **Training auto-stops** when cars master the track
6. **Test the best model** using the trophy button (🏆)

### Manual Driving
- Use **arrow keys** to drive manually
- **↑** to accelerate, **↓** to brake/reverse, **←→** to steer
- Try to beat your lap times!

### Advanced Training
- **Adjust settings** (⚙️) for different training modes
- **Change tracks** to train on different difficulties
- **Save models** (💾) to reuse later
- **Load saved models** to test or continue training

## 🎯 Controls & Interface

### Header Controls
- **🧠 Start AI Training**: Begin evolutionary training
- **🏆 Run Best Model**: Test the trained AI (select from current or saved models)
- **👁️ Toggle View**: Show/hide sensor rays and adjust training speed
- **⚙️ Settings**: Configure training parameters
- **🔄 Reset Car**: Restart manual driving
- **💾 Download Best Model**: Save trained model as JSON
- **ℹ️ How to Use**: Comprehensive help guide

### Sidebar
- **Track Selection**: Choose from 5 difficulty levels
- **Real-time Stats**: Generation, alive count, fitness scores
- **Manual Stats**: Speed, lap time, personal best

## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript + HTML5 Canvas
- **AI Engine**: Custom genetic algorithm implementation
- **Neural Network**: Feed-forward network with backpropagation
- **Physics**: Real-time car physics with collision detection
- **Storage**: localStorage for settings and model persistence

### Neural Network Details
- **Input Layer**: 7 sensors (distances) + speed (8 total)
- **Hidden Layers**: Configurable (default: 16-12 neurons)
- **Output Layer**: 2 neurons (steering + acceleration)
- **Activation**: Tanh for hidden, linear for output

### Genetic Algorithm
- **Population**: 5-200 individuals per generation
- **Selection**: Fitness-proportional selection
- **Crossover**: Single-point crossover
- **Mutation**: Gaussian noise (0.01-0.5 rate)
- **Elitism**: Best individuals preserved

### Performance
- **60 FPS**: Smooth rendering and physics
- **Configurable Speed**: Training visualization adjustable
- **Memory Efficient**: Optimized for web browsers
- **No External Dependencies**: Pure JavaScript implementation

## 🌐 Browser Compatibility

- ✅ **Chrome/Edge**: Full support (recommended)
- ✅ **Firefox**: Full support
- ✅ **Safari**: Full support
- ✅ **Mobile Browsers**: Touch controls supported
- ⚠️ **Legacy Browsers**: May have reduced performance

### System Requirements
- **RAM**: 512MB minimum, 1GB recommended
- **CPU**: Modern processor for smooth training
- **Storage**: ~10MB for localStorage and saved models

## 📁 Project Structure

```
AIRacingSimulator/
├── index.html          # Main HTML file
├── styles.css          # Styling and animations
├── js/
│   ├── config.js       # Game configuration and tracks
│   ├── main.js         # Game loop and UI management
│   ├── car.js          # Car physics and manual controls
│   ├── track.js        # Track rendering and collision
│   ├── sensors.js      # Distance sensors
│   ├── neuralNetwork.js # Neural network implementation
│   ├── trainingManager.js # Genetic algorithm
│   └── controls.js     # Input handling
└── README.md          # This file
```

## 🎓 Educational Value

This project demonstrates:
- **Machine Learning**: Neural networks and genetic algorithms
- **Computer Graphics**: HTML5 Canvas rendering
- **Game Physics**: Realistic car movement and collision
- **Algorithm Optimization**: Evolutionary computation
- **Web Development**: Modern JavaScript and responsive design

Perfect for:
- Learning AI/ML concepts
- Computer science education
- Portfolio projects
- Demonstrating programming skills

## 🚀 Future Enhancements

Based on the improvement roadmap, planned features include:

### High Priority
- **Training Analytics Dashboard** 📊
- **Model Comparison & Leaderboard** 🏆
- **Ghost Replay System** 👻
- **Training Presets** 🎯
- **Interactive Track Editor** 🛣️
- **Neural Network Visualization** 🧠

### Medium Priority
- **Mobile Optimization** 📱
- **Advanced Training Features** ⚡
- **Visual Polish** ✨
- **Sound Effects** 🔊
- **Tutorial System** 📚

### Advanced Features
- **Multiplayer Ghost Racing** 🏁
- **3D Track Mode** 🎮
- **Different AI Algorithms** 🤖
- **Car Customization** 🚗

## 🤝 Contributing

This project welcomes contributions! Areas for improvement:

1. **Performance Optimization**: Web Workers, WebAssembly
2. **New Features**: From the improvement roadmap
3. **Bug Fixes**: Testing across different browsers
4. **Documentation**: Code comments and tutorials
5. **Accessibility**: Screen reader support, keyboard navigation

### Development Setup
1. Clone the repository
2. Open `index.html` in a modern web browser
3. No build process required - pure client-side JavaScript

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with vanilla JavaScript and HTML5 Canvas
- Inspired by evolutionary algorithms and reinforcement learning
- Part of the [Sagar Bhandari Portfolio](https://aarsonmars.github.io/)

## 📞 Contact

**Sagar Bhandari**
- Portfolio: [aarsonmars.github.io](https://aarsonmars.github.io/)
- GitHub: [@aarsonmars](https://github.com/aarsonmars)
- LinkedIn: [aarsonmars](https://www.linkedin.com/in/aarsonmars/)

---

*Experience the future of autonomous driving - train your own AI race car today!* 🏎️💨🤖</content>
<parameter name="filePath">e:\PRJCTS\Personal-Website\projects\apps\AIRacingSimulator\README.md