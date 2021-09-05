function isPrime(num) {
    for(var i = 2; i < num; i++)
      if(num % i === 0) return false;
    return num > 1;
    
  }

function funt(e){
    outputboxx=document.querySelector('h1')
    outputboxx&&outputboxx.remove();
    e.preventDefault();
    num = document.querySelector('input').value;
    out=isPrime(num)?'Prime':'Composite';
    h1t=document.createElement('h1')
    h1t.innerText=out;
    document.body.append(h1t)
}

document.querySelector('button').addEventListener('click',(e)=>{funt(e)})