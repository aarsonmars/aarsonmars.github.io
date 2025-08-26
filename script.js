const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-links li');

burger.addEventListener('click', () => {
    nav.classList.toggle('nav-active');
    burger.classList.toggle('toggle');
});

nav.addEventListener('click', () => {
    nav.classList.remove('nav-active');
    burger.classList.remove('toggle');
});

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const backToTopButton = document.querySelector('.back-to-top');

    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    if (window.scrollY > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

// AOS Initialization
AOS.init({
    duration: 800,
    once: true,
    offset: 50,
});

