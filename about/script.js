document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation toggle
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li a');
    
    burger.addEventListener('click', () => {
        // Toggle Nav
        nav.classList.toggle('nav-active');
        
        // Animate Links
        document.querySelectorAll('.nav-links li').forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
        
        // Burger Animation
        burger.classList.toggle('toggle');
    });
    
    // Close menu when clicking a link
    document.querySelectorAll('.nav-links li').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
        });
    });
    
    // Function to set active nav link
    const setActiveNavLink = () => {
        // First, remove active class from all links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Get current URL path and hash
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        
        // Set active based on URL path and hash
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            
            // For homepage
            if (linkHref === '#' && currentPath.endsWith('index.html') && !currentHash) {
                link.classList.add('active');
            }
            // For projects section
            else if (linkHref === '#projects' && currentHash === '#projects') {
                link.classList.add('active');
            }
            // For contact page
            else if (linkHref.includes('contact.html') && currentPath.includes('contact.html')) {
                link.classList.add('active');
            }
            // For exact path matches
            else if (linkHref !== '#' && linkHref !== '#projects' && currentPath.endsWith(linkHref)) {
                link.classList.add('active');
            }
        });
    };
    
    // Set active link when DOM loaded
    setActiveNavLink();
    
    // Update active link when hash changes
    window.addEventListener('hashchange', setActiveNavLink);
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Add scroll animations
    const sections = document.querySelectorAll('.about-section, .research-section, .skills-section, .education-section, .projects-section');
    
    const fadeInOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const fadeInOnScroll = new IntersectionObserver(function(entries, fadeInOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('fadeIn');
                fadeInOnScroll.unobserve(entry.target);
            }
        });
    }, fadeInOptions);
    
    sections.forEach(section => {
        fadeInOnScroll.observe(section);
    });
});

// Add animation class to timeline items when they come into view
window.addEventListener('load', () => {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                timelineObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });
});
