import * as http from "http";

http.createServer((request, response) => {
    let body = [];
    request.on('error', (error) => {
        console.error(error);
    }).on("data", (chunk) => {
        // body.push(chunk.toString()); // 此方法在Node14.17.5 可以正常执行
        body.push(chunk)
    }).on("end", () => {
        // body = Buffer.concat(body).toString();
        body = Buffer.concat([Buffer.from(body.toString())]).toString();
        console.log(body);
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(" Hello World\n");
    });
}).listen(8088);

console.log("server started");
console.log("server on:\n http://localhost:8088");