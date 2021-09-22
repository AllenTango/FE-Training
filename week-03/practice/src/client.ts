import images = require("images");
import * as net from "net";
import * as parser from "./parser";
import render from "./render";


class Request {
    constructor(options) {
        this.method = options.method || "GET";
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || "/";
        this.body = options.body || {};
        this.headers = options.headers || {};

        if (!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        if (this.headers["Content-Type"] === "application/json") {
            this.bodyText = JSON.stringify(this.body);
        } else if (this.headers["Content-Type"] === "application/x-www-form-urlencoded") {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent}`)
        }

        this.headers["Content-Length"] = this.bodyText.length;
    }

    send(connection):Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const parser = new ResponseParser;
            if (connection) {
                connection.write(this.toString());
            } else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    connection.write(this.toString());
                })
            }

            connection.on("data", (data) => {
                console.log(data.toString());
                parser.receive(data.toString());
                console.log(parser.isFinished); // isFinished 有问题
                if (parser.isFinished) {
                    resolve(parser.response);
                    connection.end();
                }
            });
            connection.on("error", (error) => {
                reject(error);
                connection.end();
            })
        })
    }

    // 请求头以及toString 方法格式不对时，只会得到400 Bad Request
    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r\n${Object.keys(this.headers)
            .map((key) => `${key}: ${this.headers[key]}`)
            .join("\r\n")}\r\n\r\n${this.bodyText}`
    }
}


class ResponseParser {
    constructor() {
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7;

        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyParser = null;
    }

    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished;
    }

    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyPaser.content.join("")
        }
    }

    receive(str) {
        for (let i = 0; i < str.length; i++) {
            this.receiveChar(str.charAt(i));
        }
    }

    receiveChar(char) {
        if (this.current === this.WAITING_STATUS_LINE) {
            if (char === "\r") {
                this.current = this.WAITING_STATUS_LINE_END;
            } else {
                this.statusLine += char;
            }
        } else if (this.current === this.WAITING_STATUS_LINE_END) {
            if (char === "\n") {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_NAME) {
            if (char === ":") {
                this.current = this.WAITING_HEADER_SPACE;
            } else if(char === "\r") {
                this.current = this.WAITING_HEADER_BLOCK_END;
                if (this.headers["Transfer-Encoding"] === "chunked") {
                    this.bodyParser = new TrunkedBodyParser();
                }
            } else {
                this.headerName += char;
            }
        } else if (this.current === this.WAITING_HEADER_SPACE) {
            if (char === " ") {
                this.current = this.WAITING_HEADER_VALUE;
            }
        } else if (this.current === this.WAITING_HEADER_VALUE) {
            if (char === "\r") {
                this.current = this.WAITING_HEADER_LINE_END;
                this.headers[this.headerName] = this.headerValue;
                this.headerName = "";
                this.headerValue = "";
            } else {
                this.headerValue += char;
            }
        } else if (this.current === this.WAITING_HEADER_LINE_END) {
            if (char === "\n") {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_BLOCK_END) {
            if (char === "\n") {
                this.current = this.WAITING_BODY;
            }
        } else if (this.current === this.WAITING_BODY) {
            // console.log(char)
            this.bodyParser.receiveChar(char);
        }
    }
}


class TrunkedBodyParser {
    constructor() {
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_TRUNK = 2;
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinished = false;
        this.current = this.WAITING_LENGTH;
    }

    receiveChar(char) {
        if (this.current === this.WAITING_LENGTH) {
            if(char === "\r") {
                if (this.length === 0) {
                    this.isFinished = true;
                }
                this.current = this.WAITING_LENGTH_LINE_END;
            } else {
                this.length *= 16;
                this.length += parseInt(char, 16);
            }
        } else if (this.current === this.WAITING_LENGTH_LINE_END) {
            if (char === "\n") {
                this.current = this.READING_TRUNK;
            }
        } else if (this.current === this.READING_TRUNK) {
            if (this.length) {
                this.content.push(char);
                this.length--;
            }
            if (this.length === 0) {
                this.current = this.WAITING_NEW_LINE;
            }
        } else if (this.current === this.WAITING_NEW_LINE) {
            if (char === "\r") {
                this.current = this.WAITING_NEW_LINE_END;
            }
        } else if (this.current === this.WAITING_NEW_LINE_END) {
            if (char === "\n") {
                this.current = this.WAITING_LENGTH;
            }
        }
    }
}


// 立即执行函数
void async function() {
    let request = new Request({
        method: "POST",
        // host: "localhost",
        host: "127.0.0.1",
        port: "8088",
        path: "/",
        headers: {
            ["X-Client"]: "customed",
            ["Content-Type"]: "application/json"
        },
        body: {
            name: "AllenTango"
        }
    })

    let response = await request.send();
    console.log(response)

    // 解析HTML
    let dom = parser.parseHTML(response.body);
    let viewport = images(800, 600);
    render(viewport, dom)
    viewport.save('result.jpg')
}();