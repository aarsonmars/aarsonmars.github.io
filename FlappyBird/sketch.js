var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var height = c.height;
// var height = innerHeight;

var width = c.width;
var pipeWidth = 50;
var middleGap = 180;
var x =  200;
var currentHeight = 150;
var pipeDistance = 200;
var speed = 5;
var tol = 0.001;
var gravity = 1;
var gameover = true;
var winner=false;
var level=1;
img= new Image()
img.src='./img/bird.png'

levelElement=document.getElementById('level');
levelElement.innerText=level;
[h,w]=[img.height,img.width];
let [sx,sy,sWidth,sHeight,dWidth,dHeight]=[0,0,h/3,w/5,60,60];

imageNo=0
class Ball {
  constructor(radius) {
    this.radius = radius;
    this.draw(25, 180);
  }
  draw(x, y) {
    this.clear();
    this.x = x;
    this.y = y;

    ctx.drawImage(img, sx, sHeight*imageNo, sWidth, sHeight, this.x, this.y, dWidth, dHeight)
    imageNo=0
    // if(imageNo>2){imageNo=2}else{imageNo++}

  }
  clear() {
    ctx.clearRect(
      this.x -tol,
      this.y -tol,
      dWidth+tol,
      dHeight+tol
    );
  }
}
const ball = new Ball(20);
window.onload=()=>{ball.draw(20,180)}

function startGame() {
  var e = setInterval(() => {
    if (gameover == false) {
      ball.draw(ball.x + speed / 10, ball.y + gravity);     
        if (
          ctx.getImageData(ball.x + dWidth+tol, ball.y -tol, 1, 1)
            .data[1] == 128 ||
          ctx.getImageData(ball.x + dWidth+tol, ball.y + dWidth+tol, 1, 1)
          .data[1] == 128 ||
          ctx.getImageData(ball.x -tol, ball.y-tol, 1, 1)
          .data[1] == 128||
          ctx.getImageData(ball.x -tol, ball.y + dWidth+tol, 1, 1)
          .data[1] == 128||
          ctx.getImageData(ball.x +dWidth/2, ball.y-tol, 1, 1)
          .data[1] == 128||
          ctx.getImageData(ball.x +dWidth/2, ball.y+ dWidth+tol, 1, 1)
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
        c.removeEventListener("click", clickGamePlay);
        document.removeEventListener('keyup',keyboardGameplay);
        ctx.fillText("Game Over", width/2-200, height/2);
        level=1
        levelElement.innerText=level
        middleGap=150
        pipeDistance=200
      }
      setTimeout(() => {
        ball.draw()
        ctx.clearRect(0,0,width,height)
        x=200  
        createPipes()
        ball.draw(25, 180);

        registerEventListener();
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

function keyboardGameplay(e){
    if (e.key==' '){
      c.click(); 
    }
}


function controlGamePlay(){
  imageNo=0
    
  if (!gameover){
    ball.clear();
    ball.y -= 50;
    // gsap.to(ball,{y:ball.y-50})
    if (ball.y <= ball.radius) {
      gameover = true;
    }}  
}

function clickGamePlay(){
  if (gameover){
    startGame()
    gameover=false
  }
  else{
    controlGamePlay();
  }
}

function registerEventListener(){  
  c.addEventListener("click", clickGamePlay);
  document.addEventListener('keyup',keyboardGameplay);
}
registerEventListener();



// ctx.getImageData(ball.x + ball.radius+tol+1, ball.y - ball.radius-tol-1, 1, 1)
// .data[1] == 128 ||
// ctx.getImageData(ball.x + ball.radius+tol+1, ball.y + ball.radius+tol+1, 1, 1)
// .data[1] == 128 ||
// ctx.getImageData(ball.x , ball.y - ball.radius-tol-1, 1, 1)
// .data[1] == 128||
// ctx.getImageData(ball.x , ball.y - ball.radius-tol-1, 1, 1)
// .data[1] == 128||
// ctx.getImageData(ball.x-ball.radius-1 , ball.y + ball.radius+tol+1, 1, 1)
// .data[1] == 128 ||
// ctx.getImageData(ball.x -ball.radius-1, ball.y - ball.radius-tol-1, 1, 1)
// .data[1] == 128        