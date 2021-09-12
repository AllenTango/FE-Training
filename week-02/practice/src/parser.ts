const EOF:Symbol = Symbol("EOF");    // EOF: End of file State
let currentToken:Object = null;
let currentAttribute:Object = null;
let stack:Array = [{type: "document", children: []}]
let currentTextNode = null;

function emit(token:Object) {
    // if (token.type === "text") {
    //     console.log(token);
    //     return;
    // }

    let top = stack[stack.length - 1];
    if (token.type === "startTag") {
        let element = {
            type: "element",
            children: [],
            attributes: []
        };
        element.tagName = token.tagName;
        for (const p in token) {
            if (p != "type" || p != "tagName") {
                element.attributes.push({
                    name: p,
                    value: token[p]
                });
            }
        }
        top.children.push(element);
        // element.parent = top;

        if (!token.isSelfClosing) {
            stack.push(element)
        }
        
        currentTextNode = null;
    } else if (token.type === "endTag") {
        if (top.tagName != token.tagName) {
            throw new Error("Tag start end doesn't match!");
        } else {
            stack.pop();
        }
        currentTextNode = null;
    } else if (token.type === "text") {
        if (currentTextNode === null) {
            currentTextNode = {
                type: "text",
                content: ""
            }
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
}

function data(c:String|Symbol) {
    if (c === "<") {
        return tagOpen;
    } else if (c === EOF) {
        emit({
            type: "EOF"
        })
        return;
    } else {
        emit({
            type: "text",
            content: c
        })
        return data
    }
}

function tagOpen(c:String) {
    if (c === "/") {
        return endTagOpen;
    }else if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "startTag",
            tagName: ""
        }
        return tagName(c);
    }
    else {
        emit({
            type: "text",
            content: c
        })
        return;
    }
}

function endTagOpen(c:String|Symbol) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken= {
            type: "endTag",
            tagName: ""
        }
        return tagName(c);
    } else if (c === ">") {
        
    } else if (c === EOF) {
        
    } else {

    }
}

function tagName(c:String) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === "/") {
        return selfClosingStartTag;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c;
        return tagName;
    } else if (c === ">") {
        emit(currentToken);
        return data;
    } else {
        currentToken.tagName += c;
        return tagName;
    }
}

function beforeAttributeName(c:String) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === ">" || c === "/" || c === EOF) {
        return afterAttributeName(c);
    } else if (c === "=") {
        return beforeAttributeName;
    } else {
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c);
    }
}

function attributeName(c:String) {
    if (c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
        return afterAttributeName(c);
    } else if (c === "=") {
        return beforeAttributeValue;
    } else if (c === "\u0000") {
        
    } else if (c === "\"" || c === "'" || c === "<") {
        
    } else {
        currentAttribute.name += c;
        return attributeName;
    }
}


function afterAttributeName(c:String) {
    if (c.match(/^[\t\n\f ]$/)) {
        return afterAttributeName;
    } else if (c === "/") {
        return selfClosingStartTag;
    } else if (c === "=") {
        return beforeAttributeValue;
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === EOF) {
        
    } else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c);
    }
}

function selfClosingStartTag(c:String) {
    if (c === ">") {
        currentToken.isSelfClosing = true;
        emit(currentToken)
        return data;
    } else if (c === "EOF") {
        
    } else {

    }
}

function beforeAttributeValue(c:String) {
    if (c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
        return beforeAttributeValue;
    } else if(c === "\"") {
        return doubleQuotedAttributeValue;
    } else if (c === "\'") {
        return singleQuotedAttributeValue;
    } else if (c === ">") {
        // return data
    } else {
        return UnquotedAttributeValue(c);
    }
}

function afterQuotedAttributeValue(c:String) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === "/") {
        return selfClosingStartTag;
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === EOF) {
        
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function doubleQuotedAttributeValue(c:String) {
    if (c === "\"") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "\u0000") {
        
    } else if (c === EOF) {
        
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function singleQuotedAttributeValue(c:String) {
    if (c === "\'") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "\u0000") {
        
    } else if (c === EOF) {
        
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function UnquotedAttributeValue(c:String) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c === "/") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === "\u0000") {
        
    } else if (c === "\"" || c === "'" || c === "<" || c === "=" || c === "`") {
        
    } else if (c === EOF) {
        
    } else {
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}


export function parseHTML(html:String) {
    console.log(html);
    let state:Function = data;
    for (const c of html) {
        state = state(c);
    }
    state = state(EOF);
    console.log(stack[0]);
    return stack[0];
}
