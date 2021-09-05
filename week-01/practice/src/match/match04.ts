function match04(str:string): boolean {
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
    if(c === "d")
        return foundD;
    else
        return start(c);
}

function foundD(c:string):Function {
    if(c === "e")
        return foundE;
    else
        return start(c);
}

function foundE(c:string):Function {
    if(c === "f")
        return end;
    else
        return start(c);
}

console.log(match04("i mabcdefgroot"));