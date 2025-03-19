document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let currentRow = 0;
    let currentTile = 0;
    let gameOver = false;
    let currentWord = '';
    let wordList = [];
    
    // Game statistics
    let stats = loadStats();

    // DOM elements
    const boardElement = document.getElementById('board');
    const keyboardButtons = document.querySelectorAll('[data-key]');
    const instructionsModal = document.getElementById('instructions-modal');
    const statsModal = document.getElementById('stats-modal');
    const gameCompleteModal = document.getElementById('game-complete-modal');
    const instructionsButton = document.getElementById('instructions-button');
    const statsButton = document.getElementById('stats-button');
    const modalCloseButtons = document.querySelectorAll('.close');
    const resetStatsButton = document.getElementById('reset-stats');
    const newGameButton = document.getElementById('new-game');
    const playAgainButton = document.getElementById('play-again');
    const shareResultButton = document.getElementById('share-result');
    
    // Create the game board
    initializeBoard();
    
    // Load words from file
    loadWordList()
        .then(() => {
            // Start a new game
            startNewGame();
            
            // Show instructions on first visit
            if (!localStorage.getItem('wordleInstructionsShown')) {
                showInstructionsModal();
                localStorage.setItem('wordleInstructionsShown', 'true');
            }
        })
        .catch(error => {
            console.error('Error loading word list:', error);
        });
    
    // Event listeners
    keyboardButtons.forEach(button => {
        button.addEventListener('click', handleKeyPress);
    });
    
    document.addEventListener('keydown', handleKeyDown);
    
    instructionsButton.addEventListener('click', showInstructionsModal);
    statsButton.addEventListener('click', showStatsModal);
    
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    resetStatsButton.addEventListener('click', resetStats);
    newGameButton.addEventListener('click', () => {
        closeAllModals();
        startNewGame();
    });
    
    playAgainButton.addEventListener('click', () => {
        closeAllModals();
        startNewGame();
    });
    
    shareResultButton.addEventListener('click', shareResults);
    
    // Close modals when clicking outside
    window.addEventListener('click', event => {
        if (event.target === instructionsModal || 
            event.target === statsModal || 
            event.target === gameCompleteModal) {
            closeAllModals();
        }
    });
    
    // Functions
    
    function initializeBoard() {
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.classList.add('row');
            
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                row.appendChild(tile);
            }
            
            boardElement.appendChild(row);
        }
    }
    
    async function loadWordList() {
        try {
            const response = await fetch('words.txt');
            const text = await response.text();
            wordList = text.split('\n')
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length === 5);
            
            if (wordList.length === 0) {
                throw new Error('No valid words found in the word list');
            }
        } catch (error) {
            console.error('Error loading word list:', error);
            // Fallback to hardcoded word list in case of error
            wordList = ['which', 'there', 'their', 'about', 'would', 'these', 'other', 'words', 'could'];
        }
    }
    
    function startNewGame() {
        currentRow = 0;
        currentTile = 0;
        gameOver = false;
        
        // Reset enter button state
        resetEnterButtonState();
        
        // Reset board
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.textContent = '';
            tile.classList.remove('correct', 'present', 'absent', 'pop', 'flip', 'flip-back');
        });
        
        // Reset keyboard
        keyboardButtons.forEach(button => {
            button.classList.remove('correct', 'present', 'absent');
        });
        
        // Select a random word
        currentWord = selectRandomWord();
        console.log('Secret word:', currentWord); // For debugging purposes
        
        // Reset the play again button text if it was changed
        const playAgainButton = document.getElementById('play-again');
        if (playAgainButton) {
            playAgainButton.textContent = 'Play Again';
        }
    }
    
    function selectRandomWord() {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        return wordList[randomIndex].toLowerCase();
    }
    
    function handleKeyDown(event) {
        if (gameOver) return;
        
        const key = event.key.toLowerCase();
        
        if (key === 'enter') {
            submitGuess();
        } else if (key === 'backspace') {
            deleteLetter();
        } else if (/^[a-z]$/.test(key)) {
            addLetter(key);
        }
    }
    
    function handleKeyPress(event) {
        if (gameOver) return;
        
        const key = event.currentTarget.getAttribute('data-key');
        
        if (key === 'enter') {
            submitGuess();
        } else if (key === 'backspace') {
            deleteLetter();
        } else {
            addLetter(key);
        }
    }
    
    function addLetter(letter) {
        if (currentTile < 5 && currentRow < 6) {
            const row = boardElement.children[currentRow];
            const tile = row.children[currentTile];
            tile.textContent = letter.toUpperCase();
            tile.classList.add('pop');
            
            setTimeout(() => {
                tile.classList.remove('pop');
            }, 100);
            
            currentTile++;
            
            // Check if we've reached 5 letters to update enter button color
            if (currentTile === 5) {
                const currentGuess = getCurrentGuess();
                updateEnterButtonState(currentGuess);
            }
        }
    }
    
    function deleteLetter() {
        if (currentTile > 0) {
            currentTile--;
            const row = boardElement.children[currentRow];
            const tile = row.children[currentTile];
            tile.textContent = '';
            
            // Reset enter button styling if we're no longer at 5 letters
            if (currentTile < 5) {
                resetEnterButtonState();
            }
        }
    }
    
    function getCurrentGuess() {
        const row = boardElement.children[currentRow];
        return Array.from(row.children)
            .map(tile => tile.textContent.toLowerCase())
            .join('');
    }
    
    function updateEnterButtonState(guess) {
        const enterButton = document.querySelector('[data-key="enter"]');
        
        if (isValidWord(guess)) {
            enterButton.classList.remove('invalid-word');
            enterButton.classList.add('valid-word');
        } else {
            enterButton.classList.remove('valid-word');
            enterButton.classList.add('invalid-word');
        }
    }
    
    function resetEnterButtonState() {
        const enterButton = document.querySelector('[data-key="enter"]');
        enterButton.classList.remove('valid-word', 'invalid-word');
    }
    
    function submitGuess() {
        if (currentTile !== 5) {
            showMessage('Not enough letters');
            shakeRow(currentRow);
            return;
        }
        
        const row = boardElement.children[currentRow];
        const guess = Array.from(row.children)
            .map(tile => tile.textContent.toLowerCase())
            .join('');
        
        if (!isValidWord(guess)) {
            showMessage('Not in word list');
            shakeRow(currentRow);
            return;
        }
        
        // Reset enter button state after submitting
        resetEnterButtonState();
        
        // Check the guess
        checkGuess(guess);
        
        // Move to next row
        currentRow++;
        currentTile = 0;
        
        // Check if game is over
        if (guess === currentWord) {
            gameOver = true;
            setTimeout(() => {
                handleWin();
            }, 1500);
        } else if (currentRow === 6) {
            gameOver = true;
            setTimeout(() => {
                handleLoss();
            }, 1500);
        }
    }
    
    function isValidWord(word) {
        return wordList.includes(word);
    }
    
    function checkGuess(guess) {
        const row = boardElement.children[currentRow];
        const tiles = row.children;
        const wordArray = currentWord.split('');
        
        // First pass: mark correct letters
        for (let i = 0; i < 5; i++) {
            if (guess[i] === currentWord[i]) {
                wordArray[i] = null; // Mark as used
            }
        }
        
        // Second pass: apply animations with delay
        for (let i = 0; i < 5; i++) {
            const tile = tiles[i];
            const letter = guess[i];
            const keyButton = document.querySelector(`[data-key="${letter}"]`);
            
            // Add flip animation
            setTimeout(() => {
                tile.classList.add('flip');
                
                // After flip animation completes, set the color and flip back
                setTimeout(() => {
                    if (letter === currentWord[i]) {
                        tile.classList.add('correct');
                        keyButton.classList.add('correct');
                    } else if (wordArray.includes(letter)) {
                        tile.classList.add('present');
                        if (!keyButton.classList.contains('correct')) {
                            keyButton.classList.add('present');
                        }
                        // Mark as used to prevent duplicates
                        const index = wordArray.indexOf(letter);
                        if (index !== -1) {
                            wordArray[index] = null;
                        }
                    } else {
                        tile.classList.add('absent');
                        if (!keyButton.classList.contains('correct') && 
                            !keyButton.classList.contains('present')) {
                            keyButton.classList.add('absent');
                        }
                    }
                    
                    tile.classList.add('flip-back');
                }, 250);
                
            }, i * 300);
        }
    }
    
    function shakeRow(rowIndex) {
        const row = boardElement.children[rowIndex];
        row.classList.add('shake');
        setTimeout(() => {
            row.classList.remove('shake');
        }, 500);
    }
    
    function showMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.classList.add('message');
        messageElement.style.position = 'fixed';
        messageElement.style.top = '10%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageElement.style.color = 'white';
        messageElement.style.padding = '10px 20px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.zIndex = '1000';
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, 2000);
    }
    
    function handleWin() {
        const guessCount = currentRow;
        updateStats(true, guessCount);
        
        // First show the game complete modal
        const gameResultMessage = document.getElementById('game-result-message');
        if (gameResultMessage) {
            gameResultMessage.textContent = 'Correct word!';
            gameResultMessage.style.color = 'var(--correct-color)';
        }
        
        // We don't need to show "The word was" since they already know
        const correctWordDisplay = document.getElementById('correct-word-display');
        if (correctWordDisplay) {
            correctWordDisplay.textContent = '';
        }
        
        // Change "Play Again" to "Next Word"
        const playAgainButton = document.getElementById('play-again');
        if (playAgainButton) {
            playAgainButton.textContent = 'Next Word';
        }
        
        showGameCompleteModal();
        
        // After a short delay to allow the modal to render, show the confetti
        setTimeout(() => {
            // Show confetti animation around the modal
            const confetti = new Confetti();
            confetti.start();
        }, 200);
    }
    
    function handleLoss() {
        updateStats(false);
        
        const gameResultMessage = document.getElementById('game-result-message');
        gameResultMessage.textContent = 'Better luck next time!';
        
        const correctWordDisplay = document.getElementById('correct-word-display');
        correctWordDisplay.textContent = `The word was: ${currentWord.toUpperCase()}`;
        
        const playAgainButton = document.getElementById('play-again');
        if (playAgainButton) {
            playAgainButton.textContent = 'Play Again';
        }
        
        showGameCompleteModal();
    }
    
    function loadStats() {
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }
        };
        
        const savedStats = localStorage.getItem('wordleStats');
        return savedStats ? JSON.parse(savedStats) : defaultStats;
    }
    
    function updateStats(isWin, guessCount = null) {
        stats.gamesPlayed++;
        
        if (isWin) {
            stats.gamesWon++;
            stats.currentStreak++;
            stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
            
            // Update guess distribution
            stats.guessDistribution[guessCount.toString()]++;
        } else {
            stats.currentStreak = 0;
        }
        
        // Save to localStorage
        localStorage.setItem('wordleStats', JSON.stringify(stats));
        
        // Update stats display
        updateStatsDisplay();
    }
    
    function updateStatsDisplay() {
        document.getElementById('games-played').textContent = stats.gamesPlayed;
        
        const winPercentage = stats.gamesPlayed > 0 
            ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
            : 0;
        document.getElementById('win-percentage').textContent = winPercentage;
        
        document.getElementById('current-streak').textContent = stats.currentStreak;
        document.getElementById('max-streak').textContent = stats.maxStreak;
        
        // Update guess distribution
        const distributionContainer = document.getElementById('guess-distribution');
        distributionContainer.innerHTML = '';
        
        const maxGuesses = Math.max(...Object.values(stats.guessDistribution));
        
        for (let i = 1; i <= 6; i++) {
            const count = stats.guessDistribution[i.toString()];
            const percentage = maxGuesses > 0 ? (count / maxGuesses) * 100 : 0;
            
            const row = document.createElement('div');
            row.classList.add('distribution-row');
            
            const guessNumber = document.createElement('div');
            guessNumber.classList.add('guess-number');
            guessNumber.textContent = i;
            
            const bar = document.createElement('div');
            bar.classList.add('graph-bar');
            bar.style.width = `${Math.max(percentage, 5)}%`;
            bar.textContent = count;
            
            // Highlight the current guess if we just won
            if (i === currentRow && gameOver && currentWord) {
                bar.classList.add('highlight');
            }
            
            row.appendChild(guessNumber);
            row.appendChild(bar);
            distributionContainer.appendChild(row);
        }
    }
    
    function resetStats() {
        stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }
        };
        
        localStorage.setItem('wordleStats', JSON.stringify(stats));
        updateStatsDisplay();
        showMessage('Statistics reset');
    }
    
    function showInstructionsModal() {
        closeAllModals();
        instructionsModal.style.display = 'block';
    }
    
    function showStatsModal() {
        closeAllModals();
        updateStatsDisplay();
        statsModal.style.display = 'block';
    }
    
    function showGameCompleteModal() {
        closeAllModals();
        gameCompleteModal.style.display = 'block';
    }
    
    function closeAllModals() {
        instructionsModal.style.display = 'none';
        statsModal.style.display = 'none';
        gameCompleteModal.style.display = 'none';
    }
    
    function shareResults() {
        if (!gameOver) return;
        
        const rows = boardElement.children;
        const resultGrid = Array.from(rows).slice(0, currentRow).map(row => {
            return Array.from(row.children).map(tile => {
                if (tile.classList.contains('correct')) return '🟩';
                if (tile.classList.contains('present')) return '🟨';
                return '⬛';
            }).join('');
        }).join('\n');
        
        const resultText = `Wordle ${stats.gamesPlayed}\n${currentRow}/6\n\n${resultGrid}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Wordle Result',
                text: resultText
            }).catch(error => {
                console.error('Error sharing:', error);
                fallbackShare(resultText);
            });
        } else {
            fallbackShare(resultText);
        }
    }
    
    function fallbackShare(text) {
        // Copy to clipboard
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        textarea.select();
        try {
            // Using document.execCommand despite deprecation as it's still widely supported
            const successful = document.execCommand('copy');
            if (successful) {
                showMessage('Result copied to clipboard');
            } else {
                showMessage('Failed to copy result');
            }
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            showMessage('Failed to copy result');
        } finally {
            document.body.removeChild(textarea);
        }
    }
});
