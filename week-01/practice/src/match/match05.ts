function match05(str:string): boolean {
    let state:Function = start;
    for (const c of str) {
        state = state(c);
    }
    return state === end;
}

function start(c:string):Function {
    if(c === "a")
        return foundA;
    else
        return start;
}

function end(c:string):Function {
    return end;
}

function foundA(c:string):Function {
    if(c === "b")
        return foundB;
    else
        return start(c);
}

function foundB(c:string):Function {
    if(c === "c")
        return foundC;
    else
        return start(c);
}

function foundC(c:string):Function {
    if(c === "a")
        return foundA2;
    else
        return start(c)
}

function foundA2(c:string):Function {
    if(c === "b")
        return foundB2;
    else
        return start(c);
}

function foundB2(c:string):Function {
    if(c === "x")
        return end;
    else
        return foundB(c);
}


console.log(match05("abyabcabx"));