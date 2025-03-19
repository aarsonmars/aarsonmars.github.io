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
  }
  
  start() {
    if (this.active) return;
    
    document.body.appendChild(this.canvas);
    this.active = true;
    this.createParticles();
    requestAnimationFrame(this.animate.bind(this));
    
    // Stop after 4 seconds
    setTimeout(() => this.stop(), 5000);
  }
  
  stop() {
    this.active = false;
    if (this.canvas.parentElement) {
      document.body.removeChild(this.canvas);
    }
  }
  
  createParticles() {
    this.particles = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50',
                    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    // Get the modal positions to create particles around it
    const modal = document.querySelector('.modal-content');
    let centerX = this.canvas.width / 2;
    let centerY = this.canvas.height / 2;
    let radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
    
    if (modal) {
      const rect = modal.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      radius = Math.max(rect.width, rect.height) * 0.7;
    }
                    
    for (let i = 0; i < 250; i++) {
      // Calculate a position around the modal
      const angle = Math.random() * Math.PI * 2;
      const distance = radius + (Math.random() * 50);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      const size = Math.random() * 8 + 3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const speed = Math.random() * 2 + 1;
      const moveAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5; // Slightly randomize direction
      const angularSpeed = (Math.random() - 0.5) * 0.2;
      const shape = Math.random() > 0.5 ? 'circle' : 'square';
      
      this.particles.push({
        x, y, size, color, speed, angle: moveAngle, angularSpeed, shape,
        rotation: 0,
        gravity: 0.05 + Math.random() * 0.1,
        resistance: 0.96 + Math.random() * 0.02
      });
    }
  }
  
  animate() {
    if (!this.active) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.rotation += p.angularSpeed;
      p.speed *= p.resistance;
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed + p.gravity;
      
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      
      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      
      this.ctx.restore();
      
      // Add some random movement
      if (Math.random() < 0.03) {
        p.angle += (Math.random() - 0.5) * 0.5;
      }
    }
    
    // Check if any particles still in view
    const anyVisible = this.particles.some(p => 
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
}

// Export as global
window.Confetti = Confetti;
