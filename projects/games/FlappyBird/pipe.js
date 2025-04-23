class Pipe {
    constructor(canvas, x, gapSize, gapHeight, usePlaceholder = true) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.width = 70;
        this.gapSize = gapSize;
        this.gapHeight = gapHeight;
        this.speed = 3;
        this.passed = false;
        
        // Flag to track image source preference
        this.usePlaceholderImages = usePlaceholder;
        
        // Load pipe images
        this.topPipeImg = new Image();
        this.bottomPipeImg = new Image();
        
        // Use placeholder by default if available
        if (this.usePlaceholderImages && window.placeholderImages) {
            if (window.placeholderImages.pipeTop) {
                this.topPipeImg.src = window.placeholderImages.pipeTop;
            }
            if (window.placeholderImages.pipeBottom) {
                this.bottomPipeImg.src = window.placeholderImages.pipeBottom;
            }
        } else {
            this.topPipeImg.src = './img/pipe-top.png';
            this.bottomPipeImg.src = './img/pipe-bottom.png';
        }
        
        this.topImageLoaded = false;
        this.bottomImageLoaded = false;
        
        this.topPipeImg.onload = () => {
            this.topImageLoaded = true;
        };
        
        this.bottomPipeImg.onload = () => {
            this.bottomImageLoaded = true;
        };
        
        this.topPipeImg.onerror = () => {
            console.log('Failed to load top pipe image, using placeholder');
            this.useTopPlaceholder();
        };
        
        this.bottomPipeImg.onerror = () => {
            console.log('Failed to load bottom pipe image, using placeholder');
            this.useBottomPlaceholder();
        };
    }
    
    useTopPlaceholder() {
        if (window.placeholderImages && window.placeholderImages.pipeTop) {
            this.topPipeImg = new Image();
            this.topPipeImg.src = window.placeholderImages.pipeTop;
            this.topImageLoaded = true;
            this.usePlaceholderImages = true;
        }
    }
    
    useBottomPlaceholder() {
        if (window.placeholderImages && window.placeholderImages.pipeBottom) {
            this.bottomPipeImg = new Image();
            this.bottomPipeImg.src = window.placeholderImages.pipeBottom;
            this.bottomImageLoaded = true;
            this.usePlaceholderImages = true;
        }
    }
    
    useRealImages() {
        // Switch to real images
        this.topPipeImg = new Image();
        this.bottomPipeImg = new Image();
        this.topPipeImg.src = './img/pipe-top.png';
        this.bottomPipeImg.src = './img/pipe-bottom.png';
        this.usePlaceholderImages = false;
        
        // Handle load events
        this.topPipeImg.onload = () => {
            this.topImageLoaded = true;
        };
        
        this.bottomPipeImg.onload = () => {
            this.bottomImageLoaded = true;
        };
        
        this.topPipeImg.onerror = () => {
            console.log('Failed to load top pipe image, using placeholder');
            this.useTopPlaceholder();
        };
        
        this.bottomPipeImg.onerror = () => {
            console.log('Failed to load bottom pipe image, using placeholder');
            this.useBottomPlaceholder();
        };
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        const topPipeHeight = this.gapHeight;
        const bottomPipeY = this.gapHeight + this.gapSize;
        const bottomPipeHeight = this.canvas.height - bottomPipeY;
        
        // Top pipe
        this.drawTopPipe(topPipeHeight);
        
        // Bottom pipe
        this.drawBottomPipe(bottomPipeY, bottomPipeHeight);
    }
    
    drawTopPipe(height) {
        try {
            if (this.topImageLoaded && this.topPipeImg.complete && this.topPipeImg.naturalWidth > 0) {
                // Draw image
                this.ctx.drawImage(this.topPipeImg, this.x, 0, this.width, height);
            } else {
                // Draw fallback rectangle
                this.drawFallbackTopPipe(height);
            }
        } catch (e) {
            console.error('Error drawing top pipe:', e);
            this.drawFallbackTopPipe(height);
        }
    }
    
    drawBottomPipe(y, height) {
        try {
            if (this.bottomImageLoaded && this.bottomPipeImg.complete && this.bottomPipeImg.naturalWidth > 0) {
                // Draw image
                this.ctx.drawImage(this.bottomPipeImg, this.x, y, this.width, height);
            } else {
                // Draw fallback rectangle
                this.drawFallbackBottomPipe(y, height);
            }
        } catch (e) {
            console.error('Error drawing bottom pipe:', e);
            this.drawFallbackBottomPipe(y, height);
        }
    }
    
    drawFallbackTopPipe(height) {
        // Main pipe
        this.ctx.fillStyle = '#2E9E2E';
        this.ctx.fillRect(this.x, 0, this.width, height);
        
        // Cap
        this.ctx.fillStyle = '#33CC33';
        this.ctx.fillRect(this.x - 5, height - 20, this.width + 10, 20);
        
        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(this.x + 5, 0, 10, height - 20);
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(this.x + this.width - 15, 0, 10, height - 20);
    }
    
    drawFallbackBottomPipe(y, height) {
        // Main pipe
        this.ctx.fillStyle = '#2E9E2E';
        this.ctx.fillRect(this.x, y, this.width, height);
        
        // Cap
        this.ctx.fillStyle = '#33CC33';
        this.ctx.fillRect(this.x - 5, y, this.width + 10, 20);
        
        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(this.x + 5, y + 20, 10, height - 20);
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(this.x + this.width - 15, y + 20, 10, height - 20);
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    checkCollision(birdBounds) {
        const topPipeRect = {
            left: this.x,
            top: 0,
            right: this.x + this.width,
            bottom: this.gapHeight
        };
        
        const bottomPipeRect = {
            left: this.x,
            top: this.gapHeight + this.gapSize,
            right: this.x + this.width,
            bottom: this.canvas.height
        };
        
        // Check collision with top pipe
        if (birdBounds.right > topPipeRect.left &&
            birdBounds.left < topPipeRect.right &&
            birdBounds.top < topPipeRect.bottom) {
            return true;
        }
        
        // Check collision with bottom pipe
        if (birdBounds.right > bottomPipeRect.left &&
            birdBounds.left < bottomPipeRect.right &&
            birdBounds.bottom > bottomPipeRect.top) {
            return true;
        }
        
        return false;
    }

    checkPassed(birdX) {
        if (!this.passed && birdX > this.x + this.width) {
            this.passed = true;
            return true;
        }
        return false;
    }

    reloadImages() {
        if (this.usePlaceholderImages) {
            this.useTopPlaceholder();
            this.useBottomPlaceholder();
        } else {
            this.useRealImages();
        }
    }
}
