// Overpass Explorer - Main Entry Point
import { initializeMap } from './map.js';
import { setupEventListeners } from './ui.js';

// Global variables (will be moved to appropriate modules later)
window.currentData = null;
window.selectedArea = null;

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // First, add the Leaflet.draw plugin CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
    document.head.appendChild(linkElement);

    // Load the Leaflet.draw plugin JS
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
    
    // Initialize the map and setup event listeners only after the draw plugin has loaded
    scriptElement.onload = function() {
        initializeMap();
        setupEventListeners();
    };
    document.body.appendChild(scriptElement);
});

// Ensure the map container exists and is styled
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container (#map) is missing.');
        return;
    }
    mapContainer.style.height = '500px'; // Ensure the map has a height
});