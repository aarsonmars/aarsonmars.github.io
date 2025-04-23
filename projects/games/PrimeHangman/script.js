document.addEventListener('DOMContentLoaded', () => {
  // Game elements
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  const numberDisplay = document.getElementById('numberDisplay');
  const attemptsLeft = document.getElementById('attemptsLeft');
  const cluesList = document.getElementById('cluesList');
  const getClueBtn = document.getElementById('getClueBtn');
  const guessForm = document.getElementById('guessForm');
  const digitInputContainer = document.getElementById('digitInputContainer');
  const guessesHistory = document.getElementById('guessesHistory');
  const messageArea = document.getElementById('messageArea');
  const newGameBtn = document.getElementById('newGameBtn');
  const rulesBtn = document.getElementById('rulesBtn');
  const rulesModal = document.getElementById('rulesModal');
  const closeModal = document.querySelector('.close');
  const checkGuessBtn = document.getElementById('checkGuessBtn');
  const hangmanCanvas = document.getElementById('hangmanCanvas');
  const hangmanCtx = hangmanCanvas.getContext('2d');

  // Mobile sidebar elements
  const toggleCluesBtn = document.getElementById('toggleCluesBtn');
  const clueOverlay = document.getElementById('clueOverlay');
  const cluePanel = document.querySelector('.clue-panel');
  const closeClueBtn = document.getElementById('closeClueBtn');
  
  // Toggle sidebar on button click
  if (toggleCluesBtn) {
    toggleCluesBtn.addEventListener('click', () => {
      if (cluePanel.classList.contains('active')) {
        // Close if already open
        cluePanel.classList.remove('active');
        clueOverlay.classList.remove('active');
      } else {
        // Open if currently closed
        cluePanel.classList.add('active');
        clueOverlay.classList.add('active');
      }
    });
  }
  
  // Close sidebar on overlay or close button click
  if (clueOverlay) {
    clueOverlay.addEventListener('click', () => {
      cluePanel.classList.remove('active');
      clueOverlay.classList.remove('active');
    });
  }
  if (closeClueBtn) {
    closeClueBtn.addEventListener('click', () => {
      cluePanel.classList.remove('active');
      clueOverlay.classList.remove('active');
    });
  }
  
  // Optional: Swipe gesture to open sidebar on mobile
  let touchStartX = null;
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  });
  document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX !== null && (touchEndX - touchStartX) > 100) {
      // Swipe right detected
      cluePanel.classList.add('active');
      clueOverlay.classList.add('active');
    }
    touchStartX = null;
  });

  // Game state
  let gameState = {
    targetPrime: null,
    difficulty: 'easy',
    digitsLength: 5,
    attempts: 8,
    guesses: [],
    clues: [],
    availableClues: [],
    gameOver: false,
    digitInputs: []
  };

  // Miller-Rabin primality test for large numbers
  function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0) return false;

    // Write n as 2^r * d + 1
    let r = 0;
    let d = n - 1;
    while (d % 2 === 0) {
      d /= 2;
      r++;
    }

    // Witness loop
    const k = 5; // Number of iterations for accuracy
    for (let i = 0; i < k; i++) {
      const a = 2 + Math.floor(Math.random() * (n - 4));
      let x = modPow(a, d, n);
      
      if (x === 1 || x === n - 1) continue;
      
      let continueNextWitness = false;
      for (let j = 0; j < r - 1; j++) {
        x = modPow(x, 2, n);
        if (x === n - 1) {
          continueNextWitness = true;
          break;
        }
      }
      
      if (continueNextWitness) continue;
      return false;
    }
    
    return true;
  }

  // Modular exponentiation (a^b mod m)
  function modPow(a, b, m) {
    a = a % m;
    let result = 1;
    
    while (b > 0) {
      if (b % 2 === 1) result = (result * a) % m;
      b = Math.floor(b / 2);
      a = (a * a) % m;
    }
    
    return result;
  }

  // Generate a random prime number of specified length
  function generateRandomPrime(length) {
    const min = 10**(length-1);
    const max = 10**length - 1;
    
    while (true) {
      const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
      if (isPrime(candidate)) {
        return candidate;
      }
    }
  }

  // Create digit input fields based on difficulty
  function createDigitInputs() {
    digitInputContainer.innerHTML = '';
    gameState.digitInputs = [];
    
    for (let i = 0; i < gameState.digitsLength; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'digit-input';
      input.maxLength = 1;
      input.pattern = '[0-9]';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.dataset.index = i;
      
      // Add event listeners for keyboard navigation
      input.addEventListener('keyup', (e) => {
        // Move to next input on digit entry
        if (/^[0-9]$/.test(e.key) && i < gameState.digitsLength - 1) {
          gameState.digitInputs[i + 1].focus();
        }
        
        // Handle backspace - move to previous input when empty
        if (e.key === 'Backspace' && input.value === '' && i > 0) {
          gameState.digitInputs[i - 1].focus();
        }
        
        // Handle arrows
        if (e.key === 'ArrowRight' && i < gameState.digitsLength - 1) {
          gameState.digitInputs[i + 1].focus();
        }
        if (e.key === 'ArrowLeft' && i > 0) {
          gameState.digitInputs[i - 1].focus();
        }
      });
      
      // Input validation - digits only
      input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9]/g, '');
      });
      
      digitInputContainer.appendChild(input);
      gameState.digitInputs.push(input);
    }
    
    // Focus first input
    if (gameState.digitInputs.length > 0) {
      gameState.digitInputs[0].focus();
    }
  }

  // Initialize game display
  function updateDisplay() {
    // Remove any previously created digit boxes
    numberDisplay.innerHTML = '';  // Clear the number display entirely
    
    // Only update the attempts and message area, then create the digit inputs for guessing
    attemptsLeft.textContent = gameState.attempts;
    messageArea.textContent = '';
    messageArea.className = 'message-area';
    
    // Draw initial hangman state
    drawHangman();
    
    // Create digit inputs as usual
    createDigitInputs();
    
    // Update active difficulty button
    difficultyButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.level === gameState.difficulty) {
        btn.classList.add('active');
      }
    });
  }

  // Generate clues for the target prime
  function generateClues(prime) {
    const primeStr = prime.toString();
    const digits = primeStr.split('').map(Number);
    const clues = [];
    
    // Sum of digits
    const digitSum = digits.reduce((a, b) => a + b, 0);
    clues.push(`The sum of all digits is ${digitSum}`);
    
    // First and last digit
    clues.push(`The first digit is ${digits[0]}`);
    clues.push(`The last digit is ${digits[digits.length - 1]}`);
    
    // If there are consecutive digits
    let hasConsecutive = false;
    for (let i = 0; i < digits.length - 1; i++) {
      if (digits[i] + 1 === digits[i + 1]) {
        clues.push(`Digits at positions ${i+1} and ${i+2} are consecutive ascending`);
        hasConsecutive = true;
        break;
      }
      if (digits[i] - 1 === digits[i + 1]) {
        clues.push(`Digits at positions ${i+1} and ${i+2} are consecutive descending`);
        hasConsecutive = true;
        break;
      }
    }
    
    if (!hasConsecutive) {
      clues.push("There are no consecutive digits next to each other");
    }
    
    // Digit occurrences
    const digitCount = {};
    digits.forEach(d => {
      digitCount[d] = (digitCount[d] || 0) + 1;
    });
    
    const mostFrequent = Object.entries(digitCount).sort((a, b) => b[1] - a[1])[0];
    clues.push(`The digit ${mostFrequent[0]} appears ${mostFrequent[1]} time(s)`);
    
    // Digit comparison
    const maxDigit = Math.max(...digits);
    const minDigit = Math.min(...digits);
    clues.push(`The largest digit is ${maxDigit}`);
    clues.push(`The smallest digit is ${minDigit}`);
    
    // Product of first and last digits
    clues.push(`The product of first and last digits is ${digits[0] * digits[digits.length - 1]}`);
    
    // Even/odd digits count
    const evenCount = digits.filter(d => d % 2 === 0).length;
    const oddCount = digits.length - evenCount;
    clues.push(`There are ${evenCount} even digits and ${oddCount} odd digits`);
    
    // Prefix or suffix information
    if (digits.length >= 5) {
      const firstTwoDigits = digits.slice(0, 2).join('');
      clues.push(`The first two digits are ${firstTwoDigits}`);
    }
    
    return shuffleArray(clues);
  }

  // Fisher-Yates shuffle algorithm
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Initialize a new game
  function initGame() {
	// Determine difficulty: set digits length and attempts accordingly
	switch (gameState.difficulty) {
		case 'easy':
			gameState.digitsLength = 5;
			gameState.attempts = 6;
			break;
		case 'medium':
			gameState.digitsLength = 6;
			gameState.attempts = 7;
			break;
		case 'hard':
			gameState.digitsLength = 7;
			gameState.attempts = 8;
			break;
	}
    
    // Generate a prime number
    gameState.targetPrime = generateRandomPrime(gameState.digitsLength);
    console.log('Target prime:', gameState.targetPrime); // For debugging
    
    // Reset game state
    gameState.guesses = [];
    gameState.clues = [];
    gameState.gameOver = false;
    
    // Generate and shuffle clues
    gameState.availableClues = generateClues(gameState.targetPrime);
    
    // Clear any existing clues
    cluesList.innerHTML = '';
    
    // Remove the call to provideClue() so no default clue is shown
    // provideClue(); <- remove this line
    
    // Update the display
    updateDisplay();
    guessesHistory.innerHTML = '';
    
    // Enable/disable controls
    getClueBtn.disabled = false;
    checkGuessBtn.disabled = false;
    gameState.digitInputs.forEach(input => {
      input.disabled = false;
      input.value = '';
      input.className = 'digit-input';
    });
  }

  // Provide a clue
  function provideClue() {
    // Check if only one attempt left - don't allow getting a clue
    console.log(gameState.attempts);
    if (gameState.attempts <= 2) {
      showMessage("Can't get clues with only 2 attempts left! Make your final guess wisely!", "error");
      return;
    }
    
    if (gameState.availableClues.length === 0) {
      showMessage("No more clues available!", "error");
      return;
    }
    
    // Decrease attempts when getting a clue
    gameState.attempts--;
    attemptsLeft.textContent = gameState.attempts;
    
    const clue = gameState.availableClues.shift();
    gameState.clues.push(clue);
    
    const clueItem = document.createElement('li');
    clueItem.textContent = clue;
    cluesList.appendChild(clueItem);
    
    // Disable clue button if no more clues or only one attempt left
    if (gameState.availableClues.length === 0 || gameState.attempts <= 1) {
      getClueBtn.disabled = true;
    }
    
    // Show message about the attempt cost
    showMessage("You used 1 attempt to get a clue!", "info");
    
    // Update hangman drawing since an attempt was used
    drawHangman();
    
    // Scroll the clues list to the bottom to show the new clue
    cluesList.scrollTop = cluesList.scrollHeight;
    
    // If we have many clues, limit the number displayed to keep UI manageable
    if (cluesList.children.length > 8) {
      // Remove oldest clues if we have too many
      while (cluesList.children.length > 6) {
        cluesList.removeChild(cluesList.children[0]);
      }
    }
  }

  // Get the current guess from digit inputs
  function getGuessFromInputs() {
    let guessString = '';
    let isComplete = true;
    
    gameState.digitInputs.forEach(input => {
      if (input.value === '') {
        isComplete = false;
        input.classList.add('incorrect');
        setTimeout(() => input.classList.remove('incorrect'), 500);
      }
      guessString += input.value;
    });
    
    if (!isComplete) {
      showMessage('Please enter all digits!', 'error');
      return null;
    }
    
    return parseInt(guessString);
  }

  // Process a guess
  function processGuess() {
    if (gameState.gameOver) return;
    
    // Get guess from inputs
    const guessNum = getGuessFromInputs();
    if (guessNum === null) return;
    
    // Check if already guessed - Show message with higher visibility
    if (gameState.guesses.includes(guessNum)) {
      showMessage("You've already tried this number!", "error");
      // Flash the input fields to indicate a duplicate
      gameState.digitInputs.forEach(input => {
        input.classList.add('duplicate-guess');
        setTimeout(() => input.classList.remove('duplicate-guess'), 800);
      });
      return;
    }
    
    // Add to guesses and decrement attempts
    gameState.guesses.push(guessNum);
    gameState.attempts--;
    attemptsLeft.textContent = gameState.attempts;
    
    // Check if the guess is correct
    if (guessNum === gameState.targetPrime) {
      handleCorrectGuess();
      displayGuessHistory(guessNum);
      return;
    }
    
    // Handle incorrect guess feedback
    handleIncorrectGuess(guessNum);
    
    // Update hangman drawing
    drawHangman();
    
    // Display the guess history
    displayGuessHistory(guessNum);
    
    // Force game over if attempts reach zero
    if (gameState.attempts <= 0) {
      setTimeout(() => {
        if (!gameState.gameOver) {
          endGame(false);
        }
      }, 300);
    }
  }

  // Handle correct guess
  function handleCorrectGuess() {
    // Reveal all digits
    const digitCells = numberDisplay.querySelectorAll('.digit-cell');
    digitCells.forEach(cell => {
      cell.textContent = cell.dataset.digit;
      cell.className = 'digit-cell revealed';
    });
    
    // Highlight all inputs as correct
    gameState.digitInputs.forEach(input => {
      input.className = 'digit-input correct';
    });
    
    endGame(true);
  }

  // Handle incorrect guess
  function handleIncorrectGuess(guess) {
    const target = gameState.targetPrime;
    const targetDigits = target.toString().split('').map(Number);
    const guessDigits = guess.toString().padStart(gameState.digitsLength, '0').split('').map(Number);
    
    // Give feedback (higher/lower)
    let feedback = guess < target ? "Too low." : "Too high.";
    
    // Count correct digits and highlight inputs
    let correctPositions = 0;
    const usedTargetIndices = new Set();
    
    // First pass - check for correct positions
    for (let i = 0; i < targetDigits.length; i++) {
      if (guessDigits[i] === targetDigits[i]) {
        gameState.digitInputs[i].className = 'digit-input correct';
        correctPositions++;
        usedTargetIndices.add(i);
      } else {
        gameState.digitInputs[i].className = 'digit-input incorrect';
      }
    }
    
    // Second pass - check for correct digits in wrong position
    for (let i = 0; i < guessDigits.length; i++) {
      if (guessDigits[i] !== targetDigits[i]) { // Already handled correct positions
        let foundPartial = false;
        for (let j = 0; j < targetDigits.length; j++) {
          if (!usedTargetIndices.has(j) && guessDigits[i] === targetDigits[j]) {
            gameState.digitInputs[i].className = 'digit-input partial';
            usedTargetIndices.add(j);
            foundPartial = true;
            break;
          }
        }
      }
    }
    
    feedback += ` ${correctPositions} correct digits in the right position`;
    
    return feedback;
  }

  // Display guess history
  function displayGuessHistory(guess) {
	// Recalculate colors based solely on the target value and guess
	const isCorrect = guess === gameState.targetPrime;
	let guessStr = guess.toString().padStart(gameState.digitsLength, '0');
	let targetStr = gameState.targetPrime.toString().padStart(gameState.digitsLength, '0');
	let coloredDigits = '';
	
	for (let i = 0; i < guessStr.length; i++) {
		const digit = guessStr[i];
		let colorClass = '';
		if (digit === targetStr[i]) {
			colorClass = 'correct'; // Green: digit and position are correct
		} else if (targetStr.indexOf(digit) !== -1) {
			colorClass = 'partial'; // Blue: digit is present but in a different position
		} else {
			colorClass = 'incorrect'; // Red: digit not found in the prime number
		}
		coloredDigits += `<span class="${colorClass}">${digit}</span>`;
	}
	
	const feedback = isCorrect ? 'Correct!' : (guess < gameState.targetPrime ? "Too low." : "Too high.");
	
	const tableRow = document.createElement('tr');
	tableRow.className = isCorrect ? 'correct' : 'incorrect';
	tableRow.innerHTML = `
		<td class="guess-number number-column">${coloredDigits}</td>
		<td class="guess-feedback feedback-column">${feedback}</td>
	`;
	
	guessesHistory.prepend(tableRow);
	
	// Force scroll to top so newest guesses are seen
	if (guessesHistory.parentElement.scrollTop !== 0) {
		guessesHistory.parentElement.scrollTop = 0;
	}
	
	// Reset the inputs for a new guess if the game isn't over
	if (!isCorrect && gameState.attempts > 0) {
		gameState.digitInputs.forEach(input => {
			input.value = '';
		});
		gameState.digitInputs[0].focus();
	}
}

  // End the game
  function endGame(isWin) {
    gameState.gameOver = true;
    
    // Disable inputs
    gameState.digitInputs.forEach(input => {
      input.disabled = true;
    });
    checkGuessBtn.disabled = true;
    getClueBtn.disabled = true;
    
    // Reveal the number if needed
    if (!isWin) {
      // Show game over message with popup
      const gameOverMessage = `Game over! The prime number was ${gameState.targetPrime}. Try again!`;
      showMessage(gameOverMessage, "error");
      
      // Create a simple popup for game over
      const popup = document.createElement('div');
      popup.className = 'popup-overlay';
      popup.innerHTML = `<div class="popup-content error-popup">${gameOverMessage}</div>`;
      document.body.appendChild(popup);
      
      // Remove popup after delay
      setTimeout(() => {
        popup.remove();
      }, 6000);
    } else {
      // Show win message with confetti
      showConfettiPopup(`Congratulations! You've guessed the prime number ${gameState.targetPrime} correctly!`);
    }
  }

  // Show message
  function showMessage(message, type) {
    // Create a new message element each time to avoid stacking issues
    const existingMessage = document.querySelector('.floating-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message-area floating-message ${type}`;
    messageElement.textContent = message;
    document.body.appendChild(messageElement);
    
    // Auto-hide message
    if (type !== 'error' && type !== 'success') {
      setTimeout(() => {
        messageElement.remove();
      }, 5000);
    } else {
      // Add fade out for error messages
      setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
          messageElement.remove();
        }, 500);
      }, 3000);
    }
    
    // Remove the update of the original message area
    // This will prevent showing the message twice
  }

  // Show confetti popup
  function showConfettiPopup(message) {
    // Create a popup overlay element
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `<div class="popup-content">${message}</div>`;
    document.body.appendChild(popup);
    // Create confetti elements
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = ['#f44336', '#2196f3', '#4caf50'][Math.floor(Math.random() * 3)];
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      popup.appendChild(confetti);
    }
    // Remove popup after a delay
    setTimeout(() => {
      popup.remove();
    }, 5000);
  }

  // Draw hangman stage based on remaining attempts
  function drawHangman() {
    const canvas = hangmanCanvas;
    const ctx = hangmanCtx;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set drawing styles
    ctx.strokeStyle = '#343a40';
    ctx.lineWidth = 2;
    
    // Calculate parts to show based on difficulty and number of mistakes made
    let partsToShow = 0;
    
    // Calculate attempts used (mistakes made)
    const totalAttempts = gameState.difficulty === 'easy' ? 5 : 
                          gameState.difficulty === 'medium' ? 6 : 7;
    const mistakesMade = totalAttempts - gameState.attempts;
    
    // Apply the special logic for first mistake
    if (mistakesMade > 0) {
      if (gameState.difficulty === 'easy') {
        // First mistake: 3 parts, subsequent mistakes: 1 part each
        partsToShow = 3 + (mistakesMade - 1);
      } else if (gameState.difficulty === 'medium') {
        // First mistake: 2 parts, subsequent mistakes: 1 part each
        partsToShow = 2 + (mistakesMade - 1);
      } else {
        // Hard mode: Each mistake shows 1 part
        partsToShow = mistakesMade;
      }
    }
    
    // Limit to maximum of 7 parts
    partsToShow = Math.min(7, partsToShow);
    
    // Base - always shown
    ctx.beginPath();
    ctx.moveTo(10, height - 10);
    ctx.lineTo(width - 10, height - 10);
    ctx.stroke();
    
    // Draw each part based on how many to show
    if (partsToShow >= 1) {
      // Vertical post
      ctx.beginPath();
      ctx.moveTo(30, height - 10);
      ctx.lineTo(30, 10);
      ctx.stroke();
    }
    
    if (partsToShow >= 2) {
      // Horizontal beam
      ctx.beginPath();
      ctx.moveTo(30, 10);
      ctx.lineTo(80, 10);
      ctx.stroke();
    }
    
    if (partsToShow >= 3) {
      // Rope
      ctx.beginPath();
      ctx.moveTo(80, 10);
      ctx.lineTo(80, 20);
      ctx.stroke();
    }
    
    if (partsToShow >= 4) {
      // Head
      ctx.beginPath();
      ctx.arc(80, 27, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    if (partsToShow >= 5) {
      // Body
      ctx.beginPath();
      ctx.moveTo(80, 34);
      ctx.lineTo(80, 55);
      ctx.stroke();
    }
    
    if (partsToShow >= 6) {
      // Left arm
      ctx.beginPath();
      ctx.moveTo(80, 40);
      ctx.lineTo(70, 48);
      ctx.stroke();
    }
    
    if (partsToShow >= 7) {
      // Right arm
      ctx.beginPath();
      ctx.moveTo(80, 40);
      ctx.lineTo(90, 48);
      ctx.stroke();
    }
    
    // Force game over if attempts reach zero
    if (gameState.attempts <= 0 && !gameState.gameOver) {
      setTimeout(() => endGame(false), 100); // Short delay to ensure drawing completes first
    }
  }

  // Event listeners
  difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update difficulty
      gameState.difficulty = button.dataset.level;
      
      // Start new game
      initGame();
    });
  });

  guessForm.addEventListener('submit', e => {
    e.preventDefault();
    processGuess();
  });

  getClueBtn.addEventListener('click', () => {
    provideClue();
  });

  newGameBtn.addEventListener('click', () => {
    initGame();
  });

  rulesBtn.addEventListener('click', () => {
    rulesModal.style.display = 'block';
  });

  closeModal.addEventListener('click', () => {
    rulesModal.style.display = 'none';
  });

  window.addEventListener('click', e => {
    if (e.target === rulesModal) {
      rulesModal.style.display = 'none';
    }
  });

  // Initialize game on load
  initGame();
});