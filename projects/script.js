document.addEventListener('DOMContentLoaded', () => {
    const starfield = document.getElementById('starfield');
    if (starfield) {
        const ctx = starfield.getContext('2d');
        const projectCards = document.querySelectorAll('.project-card');
        const heroSection = document.querySelector('.hero-section');
        let stars = [];
        let animationFrameId;

        function resizeCanvas() {
            // Set canvas size based on its container, not the window
            starfield.width = heroSection.offsetWidth;
            starfield.height = heroSection.offsetHeight;
            // Re-initialize stars on resize to fit new dimensions
            initializeStars();
        }
        

        function initializeStars() {
            stars = [];
            const numStars = projectCards.length;
            for (let i = 0; i < numStars; i++) {
                const card = projectCards[i];
                stars.push({
                    x: Math.random() * starfield.width,
                    y: Math.random() * starfield.height,
                    radius: Math.random() * 1.5 + 1,
                    baseRadius: Math.random() * 1.5 + 1,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    isGlowing: false,
                    element: card,
                    id: `star-${i}`,
                    glowPulse: 0,
                    glowDirection: 1
                });
                card.dataset.starId = `star-${i}`;
            }
        }

        function draw() {
            ctx.clearRect(0, 0, starfield.width, starfield.height);
            
            stars.forEach(star => {
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                
                if (star.isGlowing) {
                    // Pulsating effect
                    star.glowPulse += 0.03 * star.glowDirection;
                    if (star.glowPulse > 1 || star.glowPulse < 0) {
                        star.glowDirection *= -1;
                    }
                    const currentRadius = star.baseRadius + (star.glowPulse * 2.5); // Increased pulse size
                    
                    ctx.shadowBlur = 15 + (star.glowPulse * 15); // Increased glow
                    ctx.shadowColor = '#61dafb';
                    ctx.arc(star.x, star.y, currentRadius, 0, 2 * Math.PI);

                } else {
                     if (star.glowPulse > 0) {
                        star.glowPulse -= 0.05;
                     }
                    const currentRadius = star.baseRadius + (star.glowPulse * 2.5); // Increased pulse size
                    ctx.shadowBlur = star.glowPulse * 30; // Increased glow
                    ctx.shadowColor = '#61dafb';
                    ctx.arc(star.x, star.y, currentRadius, 0, 2 * Math.PI);
                }

                ctx.fill();
                ctx.closePath();
                ctx.shadowBlur = 0; // Reset shadow for next star
            });
        }

        function update() {
            stars.forEach(s => {
                s.x += s.vx;
                s.y += s.vy;

                // Bounce off edges
                if (s.x - s.radius < 0 || s.x + s.radius > starfield.width) s.vx = -s.vx;
                if (s.y - s.radius < 0 || s.y + s.radius > starfield.height) s.vy = -s.vy;
            });
        }

        function tick() {
            update();
            draw();
            animationFrameId = requestAnimationFrame(tick);
        }

        projectCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const star = stars.find(s => s.id === card.dataset.starId);
                if (star) star.isGlowing = true;
            });
            card.addEventListener('mouseleave', () => {
                const star = stars.find(s => s.id === card.dataset.starId);
                if (star) star.isGlowing = false;
            });
        });

        starfield.addEventListener('click', (e) => {
            const rect = starfield.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            stars.forEach(star => {
                const distance = Math.sqrt(Math.pow(mouseX - star.x, 2) + Math.pow(mouseY - star.y, 2));
                if (distance < star.radius + 10) {
                    star.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
        
        // Initial setup
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        tick();
    }

    // Project filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;

            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});
