
def check(n):
    i=2
    while i*i<n:
        if n%i==0:
            return 0
        else:
            i+=1    
    return 1

factors=[]
def factorize(n):
    divider=2
    while (n!=1):
        if n%divider==0:
            factors.append(divider)
            n=int(n/divider) 
        else:
            while True:
                if check(divider+1)==1:
                    divider+=1
                    break
                else:
                    divider+=1    
factorize(2310)
print(factors)
for i in factors[0:-1]:
    print(str(i)+' x ',end='') 
print(factors[-1])                  