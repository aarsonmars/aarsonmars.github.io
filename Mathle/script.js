document.addEventListener('DOMContentLoaded', () => {
  // Game constants
  const ROWS = 5; // Changed from 6 to 5
  const COLS = 7; // Changed from 8 to 7
  const VALID_KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '='];
  
  // Game state
  let currentRow = 0;
  let currentTile = 0;
  let gameOver = false;
  let targetEquation = '';
  
  // Generate the game board
  const gameBoard = document.getElementById('game-board');
  
  for (let i = 0; i < ROWS; i++) {
    const row = document.createElement('div');
    row.classList.add('row');
    
    for (let j = 0; j < COLS; j++) {
      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.dataset.row = i;
      tile.dataset.col = j;
      row.appendChild(tile);
    }
    
    gameBoard.appendChild(row);
  }
  
  // Get daily equation
  function getTodaysEquation() {
    // Generate a random equation that follows the format N*N+N=N (7 characters)
    
    // Helper function to generate a random integer between min and max (inclusive)
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Helper function to randomly select an operator
    function getRandomOperator() {
      const operators = ['+', '-', '*', '/'];
      return operators[getRandomInt(0, 3)];
    }
    
    let isValid = false;
    let equation = '';
    
    // Keep trying until we get a valid equation
    while (!isValid) {
      // For a 7-character equation, we need format like: N+N*N=N or N*N-N=N
      const num1 = getRandomInt(1, 9);
      const op1 = getRandomOperator();
      const num2 = getRandomInt(1, 9);
      const op2 = getRandomOperator();
      const num3 = getRandomInt(1, 9);
      
      // For division, make sure we don't divide by zero and the result is an integer
      if ((op1 === '/' && num2 === 0) || (op2 === '/' && num3 === 0)) {
        continue;
      }
      
      // Build the equation string
      const leftSide = `${num1}${op1}${num2}${op2}${num3}`;
      
      try {
        // Calculate the result
        let result = eval(leftSide);
        
        // Skip if the result isn't an integer or is negative or too large
        if (result !== Math.floor(result) || result < 0 || result > 9) {
          continue;
        }
        
        // Format the equation
        equation = `${leftSide}=${result}`;
        
        // Make sure the equation is exactly 7 characters
        if (equation.length !== 7) {
          continue;
        }
        
        isValid = true;
      } catch (e) {
        // If there's an error in evaluation, try again
        continue;
      }
    }
    
    return equation;
  }
  
  // Initialize the game
  function initGame() {
    targetEquation = getTodaysEquation();
    console.log('Target equation:', targetEquation); // For debugging
  }
  
  function preventZoom() {
    // Prevent pinch zoom on mobile
    document.addEventListener('touchmove', function(event) {
      if (event.scale !== 1) {
        event.preventDefault();
      }
    }, { passive: false });
    
    // Double-tap prevention
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }
  
  // Get tiles in the current row
  function getCurrentRowTiles() {
    return document.querySelectorAll(`.tile[data-row="${currentRow}"]`);
  }
  
  // Update tile with a character
  function updateTile(col, key) {
    const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${col}"]`);
    tile.textContent = key;
    tile.classList.add('filled');
    tile.classList.add('pop');
    setTimeout(() => {
      tile.classList.remove('pop');
    }, 100);
  }
  
  // Add a character to the current guess
  function addCharacter(key) {
    if (currentTile < COLS && !gameOver) {
      updateTile(currentTile, key);
      currentTile++;
    }
  }
  
  // Delete the last character
  function deleteCharacter() {
    if (currentTile > 0 && !gameOver) {
      currentTile--;
      const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${currentTile}"]`);
      tile.textContent = '';
      tile.classList.remove('filled');
    }
  }
  
  // Check if the equation is valid (syntax and math correctness)
  function isValidEquation(equation) {
    // Simple validation: check if it has exactly one equals sign
    const parts = equation.split('=');
    if (parts.length !== 2) return false;
    
    try {
      // Evaluate the left side of the equation
      const leftSide = eval(parts[0]);
      // Parse the right side of the equation
      const rightSide = parseFloat(parts[1]);
      
      // Check if the equation is valid
      return !isNaN(leftSide) && !isNaN(rightSide) && leftSide === rightSide;
    } catch (e) {
      console.log("Equation validation error:", e);
      return false; // Invalid syntax
    }
  }
  
  // Get the current guess as a string
  function getCurrentGuess() {
    let guess = '';
    const tiles = getCurrentRowTiles();
    tiles.forEach(tile => {
      guess += tile.textContent;
    });
    return guess;
  }
  
  // Check the guess against the target equation
  function checkGuess() {
    const guess = getCurrentGuess();
    console.log("Checking guess:", guess);
    
    if (guess.length !== COLS) {
      showMessage("Not enough characters");
      return;
    }
    
    // Validate the equation
    if (!isValidEquation(guess)) {
      showMessage("Invalid equation");
      return;
    }
    
    console.log("Valid equation, proceeding with feedback");
    
    // Start revealing tiles with animation
    const tiles = getCurrentRowTiles();
    const targetArray = targetEquation.split('');
    const guessArray = guess.split('');
    const results = new Array(COLS).fill('absent');
    
    // First pass: mark correct positions
    for (let i = 0; i < COLS; i++) {
      if (guessArray[i] === targetArray[i]) {
        results[i] = 'correct';
        targetArray[i] = null; // Mark as used
      }
    }
    
    // Second pass: mark present but wrong position
    for (let i = 0; i < COLS; i++) {
      if (results[i] !== 'correct' && targetArray.includes(guessArray[i])) {
        results[i] = 'present';
        const index = targetArray.indexOf(guessArray[i]);
        targetArray[index] = null; // Mark as used
      }
    }
    
    console.log("Results array:", results);
    
    // Animate the reveal
    for (let i = 0; i < COLS; i++) {
      const tile = tiles[i];
      
      // Delay each tile's animation
      setTimeout(() => {
        tile.classList.add('flip');
        
        // After half the animation, apply the result
        setTimeout(() => {
          tile.classList.add(results[i]);
          
          // Also update the keyboard
          updateKeyboard(guessArray[i], results[i]);
          
          // Check if game is won after the last tile is revealed
          if (i === COLS - 1) {
            if (guess === targetEquation) {
              setTimeout(() => {
                showMessage("Genius! You won!");
                showConfetti();
                gameOver = true;
              }, 500);
            } else if (currentRow >= ROWS - 1) {
              setTimeout(() => {
                const motivationalMessages = [
                  `Never give up! The equation was ${targetEquation}`,
                  `Keep practicing! The answer was ${targetEquation}`,
                  `You'll get it next time! It was ${targetEquation}`,
                  `Learning happens in mistakes. It was ${targetEquation}`,
                  `Almost there! The correct equation was ${targetEquation}`
                ];
                const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
                showMessage(randomMessage);
                gameOver = true;
              }, 500);
            } else {
              // Move to next row
              currentRow++;
              currentTile = 0;
            }
          }
        }, 250); // Half of the flip animation duration
      }, i * 200);
    }
  }
  
  // Add confetti function
  function showConfetti() {
    for (let i = 0; i < 150; i++) {
      createConfettiPiece();
    }
  }

  function createConfettiPiece() {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    
    // Random position, color and rotation
    const colors = ['#6aaa64', '#c9b458', '#4285F4', '#EA4335', '#FBBC05'];
    const size = Math.random() * 10 + 5;
    
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `-10px`;
    
    document.body.appendChild(confetti);
    
    // Animate falling
    const animationDuration = Math.random() * 3 + 2;
    confetti.style.animation = `confetti-fall ${animationDuration}s ease forwards`;
    
    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, animationDuration * 1000);
  }
  
  // Update the keyboard colors based on results
  function updateKeyboard(key, result) {
    const keyElement = document.querySelector(`.key[data-key="${key}"]`);
    if (!keyElement) return;
    
    // Only upgrade the key color (absent -> present -> correct)
    if (keyElement.classList.contains('correct')) {
      return; // Already has the best status
    }
    
    if (result === 'correct' || (result === 'present' && !keyElement.classList.contains('present'))) {
      // Remove any existing status classes
      keyElement.classList.remove('absent', 'present');
      // Add the new status class
      keyElement.classList.add(result);
    } else if (result === 'absent' && !keyElement.classList.contains('present') && !keyElement.classList.contains('correct')) {
      keyElement.classList.add('absent');
    }
  }
  
  // Show a message to the user
  function showMessage(text) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.classList.remove('hidden');
    setTimeout(() => {
      message.classList.add('hidden');
    }, 2000);
  }
  
  // Handle keyboard input
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (key === 'enter') {
      checkGuess();
    } else if (key === 'backspace') {
      deleteCharacter();
    } else if (VALID_KEYS.includes(key)) {
      addCharacter(key);
    }
  });
  
  // Handle on-screen keyboard clicks
  document.getElementById('keyboard').addEventListener('click', (e) => {
    if (e.target.classList.contains('key')) {
      const key = e.target.getAttribute('data-key');
      if (key) {
        addCharacter(key);
      } else if (e.target.id === 'enter-button') {
        checkGuess();
      } else if (e.target.id === 'delete-button') {
        deleteCharacter();
      }
    }
  });
  
  // Fix the enter and delete button handling
  document.getElementById('enter-button').addEventListener('click', () => {
    checkGuess();
  });
  
  document.getElementById('delete-button').addEventListener('click', () => {
    deleteCharacter();
  });
  
  // Help modal handling
  const helpModal = document.getElementById('help-modal');
  const helpButton = document.getElementById('help-button');
  const closeButton = document.querySelector('.close');
  
  helpButton.addEventListener('click', () => {
    helpModal.classList.add('show');
  });
  
  closeButton.addEventListener('click', () => {
    helpModal.classList.remove('show');
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.classList.remove('show');
    }
  });
  
  // Initialize the game
  initGame();
  preventZoom();
  
  // Improve mobile keyboard handling
  document.querySelectorAll('.key').forEach(key => {
    // Add touch event listeners with feedback
    key.addEventListener('touchstart', function(e) {
      e.preventDefault(); // Prevent default touch behavior
      this.style.opacity = '0.7';
    });
    
    key.addEventListener('touchend', function(e) {
      e.preventDefault();
      this.style.opacity = '1';
      
      // Handle key press
      const keyValue = this.getAttribute('data-key');
      if (keyValue) {
        addCharacter(keyValue);
      } else if (this.id === 'enter-button') {
        checkGuess();
      } else if (this.id === 'delete-button') {
        deleteCharacter();
      }
    });
  });
  
  // Show help modal on first visit
  if (!localStorage.getItem('mathleHelpShown')) {
    helpModal.classList.add('show');
    localStorage.setItem('mathleHelpShown', 'true');
  }
});