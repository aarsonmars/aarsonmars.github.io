function isPrime(n) {
    i=2
    while (i*i<n){
        if (n%i==0){
        return 0}
      else{
          i+=1   } }
    return 1
    
  }


function factorize(n){
  factors=[]
  divider=2
  if (n<2){
    return []
  }
  
  while(n!=1){
    if (n%divider==0){
      factors.push(divider)
      n=n/divider
    }
    else{
      while (true){
        if (isPrime(divider+1)==1){
          divider+=1
          break
        }
        else{
          divider+=1
        }
      }
    }
  }
  return factors
}



function funt(e){
    e.preventDefault();
    ['h1','h3'].forEach((x)=>{outputboxx=document.querySelector(x);
    outputboxx&&outputboxx.remove();})
    num = document.querySelector('input').value;
    out=factorize(num)
    h1t=document.createElement('h1');
    h3t=document.createElement('h3');

    if (out.length<1){
      h1t.innerText = 'Not defined'
    }
    else if (out.length==1){
      h1t.innerText=num + ' is '+  'Prime'
    }
    else{
      h1t.innerText='Composite'
      fac=out.join(' × ')
      h3t.innerText= num + " = "+fac
    }
    
    document.body.append(h1t)
    document.body.append(h3t)
}

document.querySelector('button').addEventListener('click',(e)=>{funt(e)})