// var canvas = document.getElementById("myCanvas");
// var ctx = canvas.getContext("2d");
var shuffleLimit = 10


const wordList=['WATERMELON','APPLE','CHERRY','ORANGE','PEAR','STRAWBERRY','GRAPE','PLUM','MANGO','LUX']
// words.sort((a,b)=>b.length-a.length)
totalWords=wordList.length
totalLetters=wordList.join('').length

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }



class Letter
{
    constructor(letter,x=0,y=0,direction='x+',connection=0,word){
        this.letter=letter;
        this.x=x;
        this.y=y;
        this.direction=direction;
        this.connection=connection
        this.word=word
    }
}

var words=shuffle(wordList.slice())
for(shuffleCount=0;shuffleCount<shuffleLimit;shuffleCount++)
{
    var letterlist=[]
    for(i=0;i<words[0].length;i++){
        letterlist.push(new Letter(words[0][i],0,i,'y+',0,words[0]))
    }
    var brk=false;bk=false;
    for(i=1;i<words.length;i++) //into words
    {
        for(j=0;j<words[i].length;j++) //into letters
        {   
            // for (k=0;k<letterlist.length;k++)
            for (k=letterlist.length-1;k>=0;k--) //into letterlist
                {
                    var lk=letterlist[k]
                if (words[i][j]==lk.letter&& lk.connection==0){                    
                    if(k!=letterlist.length-1&&letterlist[k+1].connection==1&&letterlist[k+1].direction==lk.direction){continue}
                    if(k!=0&&letterlist[k-1].connection==1&&letterlist[k-1].direction==lk.direction){continue}
                    var ll=[]
                    for(m=0;m<words[i].length;m++){
                        var c=0
                        if(m==j){var c=lk.connection+1;lk.connection+=1}
                        
                        if (lk.direction=='y+'){
                            letterlist.forEach(function(l) {if(m-j+lk.x==l.x&&  lk.y==l.y&&c==0){ll=[];bk=true;}})                            
                            ll.push(new Letter(words[i][m],m-j+lk.x,lk.y,'x+',c,words[i]))
                        }
                        else{
                            letterlist.forEach(function(l) {if(m-j+lk.y==l.y&&lk.x==l.x&&c==0){ll=[];bk=true;}})
                            ll.push(new Letter(words[i][m],lk.x,m-j+lk.y,'y+',c,words[i]))
                        }if (bk){bk=false;ll=[];break;}
                    }letterlist.push(...ll);brk=ll.length;break;
                    } 
                }if (brk){brk=false;break;}
        }if(brk===0){words.push(words[i])}
        if(i==10){break;}
    }
    if (letterlist.length==totalLetters){break}
    else{words=shuffle(wordList.slice())}  
}


alphabet = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
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
        
        inputField.style.left=50-maxLx*50+this.x*50+'px'
        inputField.style.top =50-maxLy*50+ this.y*50+'px'
        inputField.maxLength='1'
        this.parent.appendChild(inputField)
        inputField.value =this.letter.letter
        inputField.addEventListener('input',(e)=>{
            if(this.letter.letter==e.target.value.toUpperCase()){
                this.inputField.style.color='green'
            }else{
                navigator.vibrate(50)
                this.inputField.style.color='red'   
            }
        })
        inputField.onwheel=(event)=>{
            event.preventDefault()
            var x=event.target.value
            var index=alphabet.indexOf(x)
            if (event.deltaY < 0)
            {
                inputField.value=alphabet[Math.max(index-1,0)]
            }
            else if (event.deltaY > 0)
            {
                inputField.value=alphabet[Math.min(25,index+1)]
            }  
        }
        this.inputField=inputField
    }
}

var lx=[]
var ly=[]
letterlist.forEach(function(l) {lx.push(l.x)})
letterlist.forEach(function(l) {ly.push(l.y)})
maxLx=Math.min(...lx);maxLy=Math.min(...ly)
var main=document.getElementById('mainContainer')
var InputFieldList=[]
for(i=0;i<letterlist.length;i++){
    l=letterlist[i]
    // if (!l.connection){
        // ctx.fillRect(l.x*50+140,l.y*50+110,50,50)
    // ctx.strokeText(l.letter,l.x*50+150,l.y*50+250);}
    InputFieldList.push(new InputField(main,l,l.x,l.y))
}



// console.log(letterlist)