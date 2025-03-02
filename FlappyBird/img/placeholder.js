/**
 * Placeholder Image Generator
 * Creates placeholder images for the Flappy Bird game when real images are not available
 */

// Variable to track if placeholders have already been generated
let placeholdersGenerated = false;

// Function to generate and apply placeholder images
function generateAndApplyPlaceholders() {
    // Avoid generating multiple times
    if (placeholdersGenerated && window.placeholderImages) {
        console.log('Placeholders already generated, skipping');
        return;
    }
    
    console.log('Generating placeholder images...');
    
    try {
        // Store the generated images in the window object
        window.placeholderImages = {};
        
        // Generate a scrollable background image (wider than the viewport)
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = 2400; // Make it wider for scrolling
        bgCanvas.height = 500;
        const bgCtx = bgCanvas.getContext('2d');
        
        // Draw sky gradient
        const gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
        gradient.addColorStop(0, '#64B4FF'); // Light blue
        gradient.addColorStop(1, '#C8F0FF'); // Very light blue
        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        // Draw some clouds with variation across the wide background
        bgCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = 20 + Math.random() * (bgCanvas.height/2 - 20);
            const radius = 15 + Math.random() * 25;
            bgCtx.beginPath();
            bgCtx.arc(x, y, radius, 0, Math.PI * 2);
            bgCtx.fill();
            
            // Add some detail to clouds
            bgCtx.beginPath();
            bgCtx.arc(x + radius * 0.6, y, radius * 0.7, 0, Math.PI * 2);
            bgCtx.fill();
            
            bgCtx.beginPath();
            bgCtx.arc(x - radius * 0.6, y, radius * 0.7, 0, Math.PI * 2);
            bgCtx.fill();
        }
        
        // Add some mountains in the background for depth
        for (let i = 0; i < 8; i++) {
            const x = i * 300;
            const height = 100 + Math.random() * 150;
            
            // Draw mountain
            bgCtx.fillStyle = `rgba(100, 100, 120, ${0.5 + Math.random() * 0.5})`;
            bgCtx.beginPath();
            bgCtx.moveTo(x, bgCanvas.height - height);
            bgCtx.lineTo(x + 150, bgCanvas.height);
            bgCtx.lineTo(x - 150, bgCanvas.height);
            bgCtx.closePath();
            bgCtx.fill();
            
            // Add snow cap
            bgCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            bgCtx.beginPath();
            bgCtx.moveTo(x, bgCanvas.height - height);
            bgCtx.lineTo(x + 30, bgCanvas.height - height + 40);
            bgCtx.lineTo(x - 30, bgCanvas.height - height + 40);
            bgCtx.closePath();
            bgCtx.fill();
        }
        
        // Store the background image
        window.placeholderImages.background = bgCanvas.toDataURL('image/png');
        
        // Generate ground image
        const groundCanvas = document.createElement('canvas');
        groundCanvas.width = 48;
        groundCanvas.height = 50;
        const groundCtx = groundCanvas.getContext('2d');
        
        // Draw dirt
        groundCtx.fillStyle = '#7A5230'; // Brown
        groundCtx.fillRect(0, 0, groundCanvas.width, groundCanvas.height);
        
        // Draw grass on top
        groundCtx.fillStyle = '#4CAF50'; // Green
        groundCtx.fillRect(0, 0, groundCanvas.width, 12);
        
        // Add texture to grass
        groundCtx.fillStyle = '#8BC34A'; // Light green
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * groundCanvas.width;
            const height = 3 + Math.random() * 5;
            const width = 1 + Math.random() * 3;
            groundCtx.fillRect(x, 0, width, height);
        }
        
        // Add texture to dirt
        groundCtx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Dark shadow
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * groundCanvas.width;
            const y = 12 + Math.random() * (groundCanvas.height - 12);
            const size = 1 + Math.random() * 2;
            groundCtx.fillRect(x, y, size, size);
        }
        
        // Store ground image
        window.placeholderImages.ground = groundCanvas.toDataURL('image/png');
        
        // Generate a pipe top image
        const pipeTopCanvas = document.createElement('canvas');
        pipeTopCanvas.width = 70;
        pipeTopCanvas.height = 400;
        const pipeTopCtx = pipeTopCanvas.getContext('2d');
        
        // Draw pipe body
        pipeTopCtx.fillStyle = '#2E9E2E'; // Green
        pipeTopCtx.fillRect(0, 0, pipeTopCanvas.width, pipeTopCanvas.height);
        
        // Draw pipe cap
        pipeTopCtx.fillStyle = '#33CC33'; // Lighter green
        pipeTopCtx.fillRect(-5, pipeTopCanvas.height - 20, pipeTopCanvas.width + 10, 20);
        
        // Add highlights
        pipeTopCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        pipeTopCtx.fillRect(5, 0, 10, pipeTopCanvas.height - 20);
        
        // Add shadows
        pipeTopCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        pipeTopCtx.fillRect(pipeTopCanvas.width - 15, 0, 10, pipeTopCanvas.height - 20);
        
        // Store pipe top image
        window.placeholderImages.pipeTop = pipeTopCanvas.toDataURL('image/png');
        
        // Generate a pipe bottom image
        const pipeBottomCanvas = document.createElement('canvas');
        pipeBottomCanvas.width = 70;
        pipeBottomCanvas.height = 400;
        const pipeBottomCtx = pipeBottomCanvas.getContext('2d');
        
        // Draw pipe body
        pipeBottomCtx.fillStyle = '#2E9E2E'; // Green
        pipeBottomCtx.fillRect(0, 0, pipeBottomCanvas.width, pipeBottomCanvas.height);
        
        // Draw pipe cap
        pipeBottomCtx.fillStyle = '#33CC33'; // Lighter green
        pipeBottomCtx.fillRect(-5, 0, pipeBottomCanvas.width + 10, 20);
        
        // Add highlights
        pipeBottomCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        pipeBottomCtx.fillRect(5, 20, 10, pipeBottomCanvas.height - 20);
        
        // Add shadows
        pipeBottomCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        pipeBottomCtx.fillRect(pipeBottomCanvas.width - 15, 20, 10, pipeBottomCanvas.height - 20);
        
        // Store pipe bottom image
        window.placeholderImages.pipeBottom = pipeBottomCanvas.toDataURL('image/png');
        
        // Generate bird sprite sheet
        const birdCanvas = document.createElement('canvas');
        birdCanvas.width = 60;
        birdCanvas.height = 135; // 45px per frame, 3 frames
        const birdCtx = birdCanvas.getContext('2d');
        
        // Draw 3 frames of animation
        for (let frame = 0; frame < 3; frame++) {
            const centerY = frame * 45 + 22.5;
            
            // Bird body
            birdCtx.fillStyle = '#FFEB3B'; // Yellow
            birdCtx.beginPath();
            birdCtx.ellipse(25, centerY, 20, 15, 0, 0, Math.PI * 2);
            birdCtx.fill();
            
            // Wing position based on frame
            birdCtx.fillStyle = '#FFC107'; // Darker yellow
            birdCtx.beginPath();
            if (frame === 0) {
                // Wing up
                birdCtx.ellipse(20, centerY - 8, 12, 6, Math.PI / 4, 0, Math.PI * 2);
            } else if (frame === 1) {
                // Wing middle
                birdCtx.ellipse(20, centerY, 12, 6, 0, 0, Math.PI * 2);
            } else {
                // Wing down
                birdCtx.ellipse(20, centerY + 8, 12, 6, -Math.PI / 4, 0, Math.PI * 2);
            }
            birdCtx.fill();
            
            // Eye
            birdCtx.fillStyle = 'white';
            birdCtx.beginPath();
            birdCtx.arc(35, centerY - 5, 5, 0, Math.PI * 2);
            birdCtx.fill();
            
            birdCtx.fillStyle = 'black';
            birdCtx.beginPath();
            birdCtx.arc(37, centerY - 5, 2, 0, Math.PI * 2);
            birdCtx.fill();
            
            // Beak
            birdCtx.fillStyle = '#FF5722'; // Orange
            birdCtx.beginPath();
            birdCtx.moveTo(40, centerY - 3);
            birdCtx.lineTo(50, centerY);
            birdCtx.lineTo(40, centerY + 3);
            birdCtx.closePath();
            birdCtx.fill();
        }
        
        // Store bird image
        window.placeholderImages.bird = birdCanvas.toDataURL('image/png');
        
        // Mark as generated to avoid duplicate generations
        placeholdersGenerated = true;
        
        console.log('Placeholder images generated successfully');
        
        // For debugging purposes, save the images as actual elements
        savePlaceholdersToDOM();
        
        // Apply images to global elements right away
        if (window.game && window.game.reloadImages) {
            window.game.reloadImages();
        }
    } catch (e) {
        console.error('Error generating placeholders:', e);
    }
}

// Save placeholder images as DOM elements for debugging
function savePlaceholdersToDOM() {
    if (!window.placeholderImages) return;
    
    // Create a container for the images
    const container = document.createElement('div');
    container.id = 'placeholder-images';
    container.style.display = 'none';
    
    // Add each image
    Object.entries(window.placeholderImages).forEach(([name, src]) => {
        const img = new Image();
        img.id = `placeholder-${name}`;
        img.src = src;
        img.setAttribute('alt', name);
        container.appendChild(img);
    });
    
    // Add to document body
    document.body.appendChild(container);
}

// Function to check if images exist
function checkAndGeneratePlaceholders() {
    // If placeholders are already generated, don't check again
    if (placeholdersGenerated && window.placeholderImages) {
        return;
    }
    
    // Force placeholder generation
    generateAndApplyPlaceholders();
    
    // Don't even try to load the real image - we'll use placeholders by default
    /* 
    // Create test image
    const testImg = new Image();
    testImg.onerror = () => {
        // If image doesn't exist, generate placeholders
        generateAndApplyPlaceholders();
    };
    
    testImg.onload = () => {
        console.log('Real game images loaded successfully');
    };
    
    // Try to load background image
    testImg.src = './img/background.png';
    */
}

// Immediately generate placeholders on script load
generateAndApplyPlaceholders();

// Also run after DOM is loaded, but only if needed
document.addEventListener('DOMContentLoaded', () => {
    // Only generate again if not already done
    if (!placeholdersGenerated || !window.placeholderImages) {
        setTimeout(generateAndApplyPlaceholders, 100);
    }
});

// Make the generator available globally
window.generatePlaceholderImages = generateAndApplyPlaceholders;
