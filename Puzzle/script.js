var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");



var words=['APPLE','WATERMELON','CHERRY','ORANGE','PEAR','STRAWBERRY','GRAPE','PLUM','MANGO']
words.sort((a,b)=>b.length-a.length)
class Letter
{
    constructor(letter,x=0,y=0,direction='x+',connection=0){
        this.letter=letter;
        this.x=x;
        this.y=y;
        this.direction=direction;
        this.connection=connection
    }
}

var letterlist=[]
for(i=0;i<words[0].length;i++){
    letterlist.push(new Letter(words[0][i],0,i,'y+',0))
}
var brk=false;bk=false;
for(i=1;i<words.length;i++)
{
    for(j=0;j<words[i].length;j++)
    {
        // for (k=0;k<letterlist.length;k++)
        for (k=letterlist.length-1;k>=0;k--)
            {
                var lk=letterlist[k]
                if (words[i][j]==lk.letter&& lk.connection==0){
                    
                    var ll=[]
                    for(m=0;m<words[i].length;m++){
                        var c=0
                        if(m==j){var c=lk.connection+1}
                        
                        if (lk.direction=='y+'){
                            letterlist.forEach(function(l) {if(m-j+lk.x==l.x&&lk.y==l.y&&c==0){ll=[];bk=true;}})                            
                            ll.push(new Letter(words[i][m],m-j+lk.x,lk.y,'x+',c))
                        }
                        else{
                            letterlist.forEach(function(l) {if(m-j+lk.y==l.y&&lk.x==l.x&&c==0){ll=[];bk=true;}})
                            ll.push(new Letter(words[i][m],lk.x,m-j+lk.y,'y+',c))
                        }if (bk){bk=false;ll=[];break;}
                }letterlist.push(...ll);brk=ll.length;break;
            } 
        }if (brk){brk=false;break;}
    }
}  

class InputField
{
    constructor(parent,letter,x=0,y=0){
        this.parent=parent;
        this.letter=letter;
        this.x=x;
        this.y=y;
        this.drawField()
    }
    drawField(){
        var inputField=document.createElement('input')
        inputField.style.position='absolute'
        
        inputField.style.left=200+this.x*50+'px'
        inputField.style.top=this.y*50+50+'px'
        inputField.maxLength='1'
        this.parent.appendChild(inputField)
        inputField.addEventListener('input',(e)=>{
            console.log(this.letter.letter==e.target.value.toUpperCase())
            if(this.letter.letter==e.target.value.toUpperCase()){
                this.inputField.style.color='green'
            }else{console.log(11)
                navigator.vibrate(50)
                this.inputField.style.color='red'   
            }
        })
        this.inputField=inputField
    }
}
ctx.font = "30px sans-serif";
ctx.fillStyle='rgb(240,240,230)'
ctx.strokeText('Fruits Puzzle',100,30)
var main=document.getElementById('mainContainer')
var InputFieldList=[]
for(i=0;i<letterlist.length;i++){
    l=letterlist[i]
    if (!l.connection){
        // ctx.fillRect(l.x*50+140,l.y*50+110,50,50)
    // ctx.strokeText(l.letter,l.x*50+150,l.y*50+250);}
    InputFieldList.push(new InputField(main,l,l.x,l.y))
}}
