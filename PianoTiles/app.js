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

var tiles = new Array();
var score = 0;
var currentTileSpeed = tileSpeed;
var icon = "./img/pianoTilesSquare.png";

// Global sound flag (enabled by default)
var soundEnabled = true;

function initializeVariables(){
  tiles = [];
  score = 0;
  currentTileSpeed = tileSpeed;
  updateScore.innerText=score
}

// Preload tap sound
var tapSound = new Audio('./sound/beep2.mp3'); // Verify path is correct

// Unlock mobile audio on first touch event
c.addEventListener("touchstart", function initialUnlock() {
    tapSound.play().then(() => tapSound.pause()).catch(() => {});
    c.removeEventListener("touchstart", initialUnlock);
});

class Tile {
  constructor(x = 0, y = 0, height = 350) {
    this.height = height;
    this.x = x;
    this.y = y;
  }
  draw() {
    ctx.beginPath();
    ctx.rect(this.x, this.y, width, this.height);
    ctx.fillStyle = "rgb(0,0,2)";
    ctx.fill();
  }
  update() {
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
  if (
    ctx.getImageData(x, y, 1, 1).data[2] == 2 &&
    ctx.getImageData(x + 5, y + 5, 1, 1).data[2] == 2
  ) {
    if(soundEnabled) {
      new Audio(tapSound.src).play();
    }
    score += 1;
    updateScore.innerText = score;
    tiles = tiles.slice(1, tiles.length);
  } else {
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
  color1='#FFFFFF'
  color2='#ECECEF'
  // ctx.fillStyle="rgba(218, 219, 242,0.8)"
  // ctx.fillStyle="rgba(200, 201, 222,0.8)"

  ctx.fillStyle=color1
  ctx.fillRect(0, 0, canvasWidth/4, canvasHeight);
  ctx.fillStyle=color2
  ctx.fillRect(canvasWidth/4, 0, canvasWidth/4, canvasHeight);
  ctx.fillStyle=color1
  ctx.fillRect(canvasWidth/2, 0, canvasWidth/2, canvasHeight);
  ctx.fillStyle=color2
  ctx.fillRect(canvasWidth*0.75, 0, canvasWidth, canvasHeight);

  tiles.slice(0, tileRefreshRate).forEach(function (tile) {
    tile.update();
    if (tile.y + tile.height - c.height > 0) {
      setTimeout(() => {
        gameover();
      }, 0);
    }
  });
  if (tiles.length == 0) {
    tileRefreshRate=parseInt(Math.random()*tileRefreshRate)+tileRefreshRate
    generateTiles(tileRefreshRate,tileGap=2);
    currentTileSpeed += .5;;
  }
}



var updateScore;
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
}

function startGame() {
  // Revert: Hide the entire control panel when game starts
  document.querySelector('.control-panel').style.display = 'none';
  removeElement("#rePlayButton");
  removeElement("#finalScore");
  removeElement("#finalScoreText");

  initializeVariables();
  generateTiles(tileRefreshRate);
  animate();
}

// New: Sound Toggle and Difficulty Buttons Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Sound toggle
    var soundToggleBtn = document.getElementById('sound-toggle');
    if(soundToggleBtn) {
        soundToggleBtn.addEventListener('click', function() {
            soundEnabled = !soundEnabled;
            // Optionally toggle a visual indicator, e.g. add/remove a class
            this.classList.toggle('sound-off', !soundEnabled);
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
