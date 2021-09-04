"use strict";
function match(str) {
    for (const c of str) {
        if (c === "c") {
            return true;
        }
    }
    return false;
}
console.log(match('abcd'));
console.log(match('abde'));
