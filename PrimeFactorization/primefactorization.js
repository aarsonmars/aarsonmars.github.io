function isPrime(n) {
    i = 2
    while (i * i < n) {
        if (n % i == 0) {
            return 0
        } else {
            i += 1
        }
    }
    return 1
}


function factorize(n) {
    factors = []
    divider = 2
    if (n < 2) {
        return []
    }

    while (n != 1) {
        if (n % divider == 0) {
            factors.push(divider)
            n = n / divider
        } else {
            while (true) {
                if (isPrime(divider + 1) == 1) {
                    divider += 1
                    break
                } else {
                    divider += 1
                }
            }
        }
    }
    return factors
}



function funt(e) {
    e.preventDefault();
    const results = document.querySelector('.results');
    results.innerHTML = '';
    const num = document.querySelector('input').value;
    const out = factorize(num);
    const h1t = document.createElement('h1');

    if (out.length < 1) {
        h1t.innerText = 'Not defined';
    } else if (out.length === 1) {
        h1t.innerHTML = 'Prime<br><span class="factors">&nbsp;</span>';
    } else {
        h1t.innerHTML = 'Composite<br><span class="factors">' 
             + out.join(' × ') + '</span>';
    }
    results.append(h1t);
}

document.querySelector('button').addEventListener('click', (e) => { funt(e) })
document.querySelector('input').addEventListener('input', (e) => {
    funt(e);
});