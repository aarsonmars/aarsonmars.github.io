var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var canvasHeight = c.height;
var canvasWidth = c.width;
var width = canvasWidth / 4;

var totalTilesCount = 100;
var tileSpeed = 1;
var tiles = new Array();
var tileHeight = 350;
var mouse = { x: 0, y: 0, click: false };
var gameover=false;
var score=0;

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
    if (this.y % 3500 == 0) {
      tileSpeed += .5;
    }
    if (this.y-1250>0){
        gameover=true
    }
    if (tileTapped) {
      score+=1;
    //   ctx.filltext(score,5,5)  
      tiles.shift();
      tileTapped = false;
    }
    
    if (gameover) {
      cancelAnimationFrame(animationRequest);
    }
    this.draw();
    this.y += tileSpeed;
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
    y = -350 * i;
    height = tileHeight;
    tiles.push(new Tile(x * width, y, height));
  }
}
generateTiles();

var tileTapped = false;
c.addEventListener("click", function (event) {
  mouse.x = (event.offsetX * c.width) / c.offsetWidth;
  mouse.y = (event.offsetY * c.height) / c.offsetHeight;
  console.log(mouse.x,mouse.y,ctx.getImageData(mouse.x, mouse.y, 1, 1).data)
  if (
    ctx.getImageData(mouse.x, mouse.y, 1, 1).data[2] == 2 &&
    ctx.getImageData(mouse.x + 5, mouse.y + 5, 1, 1).data[2] == 2
  ) {
    tileTapped = true;
  }else{
      console.log('dfd')
      gameover=true;
  }

  // console.log(event.x,event.y)
});

var animationRequest;
function animate() {
  animationRequest = requestAnimationFrame(animate);
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