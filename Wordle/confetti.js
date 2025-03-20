class Confetti {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.active = false;
    
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1000';
    
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });

    // Additional properties for better confetti
    this.particleCount = 300; // Increase particle count
    this.gravity = 0.1;
    this.terminalVelocity = 2;
    this.drag = 0.075;
    this.colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
      '#FFFFFF', '#FFEB3B', '#69f0ae', '#FFD700', '#FFA500'
    ];
    this.shapes = ['circle', 'square', 'triangle', 'line', 'star'];
  }
  
  start() {
    if (this.active) return;
    
    document.body.appendChild(this.canvas);
    this.active = true;
    this.createParticles();
    requestAnimationFrame(this.animate.bind(this));
    
    // Add a secondary burst after a short delay
    setTimeout(() => {
      if (this.active) this.addSecondaryBurst();
    }, 700);
    
    // Stop after 6 seconds (extended duration)
    setTimeout(() => this.stop(), 6000);
  }
  
  stop() {
    this.active = false;
    if (this.canvas.parentElement) {
      document.body.removeChild(this.canvas);
    }
  }
  
  // Add a secondary burst of particles for a more dynamic effect
  addSecondaryBurst() {
    const extraParticles = [];
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < 80; i++) {
      extraParticles.push(this.createParticle(centerX, centerY, true));
    }
    
    this.particles = [...this.particles, ...extraParticles];
  }
  
  createParticles() {
    this.particles = [];
    
    // Center of the screen as the source point
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Create initial burst of particles
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle(centerX, centerY, false));
    }
  }
  
  // Helper method to create a single particle
  createParticle(centerX, centerY, isSecondary = false) {
    // Calculate direction angle (full 360 degrees)
    const angle = Math.random() * Math.PI * 2;
    
    // Start particles from center with minimal initial distance
    const distance = isSecondary ? 0 : Math.random() * 50;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    const size = Math.random() * 10 + 5;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    // Higher initial speed for better dispersion
    const speed = Math.random() * 7 + (isSecondary ? 6 : 4);
    // Use the same angle for movement direction to ensure outward motion
    const moveAngle = angle;
    const angularSpeed = (Math.random() - 0.5) * 0.3;
    const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
    
    // Add shimmer effect to some particles
    const shimmer = Math.random() > 0.7; 
    const shimmerSpeed = Math.random() * 0.05 + 0.01;
    let shimmerValue = 0;
    
    return {
      x, y, size, color, speed, angle: moveAngle, angularSpeed, shape,
      rotation: Math.random() * Math.PI * 2,
      gravity: this.gravity + Math.random() * 0.05,
      drag: this.drag + Math.random() * 0.02,
      waveSize: Math.random() * 5 + 1,
      shimmer, shimmerSpeed, shimmerValue,
      opacity: 1,
      fadeSpeed: 0.005 + Math.random() * 0.01
    };
  }
  
  animate() {
    if (!this.active) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Update particle position and physics
      p.rotation += p.angularSpeed;
      p.speed *= (1 - p.drag);
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed + p.gravity;
      
      // Apply slight sideways oscillation for a floating effect
      p.x += Math.sin(p.shimmerValue * 5) * p.waveSize * 0.1;
      
      // Update shimmer effect
      if (p.shimmer) {
        p.shimmerValue += p.shimmerSpeed;
      }
      
      // Gradually fade out particles
      p.opacity -= p.fadeSpeed;
      if (p.opacity < 0) p.opacity = 0;
      
      // Draw the particle
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      
      // Draw different shapes
      switch(p.shape) {
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        case 'square':
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          break;
        case 'triangle':
          this.ctx.beginPath();
          this.ctx.moveTo(0, -p.size);
          this.ctx.lineTo(p.size, p.size);
          this.ctx.lineTo(-p.size, p.size);
          this.ctx.closePath();
          this.ctx.fill();
          break;
        case 'line':
          this.ctx.fillRect(-p.size / 8, -p.size, p.size / 4, p.size * 2);
          break;
        case 'star':
          this.drawStar(0, 0, 5, p.size/2, p.size);
          break;
      }
      
      this.ctx.restore();
      
      // Add some random movement occasionally
      if (Math.random() < 0.02) {
        p.angle += (Math.random() - 0.5) * 0.5;
      }
    }
    
    // Check if any particles still in view
    const anyVisible = this.particles.some(p => 
      p.opacity > 0.1 && 
      p.y < this.canvas.height + p.size && 
      p.y > -p.size &&
      p.x < this.canvas.width + p.size && 
      p.x > -p.size
    );
    
    if (anyVisible) {
      requestAnimationFrame(this.animate.bind(this));
    } else {
      this.stop();
    }
  }
  
  // Helper function to draw a star
  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }
}

// Export as global
window.Confetti = Confetti;
