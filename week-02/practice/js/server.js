"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
http.createServer((request, response) => {
    console.log("request ...");
    console.log(request.headers);
    response.setHeader("Content-Type", "text/html");
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end(`<html lang="zh">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>👋你好呀！</title>
        <style>
            div p#greet {
                font-size: larger;
                background-color: bisque;
            }
    
            div p {
                border-radius: 5px;
                border: 2px solid dashed;
            }
        </style>
    </head>
    
    <body>
        <div>
            <p id="greet">你好</p>
            <p>你好呀！</p>
        </div>
    </body>
    
    </html>`);
}).listen(8088);
console.log("server started");
console.log("server on:\n http://localhost:8088");
