// Background canvas animation setup
let canvas;
let ctx;

// Initialize the canvas animation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  canvas = document.getElementById('bg');
  ctx = canvas.getContext('2d');
  
  // Set canvas dimensions to match window
  resizeCanvas();
  
  // Start animation
  animateBackground();
  
  // Improve accessibility with keyboard navigation
  setupKeyboardNavigation();
});

// Responsive canvas sizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', function() {
  // Resize canvas on window resize
  resizeCanvas();
  
  // Handle section overflow
  const gameSection = document.getElementById('games');
  const appSection = document.getElementById('apps');
  
  // Force recalculation of overflow
  if (gameSection) {
    gameSection.style.overflow = 'hidden';
    setTimeout(() => { 
      gameSection.style.overflowY = 'auto';
      gameSection.style.overflowX = 'hidden';
    }, 10);
  }
  
  if (appSection) {
    appSection.style.overflow = 'hidden';
    setTimeout(() => {
      appSection.style.overflowY = 'auto'; 
      appSection.style.overflowX = 'hidden';
    }, 10);
  }
});

// Background animation function
function animateBackground() {
  if (!canvas || !ctx) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set background
  ctx.fillStyle = 'rgb(12, 12, 24)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw subtle floating particles
  drawParticles();
  
  // Continue animation
  requestAnimationFrame(animateBackground);
}

// Particles for background effect
const particles = [];
for (let i = 0; i < 50; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 0.5 + 0.1,
    opacity: Math.random() * 0.5 + 0.1
  });
}

function drawParticles() {
  particles.forEach(particle => {
    // Move particle
    particle.y -= particle.speed;
    
    // Reset if off screen
    if (particle.y < 0) {
      particle.y = canvas.height;
      particle.x = Math.random() * canvas.width;
    }
    
    // Draw particle
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(74, 158, 255, ${particle.opacity})`;
    ctx.fill();
  });
}

// Fix for iOS Safari 100vh issue
function setViewportHeight() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);
setViewportHeight();

// Enhance touch scrolling for mobile
document.addEventListener('touchmove', function(e) {
  const targetElement = e.target;
  if (targetElement.closest('#games') || targetElement.closest('#apps')) {
    e.stopPropagation();
  }
}, { passive: true });

// Improve keyboard accessibility
function setupKeyboardNavigation() {
  // Get all interactive elements
  const interactiveElements = document.querySelectorAll('a, button');
  
  interactiveElements.forEach(element => {
    // Add focus styles
    element.addEventListener('focus', () => {
      element.classList.add('keyboard-focus');
    });
    
    element.addEventListener('blur', () => {
      element.classList.remove('keyboard-focus');
    });
  });
}

// Add loading indicator
window.addEventListener('load', function() {
  // Hide any loading elements once page is fully loaded
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
  
  // Fade in content
  document.body.classList.add('loaded');
});

// Lazy load images
if ('IntersectionObserver' in window) {
  const imgObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  });
  
  // Apply to all images with data-src attribute
  document.querySelectorAll('img[data-src]').forEach(img => {
    imgObserver.observe(img);
  });
}