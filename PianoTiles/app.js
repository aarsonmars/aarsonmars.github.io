var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var canvasHeight = c.height;
var canvasWidth = c.width;
var width = canvasWidth / 4;

var totalTilesCount = 1000;
var tileSpeed = 10;
var tiles = new Array();
var tileHeight = 400;
var gameover=false;
var score=0;
var currentTileSpeed=tileSpeed;

class Tile {
  constructor(x = 0, y = 0, height = 350) {
    this.height = height;
    this.x = x;
    this.y = y;
  }
  draw() {
    ctx.beginPath();
    ctx.rect(this.x, this.y, width, this.height);
    ctx.font='50px Arial'

    ctx.fillStyle='rgb(0,0,2)'
    ctx.fillText(score, 10,50);
    ctx.fill();
  }
  update() {
    // if (this.y % (tileHeight*10) == 0) {
    //   currentTileSpeed += tileSpeed/totalTilesCount;
    // }
    if (this.y-c.height+tileHeight>0){
        gameover=true
    }

    if (tileTapped) {
      score+=1;
    //   ctx.filltext(score,5,5)  
      tiles=tiles.slice(1,tiles.length);
      tileTapped = false;
    }
    
    if (gameover) {      
      ctx.clearRect(0,0,canvasWidth,canvasHeight)
      // ctx.beginPath()
      // ctx.font='400px Arial'
      // ctx.fillStyle='rgb(250,0,2)'
      // ctx.fillText(score, c.width/2-100,c.height/2-100);
      finalScore();
      cancelAnimationFrame(animationRequest);
      createButton();
      // gameover=false;     
    }
    this.draw();
    this.y += currentTileSpeed;
  }
}

function generateTiles() {
  var previousVaule = 0;
  for (var i = 0; i < totalTilesCount; i++) {
    x = parseInt(Math.random() * 4);
    if (x == previousVaule) {
      x = (x==3)?2:x+1;
    }
    previousVaule = x;
    y = -tileHeight * i;
    height = tileHeight;
    tiles.push(new Tile(x * width, y, height));
  }
}
generateTiles();

var tileTapped = false;
c.addEventListener("click", function (event) {
  x = (event.offsetX * c.width) / c.offsetWidth;
  y = (event.offsetY * c.height) / c.offsetHeight;
  if (
    ctx.getImageData(x, y, 1, 1).data[2] == 2 &&
    ctx.getImageData(x + 5, y + 5, 1, 1).data[2] == 2
  ) {
    tileTapped = true;
  }else{
      gameover=true;
  }

});

function finalScore(){
  scoreDivText=document.createElement('div')
  scoreDivText.id='finalScoreText'
  scoreDivText.innerText='Your Score'
  document.querySelector('#container').append(scoreDivText)
  
  scoreDiv=document.createElement('div')
  scoreDiv.id='finalScore'
  scoreDiv.innerText=score
  document.querySelector('#container').append(scoreDiv)

}

function createButton(){
  rePlay=document.createElement('button')
  rePlay.id='rePlayButton'
  rePlay.innerText='Play\nAgain'
  document.querySelector('#container').append(rePlay)
  rePlay.addEventListener('click',()=>{location.reload()})
}

var animationRequest;
function animate() {
  
  animationRequest = requestAnimationFrame(animate);
  if (animationRequest%100==0){
    currentTileSpeed+=.015*currentTileSpeed
  }
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  tiles.forEach(function (c) {
    c.update();
  });
}
animate();

// var fc = new FpsCtrl(24, function(e) {
//     // animationRequest = requestAnimationFrame(animate);
//     ctx.clearRect(0, 0, canvasWidth, canvasHeight);
//     tiles.forEach(function (c) {
//       c.update();
//     });
// });
// fc.start()

