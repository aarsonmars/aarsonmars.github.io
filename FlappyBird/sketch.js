var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var height = 400;
var width = 1000;
var pipeWidth = 50;
var middleGap = 150;
var x =  200;
var currentHeight = 150;
var pipeDistance = 200;
var speed = 5;
var tol = 0.001;
var gravity = 1;
var gameover = true;
var winner=false;
var level=1;

levelElement=document.getElementById('level')
levelElement.innerText=level

// ctx.beginPath();
// ctx.rect(x,0,pipeWidth,currentHeight);
// ctx.rect(x,currentHeight+middleGap,pipeWidth,height-currentHeight-middleGap);
// ctx.fillStyle='green';
// ctx.stroke();
// ctx.fill()

class Ball {
  constructor(radius) {
    this.radius = radius;
    this.draw(25, 180);
  }
  draw(x, y) {
    this.clear();
    this.x = x;
    this.y = y;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle='red'
    ctx.fill();
  }
  clear() {
    ctx.clearRect(
      this.x - this.radius - tol,
      this.y - this.radius - tol,
      2 * (tol + this.radius),
      2 * (tol + this.radius)
    );
  }
}
const ball = new Ball(20);

function checkCollison() {}

function startGame() {
  var e = setInterval(() => {
    if (gameover == false) {
      ball.draw(ball.x + speed / 10, ball.y + gravity);

     
        if (
        ctx.getImageData(ball.x + ball.radius+tol+1, ball.y - ball.radius-tol-1, 1, 1)
          .data[1] == 128 ||
        ctx.getImageData(ball.x + ball.radius+tol+1, ball.y + ball.radius+tol+1, 1, 1)
          .data[1] == 128 ||
          ctx.getImageData(ball.x , ball.y - ball.radius-tol-1, 1, 1)
          .data[1] == 128||
          ctx.getImageData(ball.x , ball.y - ball.radius-tol-1, 1, 1)
          .data[1] == 128||
          ctx.getImageData(ball.x-ball.radius-1 , ball.y + ball.radius+tol+1, 1, 1)
          .data[1] == 128 ||
          ctx.getImageData(ball.x -ball.radius-1, ball.y - ball.radius-tol-1, 1, 1)
          .data[1] == 128
                   
      ) {
        gameover = true;
      }

      if (ball.y > height - ball.radius) {
        gameover = true;
      }
      if (ball.x+ball.radius+5>width) {
        winner=true;
        gameover=true;
        level+=1
        levelElement.innerText=level
        middleGap-=5
        pipeDistance-=10

      }



      score=document.getElementById('score')
      score.innerText='Score: '+ parseInt(ball.x/250)        
    }
    // if((ball.x+ball.radius)%100 <= 50){
    else {
      clearInterval(e);
      // ball.clear()
      ctx.font = "100px Arial";
      levelElement.innerText=level      
      if (winner){
        ctx.fillText("Winner", width/2-200, height/2);  
        winner=false;
      }
      else{
        ctx.fillText("Game Over", width/2-200, height/2);
        level=1
      }
      setTimeout(() => {
        ball.draw(25, 180);
        ctx.clearRect(0,0,width,height)
        x=200  
        createPipes()
        ball.draw(25, 180); 
      }, 2000);     

    }
  }, 5);
}

function createPipes() {
  while(x<width){ 
  var currentHeight = Math.random() * 200 +50;
  ctx.beginPath();
  ctx.rect(x, 0, pipeWidth, currentHeight);
  
  ctx.rect(
    x,
    currentHeight + middleGap,
    pipeWidth,
    height - currentHeight - middleGap
  );
  ctx.fillStyle = "green";
  ctx.stroke();
  ctx.fill();
  x = x + pipeDistance;
    }}


  createPipes();


document.addEventListener("keyup", (e) => {
  if (e.key == " ") {
    if (gameover) {
      gameover = false;
      startGame();
    } else {
      ball.clear();
      ball.y -= 50;
      if (ball.y <= ball.radius) {
        gameover = true;
      }
    }
  }
});
