document.addEventListener('DOMContentLoaded', (event) => {
    var shuffleLimit = 50;

    const puzzles = {
        fruits: ['WATERMELON', 'APPLE', 'CHERRY', 'ORANGE', 'PEAR', 'STRAWBERRY', 'GRAPE', 'PLUM', 'MANGO', 'LUX'],
        canadian_cities: ['TORONTO', 'MONTREAL', 'VANCOUVER', 'CALGARY', 'HALIFAX', 'OTTAWA', 'WINNIPEG', 'EDMONTON', 'QUEBEC', 'VICTORIA'],
        countries: ['USA', 'CANADA', 'BRAZIL', 'INDIA', 'CHINA', 'JAPAN', 'GERMANY', 'FRANCE', 'ITALY', 'SPAIN']
    };

    const puzzleTypeSelect = document.getElementById('puzzleType');
    
    function generatePuzzle(wordList) {
        totalWords = wordList.length;
        totalLetters = wordList.join('').length;

        function shuffle(array) {
            let currentIndex = array.length, randomIndex;

            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }

            return array;
        }

        class Letter {
            constructor(letter, x = 0, y = 0, direction = 'x+', connection = 0, word) {
                this.letter = letter;
                this.x = x;
                this.y = y;
                this.direction = direction;
                this.connection = connection;
                this.word = word;
                this.isHint = false; // Add hint property
            }
        }

        var words = shuffle(wordList.slice());
        for (shuffleCount = 0; shuffleCount < shuffleLimit; shuffleCount++) {
            console.log(shuffleCount);
            var letterlist = [];
            for (i = 0; i < words[0].length; i++) {
                letterlist.push(new Letter(words[0][i], 0, i, 'y+', 0, words[0]));
            }
            var brk = false; bk = false;
            for (i = 1; i < words.length; i++) {
                for (j = 0; j < words[i].length; j++) {
                    for (k = letterlist.length - 1; k >= 0; k--) {
                        var lk = letterlist[k];
                        if (words[i][j] == lk.letter && lk.connection == 0) {
                            if (k != letterlist.length - 1 && letterlist[k + 1].connection == 1 && letterlist[k + 1].direction == lk.direction) { continue }
                            if (k != 0 && letterlist[k - 1].connection == 1 && letterlist[k - 1].direction == lk.direction) { continue }
                            var ll = [];

                            for (m = 0; m < words[i].length; m++) {
                                var c = 0;
                                if (m == j) { var c = lk.connection + 1; lk.connection += 1 }

                                if (lk.direction == 'y+') {
                                    letterlist.forEach(function (l) { if (m - j + lk.x == l.x && lk.y == l.y && c == 0) { ll = []; bk = true; } })
                                    ll.push(new Letter(words[i][m], m - j + lk.x, lk.y, 'x+', c, words[i]));
                                }
                                else {
                                    letterlist.forEach(function (l) { if (m - j + lk.y == l.y && lk.x == l.x && c == 0) { ll = []; bk = true; } })
                                    ll.push(new Letter(words[i][m], lk.x, m - j + lk.y, 'y+', c, words[i]));
                                } if (bk) { bk = false; ll = []; break; }
                            } letterlist.push(...ll); brk = ll.length; break;
                        }
                    } if (brk) { brk = false; break; }
                } if (brk === 0) { words.push(words[i]) }
                if (i == 10) { break; }
            }
            if (letterlist.length == totalLetters) { break }
            else { words = shuffle(wordList.slice()) }
        }

        // Add hint letters - add first letter of each word as hint
        const wordFirstLetters = new Set();
        words.forEach(word => {
            wordFirstLetters.add(word[0]);
        });
        
        // Mark some letters as hints (first letter of each word and some random letters)
        letterlist.forEach(letter => {
            // If it's the first letter of a word, mark as hint
            if (wordFirstLetters.has(letter.letter) && letter.word.indexOf(letter.letter) === 0) {
                letter.isHint = true;
            }
        });

        alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        class InputField {
            constructor(parent, letter, x = 0, y = 0) {
                this.parent = parent;
                this.letter = letter;
                this.x = x;
                this.y = y;
                this.drawField();
            }
            drawField() {
                var inputField = document.createElement('input');
                inputField.style.position = 'absolute';
                inputField.classList.add('puzzle-input'); // Add class for styling

                inputField.style.left = 40 - maxLx * 40 + this.x * 40 + 'px'; // Increased positioning for more gap
                inputField.style.top = 40 - maxLy * 40 + this.y * 40 + 'px'; // Increased positioning for more gap
                inputField.maxLength = '1';
                
                // If this is a hint letter, pre-fill it and add special styling
                if (this.letter.isHint) {
                    inputField.value = this.letter.letter;
                    inputField.readOnly = true;
                    inputField.classList.add('hint-letter');
                }
                
                this.parent.appendChild(inputField);
                
                // Function to check letter correctness
                const checkLetter = (value) => {
                    if (this.letter.letter == value.toUpperCase()) {
                        this.inputField.style.color = 'green';
                    } else {
                        navigator.vibrate(50);
                        this.inputField.style.color = 'red';
                    }
                };
                
                // Input event handler
                inputField.addEventListener('input', (e) => {
                    console.log(11);
                    checkLetter(e.target.value);
                });
                
                // Wheel event handler
                inputField.onwheel = (event) => {
                    if (this.letter.isHint) return; // Prevent changing hint letters
                    
                    event.preventDefault();
                    var x = event.target.value || 'A'; // Default to 'A' if empty
                    var index = alphabet.indexOf(x.toUpperCase());
                    
                    if (index === -1) index = 0; // If not found, start from A
                    
                    if (event.deltaY < 0) {
                        inputField.value = alphabet[Math.max(index - 1, 0)];
                    }
                    else if (event.deltaY > 0) {
                        inputField.value = alphabet[Math.min(25, index + 1)];
                    }
                    
                    // Check correctness after changing the value
                    checkLetter(inputField.value);
                }
                this.inputField = inputField;
            }
        }

        var lx = [];
        var ly = [];
        letterlist.forEach(function (l) { lx.push(l.x) });
        letterlist.forEach(function (l) { ly.push(l.y) });
        maxLx = Math.min(...lx); maxLy = Math.min(...ly);
        var main = document.getElementById('mainContainer');
        main.innerHTML = ''; // Clear previous puzzle
        
        // Calculate puzzle size to set container dimensions
        var maxX = Math.max(...lx);
        var maxY = Math.max(...ly);
        var puzzleWidth = (maxX - maxLx + 1) * 40 + 80; // Add padding
        var puzzleHeight = (maxY - maxLy + 1) * 40 + 80; // Add padding
        
        // Set minimum dimensions
        main.style.width = Math.max(300, puzzleWidth) + 'px';
        main.style.height = Math.max(300, puzzleHeight) + 'px';
        
        // Center the puzzle in the container
        main.style.position = 'absolute';
        main.style.left = '50%';
        main.style.top = '0';
        main.style.transform = 'translateX(-50%)';
        
        // Ensure the puzzle container is scrollable by setting its own dimensions
        const puzzleContainer = document.querySelector('.puzzle-container');
        puzzleContainer.style.overflowX = puzzleWidth > window.innerWidth ? 'auto' : 'hidden';
        puzzleContainer.style.overflowY = 'auto';
        
        var InputFieldList = [];
        for (i = 0; i < letterlist.length; i++) {
            l = letterlist[i];
            InputFieldList.push(new InputField(main, l, l.x, l.y));
        }
        
        // Prevent default body scrolling on wheel events inside puzzle container
        puzzleContainer.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            // Manual scroll handling
            if (e.deltaY !== 0) {
                puzzleContainer.scrollTop += e.deltaY;
            }
            if (e.deltaX !== 0) {
                puzzleContainer.scrollLeft += e.deltaX;
            }
        }, { passive: false });
    }

    puzzleTypeSelect.addEventListener('change', (event) => {
        const selectedPuzzle = event.target.value;
        const wordList = puzzles[selectedPuzzle];
        generatePuzzle(wordList);
    });

    // Update the puzzleTypeSelect default value if needed
    if (puzzleTypeSelect.value !== 'canadian_cities') {
        puzzleTypeSelect.value = 'canadian_cities';
    }

    // Initialize with the default puzzle type
    const initialPuzzleType = puzzleTypeSelect.value;
    const initialWordList = puzzles[initialPuzzleType];
    generatePuzzle(initialWordList);
});

// Make sure the layout adjusts correctly when window is resized
window.addEventListener('resize', function() {
    // Adjust game window height based on available space
    const gameWindow = document.getElementById('gameWindow');
    gameWindow.style.height = `calc(100vh - ${document.querySelector('header').offsetHeight + document.querySelector('footer').offsetHeight + 40}px)`;
});

// Initialize layout after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set initial height for game window
    const gameWindow = document.getElementById('gameWindow');
    gameWindow.style.height = `calc(100vh - ${document.querySelector('header').offsetHeight + document.querySelector('footer').offsetHeight + 40}px)`;
});

// More aggressive event handling for scrolling issues
document.addEventListener('DOMContentLoaded', function() {
    // Run once DOM is loaded, but before images, etc.
    setupScrollHandling();
    
    // Function to set the game window height correctly
    function setGameWindowHeight() {
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        const gameWindow = document.getElementById('gameWindow');
        
        if (header && footer && gameWindow) {
            const headerHeight = header.offsetHeight;
            const footerHeight = footer.offsetHeight;
            const windowHeight = window.innerHeight;
            
            // Calculate available height
            const availableHeight = windowHeight - headerHeight - footerHeight;
            gameWindow.style.height = `${availableHeight}px`;
        }
    }
    
    // Setup scroll event handling
    function setupScrollHandling() {
        // Prevent scrolling on the document
        document.body.addEventListener('wheel', function(e) {
            // Only if it's not inside the puzzle container
            if (!e.target.closest('.puzzle-container')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchmove', function(e) {
            if (!e.target.closest('.puzzle-container')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Make the puzzle container scrollable
        const puzzleContainer = document.querySelector('.puzzle-container');
        if (puzzleContainer) {
            puzzleContainer.addEventListener('wheel', function(e) {
                // Allow scrolling inside the puzzle container
                e.stopPropagation();
            });
            
            // Handle touch scrolling in the puzzle container
            let startY;
            puzzleContainer.addEventListener('touchstart', function(e) {
                startY = e.touches[0].clientY;
            });
            
            puzzleContainer.addEventListener('touchmove', function(e) {
                if (!startY) return;
                
                const touchY = e.touches[0].clientY;
                const diff = startY - touchY;
                
                // Scroll the container
                puzzleContainer.scrollTop += diff;
                startY = touchY;
                e.stopPropagation();
            });
        }
    }
    
    // Set initial height
    setGameWindowHeight();
    
    // Adjust when window is resized
    window.addEventListener('resize', setGameWindowHeight);
    
    // Fix for iOS Safari and some mobile browsers
    window.addEventListener('orientationchange', setGameWindowHeight);
});

// Fix for mobile select dropdown
document.addEventListener('DOMContentLoaded', function() {
    // Fix iOS and Android select issues
    const puzzleTypeSelect = document.getElementById('puzzleType');
    
    // Prevent default behavior for select on mobile
    puzzleTypeSelect.addEventListener('touchstart', function(e) {
        e.stopPropagation();
    });
    
    // Disable body scrolling when dropdown is open on mobile
    puzzleTypeSelect.addEventListener('focus', function() {
        document.body.style.overflow = 'hidden';
    });
    
    puzzleTypeSelect.addEventListener('blur', function() {
        document.body.style.overflow = '';
    });
    
    // Fix for dropdown menu in mobile
    const originalHeight = window.innerHeight;
    window.addEventListener('resize', function() {
        // When virtual keyboard opens, viewport height changes
        // This keeps the dropdown in place
        if (window.innerHeight < originalHeight) {
            document.querySelector('.game-controls').style.position = 'relative';
        } else {
            document.querySelector('.game-controls').style.position = '';
        }
    });
    
    // Prevent iOS Safari zoom on focus
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        if (!viewportMeta.content.includes('maximum-scale')) {
            viewportMeta.content = viewportMeta.content + ', maximum-scale=1.0';
        }
    }
});