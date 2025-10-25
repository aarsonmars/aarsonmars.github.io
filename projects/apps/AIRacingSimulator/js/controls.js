class Controls {
    constructor() {
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        
        this.setupKeyboardListeners();
    }
    
    setupKeyboardListeners() {
        const shouldHandle = (event) => {
            if (!(event.target instanceof HTMLElement)) {
                return true;
            }
            const tag = event.target.tagName;
            return tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !event.target.isContentEditable;
        };

        document.addEventListener('keydown', (e) => {
            if (!shouldHandle(e)) {
                return;
            }
            let handled = false;
            switch(e.key) {
                case 'ArrowUp':
                    handled = true;
                    this.forward = true;
                    break;
                case 'ArrowDown':
                    handled = true;
                    this.backward = true;
                    break;
                case 'ArrowLeft':
                    handled = true;
                    this.left = true;
                    break;
                case 'ArrowRight':
                    handled = true;
                    this.right = true;
                    break;
                case 'w':
                case 'W':
                    this.forward = true;
                    break;
                case 's':
                case 'S':
                    this.backward = true;
                    break;
                case 'a':
                case 'A':
                    this.left = true;
                    break;
                case 'd':
                case 'D':
                    this.right = true;
                    break;
            }
            if (handled) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (!shouldHandle(e)) {
                return;
            }
            switch(e.key) {
                case 'ArrowUp':
                    this.forward = false;
                    break;
                case 'ArrowDown':
                    this.backward = false;
                    break;
                case 'ArrowLeft':
                    this.left = false;
                    break;
                case 'ArrowRight':
                    this.right = false;
                    break;
                case 'w':
                case 'W':
                    this.forward = false;
                    break;
                case 's':
                case 'S':
                    this.backward = false;
                    break;
                case 'a':
                case 'A':
                    this.left = false;
                    break;
                case 'd':
                case 'D':
                    this.right = false;
                    break;
            }
        });
    }
    
    reset() {
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
    }
}
