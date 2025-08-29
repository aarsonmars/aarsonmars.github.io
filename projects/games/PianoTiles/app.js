var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

c.height=innerHeight;
c.width=innerWidth

var canvasHeight = c.height;
var canvasWidth = c.width;

var tileHeight = 180;
var width = canvasWidth / 4;
var tileSpeed = 8;
var tileRefreshRate=parseInt(Math.random()*50)+50

var tiles = [];
var score = 0;
var currentTileSpeed = tileSpeed;
var particles = [];  // Initialize melody display
  // updateMelodyDisplay();

// Initialize combo display
  // updateComboDisplay(); // DISABLEDupdateScore;
var icon = "./img/pianoTilesSquare.png";
// var comboStreak = 0; // Track consecutive hits - DISABLED
// var lastTileHitTime = 0; // Track timing for rhythm detection - DISABLED

// Melody transition state
var isMelodyTransitioning = false;
var melodyTransitionEndTime = 0;

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 3 + 2;
    this.speedX = (Math.random() - 0.5) * 4;
    this.speedY = (Math.random() - 0.5) * 4;
    this.life = 60;
    this.maxLife = 60;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
    this.size *= 0.98;
  }

  draw() {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function createParticles(x, y, color = "#4a90e2") {
  for (let i = 0; i < 8; i++) {
    particles.push(new Particle(x, y, color));
  }
}

// Global sound flag (now managed by SoundManager)
// var soundEnabled = true;

function initializeVariables(){
  tiles = [];
  score = 0;
  currentTileSpeed = tileSpeed;
  updateScore.innerText=score
  particles = []; // Clear particles on game reset
  // comboStreak = 0; // Reset combo streak - DISABLED
  // lastTileHitTime = 0; // Reset timing - DISABLED

  // Reset melody transition state
  isMelodyTransitioning = false;
  melodyTransitionEndTime = 0;
}

// Preload tap sound (remove or keep for fallback)
// var tapSound = new Audio('./sound/g6-82013.mp3');

// New: Array of piano note sounds and index tracker (now handled by SoundManager)
// var soundFiles = ['./sound/a6.mp3', './sound/b6.mp3', './sound/c6.mp3', './sound/d6.mp3', './sound/e6.mp3', './sound/f6.mp3', './sound/g6.mp3'];
// var currentSoundIndex = 0;

// Unlock mobile audio on first touch event (now handled by SoundManager)
// c.addEventListener("touchstart", function initialUnlock() {
//     tapSound.play().then(() => tapSound.pause()).catch(() => {});
//     c.removeEventListener("touchstart", initialUnlock);
// });

class Tile {
  constructor(x = 0, y = 0, height = 350) {
    this.height = height;
    this.x = x;
    this.y = y;
    this.pressed = false;
    this.pressTime = 0;
    this.glowIntensity = 0;
  }
  draw() {
    const cornerRadius = 8;
    const borderWidth = 2;

    // Calculate tile center and radius for radial gradient
    const centerX = this.x + width / 2;
    const centerY = this.y + this.height / 2;
    const radius = Math.max(width / 2, this.height / 2);

    // Create radial gradient from center to edges
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    if (this.pressed) {
      // Bright blue radial gradient when pressed
      gradient.addColorStop(0, "#4a90e2");
      gradient.addColorStop(0.7, "#357abd");
      gradient.addColorStop(1, "#2c5aa0");
    } else {
      // Black with blue accents radiating from center
      gradient.addColorStop(0, "#2c2c2c");
      gradient.addColorStop(0.6, "#1a1a1a");
      gradient.addColorStop(1, "#0f0f0f");
    }

    // Draw main tile with rounded corners
    ctx.beginPath();
    ctx.moveTo(this.x + cornerRadius, this.y);
    ctx.lineTo(this.x + width - cornerRadius, this.y);
    ctx.quadraticCurveTo(this.x + width, this.y, this.x + width, this.y + cornerRadius);
    ctx.lineTo(this.x + width, this.y + this.height - cornerRadius);
    ctx.quadraticCurveTo(this.x + width, this.y + this.height, this.x + width - cornerRadius, this.y + this.height);
    ctx.lineTo(this.x + cornerRadius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - cornerRadius);
    ctx.lineTo(this.x, this.y + cornerRadius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + cornerRadius, this.y);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();

    // Add border
    ctx.strokeStyle = this.pressed ? "#4a90e2" : "#2c5282";
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    // Add 3D shadow effect at the bottom only
    ctx.shadowColor = this.pressed ? "rgba(74, 144, 226, 0.6)" : "rgba(53, 122, 189, 0.4)";
    ctx.shadowBlur = this.pressed ? 15 + this.glowIntensity : 8 + this.glowIntensity;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Draw bottom shadow shape
    ctx.beginPath();
    ctx.moveTo(this.x + cornerRadius, this.y + this.height - 2);
    ctx.lineTo(this.x + width - cornerRadius, this.y + this.height - 2);
    ctx.quadraticCurveTo(this.x + width, this.y + this.height - 2, this.x + width, this.y + this.height + 6);
    ctx.lineTo(this.x, this.y + this.height + 6);
    ctx.quadraticCurveTo(this.x, this.y + this.height - 2, this.x + cornerRadius, this.y + this.height - 2);
    ctx.closePath();

    ctx.fillStyle = this.pressed ? "rgba(74, 144, 226, 0.3)" : "rgba(53, 122, 189, 0.2)";
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  update() {
    // Update glow intensity for animation
    if (this.pressed) {
      this.glowIntensity = Math.min(10, this.glowIntensity + 1);
      this.pressTime++;
      if (this.pressTime > 10) {
        this.pressed = false;
        this.pressTime = 0;
      }
    } else {
      this.glowIntensity = Math.max(0, this.glowIntensity - 0.5);
    }

    this.draw();
    this.y += currentTileSpeed;
  }
}

function generateTiles(noOfTiles, tileGap = 0) {
  let previousVaule = 0;
  doubleTilePosition=parseInt(Math.random()*noOfTiles)
  for (var i = 0; i < noOfTiles; i++) {
    x = parseInt(Math.random() * 4);
    if (x == previousVaule) {
      x = x > 2 ? x-1 : x + 1;
    }
    y = -tileHeight * i - tileHeight * tileGap;
    tiles.push(new Tile(x * width, y, tileHeight));
    previousVaule=x
    // if(i==doubleTilePosition){
    //   console.log(i)
    //   if (x<2){
    //     x=x+2
    //     previousVaule=x;
    //   }
    //   else{
    //     x=x-2
    //     previousVaule=x;
    //   }
    //   console.log('hello',x,y)
    //   tiles.push(new Tile(x * width, y, tileHeight));      
    // }
  }
}

function checkGameover(x, y) {
  // Find the tile that was tapped
  let tappedTile = null;
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    if (x >= tile.x && x <= tile.x + width &&
        y >= tile.y && y <= tile.y + tile.height) {
      tappedTile = tile;
      break;
    }
  }

  if (tappedTile) {
    // Mark tile as pressed for visual feedback
    tappedTile.pressed = true;
    tappedTile.pressTime = 0;

    // Create particle effect at tap location
    const centerX = tappedTile.x + width / 2;
    const centerY = tappedTile.y + tappedTile.height / 2;
    createParticles(centerX, centerY, tappedTile.pressed ? "#4a90e2" : "#357abd");

    // Play simple melody note
    soundManager.playMelodyNote();

    // Dynamic melody changes every 25 tiles
    if (score > 0 && score % 25 === 0) {
        // Set melody transition flag and pause tile generation
        isMelodyTransitioning = true;
        melodyTransitionEndTime = Date.now() + 2000; // 2 second pause for transition

        // Smooth transition to next melody in sequence
        soundManager.nextMelodyInSequence();
        // Play special effect for milestone
        soundManager.playEffect('milestone');

        // Update melody display after transition completes
        // setTimeout(() => {
        //     updateMelodyDisplay();
        // }, 500); // Wait for transition to complete - DISABLED
    }

    score += 1;
    updateScore.innerText = score;
    tiles = tiles.slice(1, tiles.length);
  } else {
    // Missed tile - simple sound effect
    soundManager.playEffect('fail');
    
    gameover();
  }
}

c.addEventListener("click", (event)=>{
  x = (event.offsetX * c.width) / c.offsetWidth;
  y = (event.offsetY * c.height) / c.offsetHeight;
  checkGameover(x,y)
});
c.addEventListener("touchstart", (event)=>{
  event.preventDefault();
  event = event.targetTouches[0];
  navigator.vibrate(30)
  x = (event.pageX * c.width) / c.offsetWidth;
  y = (event.pageY * c.height) / c.offsetHeight;
  checkGameover(x,y)
});



function finalScore() {
  scoreDivText = document.createElement("div");
  scoreDivText.id = "finalScoreText";
  scoreDivText.innerText = "Your Score";
  document.querySelector("#container").append(scoreDivText);

  scoreDiv = document.createElement("div");
  scoreDiv.id = "finalScore";
  scoreDiv.innerText = score;
  document.querySelector("#container").append(scoreDiv);
}

function createButton(buttonText = "Play\nAgain") {
  rePlay = document.createElement("button");
  rePlay.id = "rePlayButton";
  rePlay.innerText = buttonText;
  document.querySelector("#container").append(rePlay);
  rePlay.addEventListener("click", startGame);
}

var animationRequest;
function animate() {
  animationRequest = requestAnimationFrame(animate);

  // Clear canvas with a subtle gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  bgGradient.addColorStop(0, "#1a1a2e");
  bgGradient.addColorStop(0.5, "#16213e");
  bgGradient.addColorStop(1, "#0f3460");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw piano key columns with enhanced gradients
  for (let i = 0; i < 4; i++) {
    const columnGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    if (i % 2 === 0) {
      // White key columns
      columnGradient.addColorStop(0, "#ffffff");
      columnGradient.addColorStop(0.7, "#f8f9fa");
      columnGradient.addColorStop(1, "#e9ecef");
    } else {
      // Light gray key columns
      columnGradient.addColorStop(0, "#f1f3f4");
      columnGradient.addColorStop(0.7, "#e8eaed");
      columnGradient.addColorStop(1, "#dadce0");
    }

    ctx.fillStyle = columnGradient;
    ctx.fillRect(i * (canvasWidth / 4), 0, canvasWidth / 4, canvasHeight);

    // Add subtle inner shadow for depth
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(i * (canvasWidth / 4), 0, canvasWidth / 4, canvasHeight * 0.1);

    // Add piano key dividers
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i * (canvasWidth / 4), 0);
    ctx.lineTo(i * (canvasWidth / 4), canvasHeight);
    ctx.stroke();
  }

  // Add right border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvasWidth, 0);
  ctx.lineTo(canvasWidth, canvasHeight);
  ctx.stroke();

  // Add melody transition visual indicator
  if (isMelodyTransitioning) {
    const transitionProgress = Math.min(1, (Date.now() - (melodyTransitionEndTime - 2000)) / 2000);
    const alpha = 0.3 * (1 - Math.abs(transitionProgress - 0.5) * 2); // Fade in and out

    // Subtle glow effect across the canvas
    ctx.fillStyle = `rgba(138, 43, 226, ${alpha})`; // Purple glow
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Musical note symbol in center
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 2})`;
    ctx.fillText('♪', canvasWidth / 2, canvasHeight / 2);
  }

  tiles.slice(0, tileRefreshRate).forEach(function (tile) {
    tile.update();
    if (tile.y + tile.height - c.height > 0) {
      setTimeout(() => {
        gameover();
      }, 0);
    }
  });

  // Atmospheric sound dynamics - occasional subtle background notes
  if (Math.random() < 0.02 && soundManager.isSoundEnabled() && tiles.length > 0) {
    // Very quiet atmospheric notes during gameplay
    const atmosphericNotes = ['c5', 'e5', 'g5', 'a5'];
    const randomNote = atmosphericNotes[Math.floor(Math.random() * atmosphericNotes.length)];
    soundManager.playNote(randomNote, 0.1); // Very quiet
  }

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  if (tiles.length == 0) {
    // Check if we're in a melody transition pause
    if (isMelodyTransitioning && Date.now() < melodyTransitionEndTime) {
      // Don't generate new tiles during transition - create a rhythmic pause
      return;
    }

    // Reset transition flag if transition period has ended
    if (isMelodyTransitioning && Date.now() >= melodyTransitionEndTime) {
      isMelodyTransitioning = false;
    }

    tileRefreshRate=parseInt(Math.random()*tileRefreshRate)+tileRefreshRate
    generateTiles(tileRefreshRate,tileGap=2);
    currentTileSpeed += .5;

    // Subtle progression sound when new tiles appear
    if (soundManager.isSoundEnabled()) {
      setTimeout(() => {
        soundManager.playNote('c6', 0.15); // Very subtle progression indicator
      }, 200);
    }
  }
}
function initialStartButtons(){
  updateScore = document.createElement("div");
  updateScore.id = "updateScore";
  updateScore.innerText = score;
  document.querySelector("#container").append(updateScore);

  createButton("Play");
  scoreDivText = document.createElement("div");
  scoreDivText.id = "finalScoreText";
  scoreDivText.innerText = "Piano Tiles";
  document.querySelector("#container").append(scoreDivText);

  scoreDiv = document.createElement("div");
  scoreDiv.id = "finalScore";
  scoreDiv.style.background = `center / 100% 100% url(${icon})`;
  document.querySelector("#container").append(scoreDiv);

  // Initialize melody display
  // updateMelodyDisplay();
  
  // Initialize combo display
  updateComboDisplay();
}
initialStartButtons()

const removeElement = (id) => {
  document.querySelector(id) && document.querySelector(id).remove();
};


function gameover(){
    cancelAnimationFrame(animationRequest);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    // Revert: Show the entire control panel on game over
    document.querySelector('.control-panel').style.display = 'flex';
    document.querySelector("#finalScoreText") || finalScore();
    document.querySelector("#rePlayButton") || createButton();

    // Play game over sound effect
    soundManager.playEffect('fail');
}

function updateMelodyDisplay() {
    // Melody display removed - keeping function for potential future use
    // const melodyInfo = soundManager.getMelodyProgress();
    // const melodyDisplay = document.getElementById('current-melody');
    // if (melodyDisplay) {
    //     melodyDisplay.textContent = `♪ ${melodyInfo.current.charAt(0).toUpperCase() + melodyInfo.current.slice(1)}`;
    //     melodyDisplay.style.animation = 'melodyChange 0.5s ease-in-out';
    //     melodyDisplay.style.display = 'block'; // Ensure it's visible
    //     setTimeout(() => {
    //         melodyDisplay.style.animation = '';
    //     }, 500);
    // }
}

function updateComboDisplay() {
    // Combo display disabled - keeping function for potential future use
    // const comboDisplay = document.getElementById('combo-display');
    // if (comboDisplay) {
    //     if (comboStreak >= 3) {
    //         comboDisplay.textContent = `Combo: ${comboStreak}`;
    //         comboDisplay.classList.add('show');
    //         comboDisplay.classList.add('pulse');
    //         
    //         // Change color based on combo level
    //         if (comboStreak >= 10) {
    //             comboDisplay.style.background = 'rgba(255, 215, 0, 0.9)'; // Gold
    //         } else if (comboStreak >= 5) {
    //             comboDisplay.style.background = 'rgba(255, 69, 0, 0.9)'; // Red-orange
    //         } else {
    //             comboDisplay.style.background = 'rgba(74, 144, 226, 0.8)'; // Blue
    //         }
    //         
    //         setTimeout(() => {
    //             comboDisplay.classList.remove('pulse');
    //         }, 500);
    //     } else {
    //         comboDisplay.classList.remove('show');
    //     }
    // }
}

function startGame() {
  // Revert: Hide the entire control panel when game starts
  document.querySelector('.control-panel').style.display = 'none';
  removeElement("#rePlayButton");
  removeElement("#finalScore");
  removeElement("#finalScoreText");

  initializeVariables();

  // Reset to first melody for new game
  soundManager.currentSequenceIndex = 0;
  soundManager.setMelody('happy');
  
  // Update melody display immediately
  // setTimeout(() => {
  //     updateMelodyDisplay();
  // }, 100); // Small delay to ensure DOM is ready

  // Start background music (optional - comment out if too distracting)
  // soundManager.startBackgroundMusic(3000); // Play every 3 seconds

  generateTiles(tileRefreshRate);
  animate();
}

// New: Sound Toggle and Difficulty Buttons Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Sound toggle
    var soundToggleBtn = document.getElementById('sound-toggle');
    if(soundToggleBtn) {
        soundToggleBtn.addEventListener('click', function() {
            const isEnabled = soundManager.toggleSound();
            // Optionally toggle a visual indicator, e.g. add/remove a class
            this.classList.toggle('sound-off', !isEnabled);
        });
    }

    // Difficulty buttons with selected state
    var btnEasy = document.getElementById('easy');
    var btnMedium = document.getElementById('medium');
    var btnHard = document.getElementById('hard');
    function clearSelected() {
        btnEasy.classList.remove('selected');
        btnMedium.classList.remove('selected');
        btnHard.classList.remove('selected');
    }
    if(btnEasy && btnMedium && btnHard) {
        btnEasy.addEventListener('click', function() {
            tileSpeed = 5;
            currentTileSpeed = 5;
            clearSelected();
            this.classList.add('selected');
        });
        btnMedium.addEventListener('click', function() {
            tileSpeed = 8;
            currentTileSpeed = 8;
            clearSelected();
            this.classList.add('selected');
        });
        btnHard.addEventListener('click', function() {
            tileSpeed = 11;
            currentTileSpeed = 11;
            clearSelected();
            this.classList.add('selected');
        });
    }
});

// var fc = new FpsCtrl(24, function(e) {
//     // animationRequest = requestAnimationFrame(animate);
//     ctx.clearRect(0, 0, canvasWidth, canvasHeight);
//     tiles.forEach(function (c) {
//       c.update();
//     });
// });
// fc.start()
