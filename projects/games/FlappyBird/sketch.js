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

// Create a fallback in case the image doesn't load
img.onerror = function() {
  console.log("Bird image failed to load, using placeholder");
  if (window.placeholderImages && window.placeholderImages.bird) {
    img.src = window.placeholderImages.bird;
  }
};

// Support for mobile devices - smoother tap response
var lastTapTime = 0;
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

levelElement=document.getElementById('level');
levelElement.innerText=level;
[h,w]=[img.height || 100,img.width || 100]; // Add fallback values
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

    try {
      ctx.drawImage(img, sx, sHeight*imageNo, sWidth, sHeight, this.x, this.y, dWidth, dHeight);
    } catch(e) {
      // Fallback if image drawing fails
      console.error("Error drawing bird image:", e);
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(this.x + dWidth/2, this.y + dHeight/2, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
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
        
        // Show game over screen on mobile
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
          gameOverScreen.classList.remove('hidden');
        }
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
  // Clear any existing pipes first
  ctx.clearRect(0, 0, width, height);
  x = 200; // Reset pipe position
  
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
  }
}

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
  // On mobile, prevent too rapid tapping
  if (isMobile) {
    const now = Date.now();
    if (now - lastTapTime < 300) { // 300ms debounce
      return;
    }
    lastTapTime = now;
  }
  
  if (gameover){
    // Hide any UI screens
    const startScreen = document.getElementById('startScreen');
    if (startScreen) startScreen.classList.add('hidden');
    
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    
    startGame();
    gameover=false;
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

// Make important functions globally available for mobile-controls.js
window.createPipes = createPipes;
window.clickGamePlay = clickGamePlay;
window.controlGamePlay = controlGamePlay;