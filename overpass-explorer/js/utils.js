// Utility functions for the application

// Escape special characters for XML
export function escapeXML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Escape special characters for CSV
export function escapeCSV(str) {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// Debounce function to limit how often a function can be called
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Generate a unique ID
export function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Format a number with commas for thousands
export function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// Parse coordinates from a string "lat,lon,lat,lon"
export function parseCoordinates(coordsString) {
    const coords = coordsString.split(',').map(c => parseFloat(c.trim()));
    if (coords.length === 4 && coords.every(c => !isNaN(c))) {
        return {
            south: coords[0],
            west: coords[1],
            north: coords[2],
            east: coords[3]
        };
    }
    return null;
}