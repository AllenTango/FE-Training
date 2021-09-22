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
        #container {
            width: 500px;
            height: 500px;
            display: flex;
            background: rgb(255, 255, 255);
        }
        #container #greet {
            width: 150px;
            height: 200px;
            font-size: larger;
            background-color: bisque;
        }

        #container .c1 {
            flex: 1;
            border-radius: 5px;
            border: 2px solid dashed;
        }
        </style>
    </head>
    
    <body>
        <div id="container">
            <div id="greet">你好</div>
            <div class="c1">你好呀！</div>
        </div>
    </body>
    
    </html>`);
}).listen(8088);
console.log("server started");
console.log("server on:\n http://localhost:8088");
