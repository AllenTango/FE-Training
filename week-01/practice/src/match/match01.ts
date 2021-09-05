function match01(str: string): boolean {
    for (const c of str) {
        if (c === "c") {
            return true
        }
    }
    return false
}

console.log(match01('abcd'));
console.log(match01('abde'));