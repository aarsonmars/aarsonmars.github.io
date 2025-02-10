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

function initializeVariables(){
  tiles = [];
  score = 0;
  currentTileSpeed = tileSpeed;
  updateScore.innerText=score
}


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
    new Audio('./sound/beep2.mp3').play(); // Play tap sound on valid tile press
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
    ctx.fillStyle="rgba(255,255,255,0.9)"
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    // ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    document.querySelector("#finalScoreText") || finalScore();
    document.querySelector("#rePlayButton") || createButton();
  }

function startGame() {
  removeElement("#rePlayButton");
  removeElement("#finalScore");
  removeElement("#finalScoreText");

  initializeVariables()
  generateTiles(tileRefreshRate);
  animate();
}

// var fc = new FpsCtrl(24, function(e) {
//     // animationRequest = requestAnimationFrame(animate);
//     ctx.clearRect(0, 0, canvasWidth, canvasHeight);
//     tiles.forEach(function (c) {
//       c.update();
//     });
// });
// fc.start()
