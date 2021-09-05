"use strict";
function match02(str) {
    let foundA = false;
    for (const c of str) {
        if (c === "a") {
            foundA = true;
        }
        else if (foundA && c == "b") {
            return true;
        }
        else {
            foundA = false;
        }
    }
    return false;
}
console.log(match02('abcd'));
console.log(match02('adefe'));
