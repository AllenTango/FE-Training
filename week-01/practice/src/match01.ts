function match(str: string): boolean {
    for (const c of str) {
        if (c === "c") {
            return true
        }
    }
    return false
}

console.log(match('abcd'));
console.log(match('abde'));