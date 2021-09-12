var canvas,
    ctx,
    count = 1000,
    circle = new Array(),
    interactionWindow = 100;

var mouse = {
  x: undefined,
  y: undefined
}

function Circle(x, y, r, hex, vDev){
  this.x = x < r ? x+r : x ;
  this.y = y < r ? y+r : y;
  this.r = 0;
  this.rr = 0;
  this.hex = hex;
  this.dx = vDev + (Math.random() - 0.5) * 5;
  this.dy = vDev + (Math.random() - 0.5) * 5;

  this.draw = function(){
    ctx.beginPath();
    ctx.strokeStyle = this.hex;
    ctx.fillStyle = this.hex;
    
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);  
    ctx.stroke();
    ctx.fill();
  }
  
  this.update = function(){
    // conditional settings
    if(this.x >= window.innerWidth - this.r || this.x - this.r <= 0) this.dx = -this.dx;
    if(this.y >= window.innerHeight-r || this.y - this.r <= 0) this.dy = -this.dy;

    // recurring update
    this.x += this.dx;
    this.y += this.dy;
    
    // interactivity
    if (mouse.x - this.x < interactionWindow && mouse.x - this.x > -interactionWindow && mouse.y - this.y < interactionWindow && mouse.y - this.y > -interactionWindow){
      this.r += 1; 
    }else if( this.r > this.rr  ){
      this.r -= 1;
    }
    
    // draw
    this.draw();
  }
  
  this.draw();
}



function _(elm){
  return document.querySelector(elm);
}

window.addEventListener('load', function(){
  // get canvas
  canvas = _("canvas");
  
  // resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  
  // initialize context
  ctx = canvas.getContext('2d');
  
  // initialize circles
  for(var i = 0; i< count ; i++){
      var r = Math.floor(Math.random() * 10),
          x = Math.random() * (window.innerWidth - r * 2),
          y = Math.random() * (window.innerHeight - r * 2);
      circle.push(new Circle(x, y, r, getRandomHex(), 5));
    }
  
  // retrieve mouse position
  window.addEventListener('mousemove', function(event){
    mouse.x = event.x;
    mouse.y = event.y;
  });
  
  // start animation
  animate();
});

function animate(){
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  circle.forEach(function(c){
    c.update();
  });
}

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function getRandomHex(){
  var hex = '#';
  for (var i = 0; i < 3; i++)
    hex += Math.floor(Math.random() * 255).toString(16)
  if(hex.length < 7) hex = pad(hex, 7, 0);
  return hex;
}

function pad(subject, length, token){
  while(subject.length < length){
    subject += token.toString();
  }
  return subject;
}
