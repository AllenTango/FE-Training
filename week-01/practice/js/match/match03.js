"use strict";
function match03(str) {
    let foundA, foundB, foundC, foundD, foundE;
    foundA = foundB = foundC = foundD = foundE = false;
    for (const c of str) {
        if (c === "a") {
            foundA = true;
        }
        else if (foundA && c === "b") {
            foundB = true;
        }
        else if (foundB && c === "c") {
            foundC = true;
        }
        else if (foundC && c === "d") {
            foundD = true;
        }
        else if (foundD && c === "e") {
            foundE = true;
        }
        else if (foundE && c === "f") {
            return true;
        }
        else {
            foundA = foundB = foundC = foundD = foundE = false;
        }
    }
    return false;
}
console.log(match03('abcd'));
console.log(match03('adefe'));
console.log(match03('abcdef'));
