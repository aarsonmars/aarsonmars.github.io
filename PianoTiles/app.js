var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var canvasHeight = c.height;
var canvasWidth = c.width;
var width = canvasWidth / 4;

var totalTilesCount = 100;
var tileSpeed = 5;
var tiles = new Array();
var tileHeight = 350;
var mouse = { x: 0, y: 0, click: false };
var gameover=false;

class Tile {
  constructor(x = 0, y = 0, height = 350) {
    this.height = height;
    this.x = x;
    this.y = y;
  }
  draw() {
    ctx.beginPath();
    ctx.rect(this.x, this.y, width, this.height);
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
      tiles.shift();
      tileTapped = false;
    }
    // console.log(this.tileColor )
    
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
        console.log(x)
      x = (x==3)?2:x+1;
      console.log(x)
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
  if (
    ctx.getImageData(mouse.x, mouse.y, 1, 1).data[2] == 2 &&
    ctx.getImageData(mouse.x + 5, mouse.y + 5, 1, 1).data[2] == 2
  ) {
    tileTapped = true;
  }else{
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