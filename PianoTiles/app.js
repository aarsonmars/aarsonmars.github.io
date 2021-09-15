var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var canvasHeight = c.height;
var canvasWidth = c.width;
var width = canvasWidth / 4;

var totalTilesCount = 50;
var tileSpeed = 10;
var tiles = new Array();
var tileHeight = 400;
var gameover=false;
var score=0;
var currentTileSpeed=tileSpeed;
var tileRefreshRate=50;

class Tile {
  constructor(x = 0, y = 0, height = 350) {
    this.height = height;
    this.x = x;
    this.y = y;
  }
  draw() {
    ctx.beginPath();
    ctx.rect(this.x, this.y, width, this.height);
    // ctx.font='50px Arial'

    ctx.fillStyle='rgb(0,0,2)'
    // ctx.fillText(score, 10,50);
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
      updateScore.innerText=score
    //   ctx.filltext(score,5,5)  
      tiles=tiles.slice(1,tiles.length);
      tileTapped = false;
    }
    
    if (gameover) {      
      ctx.clearRect(0,0,canvasWidth,canvasHeight)      
      cancelAnimationFrame(animationRequest);
      document.querySelector('#finalScoreText') || finalScore();
      document.querySelector('#rePlayButton') || createButton();
      // gameover=false;     
    }
    this.draw();
    this.y += currentTileSpeed;
  }
}

function generateTiles(noOfTiles,tileGap=0) {
  var previousVaule = 0;
  for (var i = 0; i < noOfTiles; i++) {
    x = parseInt(Math.random() * 4);
    if (x == previousVaule) {
      x = (x==3)?2:x+1;
    }
    previousVaule = x;
    y = -tileHeight * i-tileHeight*tileGap;
    tiles.push(new Tile(x * width, y, tileHeight));
  }    console.log(tiles)

}
generateTiles(tileRefreshRate);

var tileTapped = false;
c.addEventListener("click", function (event) {
  x = (event.offsetX * c.width) / c.offsetWidth;
  y = (event.offsetY * c.height) / c.offsetHeight;
  // console.log(ctx.getImageData(x, y, 1, 1).data)
  if (
    ctx.getImageData(x, y, 1, 1).data[2] == 2 &&
    ctx.getImageData(x + 5, y + 5, 1, 1).data[2] == 2
  ) {
    tileTapped = true;
  }else{
      gameover=true;
  }

});

 var  updateScore=document.createElement('div')
  updateScore.id='updateScore'
  updateScore.innerText=score
  document.querySelector('#container').append(updateScore)


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
    currentTileSpeed+=.25
  }
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  tiles.slice(0,tileRefreshRate).forEach(function (c) {
    c.update();
    if (tiles.length==0){
      generateTiles(tileRefreshRate,tileGap=2)
    }
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

