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

// Scroll effects (shrink navbar + back-to-top visibility)
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const backToTopButton = document.querySelector('.back-to-top');
    const scrollY = window.scrollY;

    navbar.classList.toggle('scrolled', scrollY > 50);
    backToTopButton.classList.toggle('visible', scrollY > 300);
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

