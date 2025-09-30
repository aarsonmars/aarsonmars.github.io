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

