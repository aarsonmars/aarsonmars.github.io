const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-links a');

// Mobile menu toggle
burger.addEventListener('click', () => {
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', (!expanded).toString());
    nav.classList.toggle('nav-active');
    burger.classList.toggle('toggle');
});

// Close mobile nav when a link is clicked
nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        nav.classList.remove('nav-active');
        burger.classList.remove('toggle');
        burger.setAttribute('aria-expanded', 'false');
    }
});

// Scroll effects (shrink navbar + back-to-top visibility + progress bar)
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const backToTopButton = document.querySelector('.back-to-top');
    const scrollProgress = document.getElementById('scrollProgress');
    const scrollY = window.scrollY;

    navbar.classList.toggle('scrolled', scrollY > 50);
    backToTopButton.classList.toggle('visible', scrollY > 300);

    // Scroll progress bar
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = scrollPercent + '%';
});

// Active link highlighting using IntersectionObserver
const sections = document.querySelectorAll('section[id]');
const navMap = {};
navLinks.forEach(link => {
    const hash = link.getAttribute('href');
    if (hash && hash.startsWith('#')) navMap[hash.substring(1)] = link; // map id -> link
});

const setActive = (id) => {
    if (!id || !navMap[id]) return;
    navLinks.forEach(a => a.classList.remove('active'));
    navMap[id].classList.add('active');
    // update aria-current
    navLinks.forEach(a => a.removeAttribute('aria-current'));
    navMap[id].setAttribute('aria-current', 'page');
};

// Use rootMargin to trigger a bit before actual midpoint, threshold 0.5 for reliability
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            setActive(entry.target.id);
        }
    });
}, { threshold: 0.5 });

sections.forEach(section => observer.observe(section));

// If page loaded with hash scroll to it smoothly and mark active
window.addEventListener('load', () => {
    const { hash } = window.location;
    if (hash && navMap[hash.substring(1)]) {
        setTimeout(() => {
            document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
            setActive(hash.substring(1));
        }, 50);
    }
});

// AOS Initialization
AOS.init({
    duration: 800,
    once: true,
    offset: 50,
});

// === Custom Cursor ===
(function initCustomCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;
    // Only enable on devices with hover capability
    if (!window.matchMedia('(hover: hover)').matches) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });

    // Smooth trailing ring
    function animateRing() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Scale up on hovering interactive elements
    const hoverTargets = document.querySelectorAll('a, button, .burger, .project-card, .expertise-card');
    hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.classList.add('hovering');
            ring.classList.add('hovering');
        });
        el.addEventListener('mouseleave', () => {
            dot.classList.remove('hovering');
            ring.classList.remove('hovering');
        });
    });
})();

// === Smooth Page Transition on Nav Clicks ===
(function initPageTransition() {
    const overlay = document.getElementById('pageTransition');
    if (!overlay) return;
    const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
    navAnchors.forEach(a => {
        a.addEventListener('click', (e) => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            overlay.classList.add('active');
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth' });
                overlay.classList.remove('active');
            }, 300);
        });
    });
})();

// === Mouse Spotlight ===
(function initSpotlight() {
    const spot = document.getElementById('mouseSpotlight');
    if (!spot) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.addEventListener('mousemove', (e) => {
        spot.style.left = e.clientX + 'px';
        spot.style.top = e.clientY + 'px';
        if (!spot.classList.contains('visible')) spot.classList.add('visible');
    });
    document.addEventListener('mouseleave', () => {
        spot.classList.remove('visible');
    });
})();

// === Magnetic Social Buttons ===
(function initMagneticButtons() {
    const links = document.querySelectorAll('.social-links a');
    const strength = 0.35;
    const threshold = 50;

    links.forEach(link => {
        link.addEventListener('mousemove', (e) => {
            const rect = link.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < threshold) {
                link.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
            }
        });
        link.addEventListener('mouseleave', () => {
            link.style.transform = 'translate(0, 0)';
        });
    });
})();

// 3D Tilt effect on project cards & expertise cards
(function initTiltEffect() {
    const cards = document.querySelectorAll('.project-card, .expertise-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
            card.style.transition = 'transform 0.4s ease';
        });
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease';
        });
    });
})();

// Parallax hero — background scrolls slower
(function initParallax() {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight) {
            hero.style.transform = `translateY(${scrollY * 0.3}px)`;
            hero.style.opacity = 1 - scrollY / (window.innerHeight * 1.2);
        }
    }, { passive: true });
})();

// Typing effect for hero subtitle
(function initTypingEffect() {
    const roles = [
        'Civil Engineer',
        'GIS Analyst',
        'AI/ML Enthusiast',
        'Web Developer',
        'Transportation Engineer'
    ];
    const typedEl = document.getElementById('typed-text');
    if (!typedEl) return;

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 80;
    const deleteSpeed = 40;
    const pauseAfterType = 2000;
    const pauseAfterDelete = 400;

    function tick() {
        const currentRole = roles[roleIndex];

        if (!isDeleting) {
            // Typing forward
            typedEl.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;

            if (charIndex === currentRole.length) {
                // Finished typing — pause then start deleting
                isDeleting = true;
                setTimeout(tick, pauseAfterType);
                return;
            }
            setTimeout(tick, typeSpeed);
        } else {
            // Deleting
            typedEl.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;

            if (charIndex === 0) {
                // Finished deleting — move to next role
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                setTimeout(tick, pauseAfterDelete);
                return;
            }
            setTimeout(tick, deleteSpeed);
        }
    }

    tick();
})();

