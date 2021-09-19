import layout from "./layout";
const EOF:Symbol = Symbol("EOF");    // EOF: End of file State
let currentToken:Object = null;
let currentAttribute:Object = null;
let stack:Array = [{type: "document", children: []}]
let currentTextNode = null;

import * as css from "css";
// css 规则
let rules:Array = [];

function addCSSRules(text:String) {
    let ast = css.parse(text);
    console.log(JSON.stringify(ast, null, "    "));
    rules.push(...ast.stylesheet?.rules);
}

function match(element, selector) {
    if (!selector || !element.attributes) {
        return false;
    }
    if (selector.charAt(0) == "#") {
        let attr = element.attributes.filter(attr => attr.name === "id")[0]
        if (attr && attr.value === selector.replace("#", "")) {
            return true;
        }
    } else if (selector.charAt(0) == ".") {
        let attr = element.attributes.filter(attr => attr.name === "class")[0]
        if (attr && attr.value === selector.replace(".", "")) {
            return true;
        }
    } else {
        if (element.tagName === selector) {
            return true;
        }
    }

    return false
}

function specificity(selector) {
    let p = [0, 0, 0, 0];
    let selectorParts = selector.split(" ");
    for (const part of selectorParts) {
        if (part.charAt(0) === "#") {
            p[1] += 1;
        } else if (part.charAt(0) === ".") {
            p[2] += 1;
        } else {
            p[3] += 1;
        }
    }
    return p;
}

function compare(sp1, sp2) {
    if (sp1[0] - sp2[0]) {
        return sp1[0] - sp2[0];
    }
    if (sp1[1] - sp2[1]) {
        return sp1[1] - sp2[1];
    }
    if (sp1[2] - sp2[2]) {
        return sp1[2] - sp2[2];
    }
    return sp1[3] - sp2[3];
}

function computeCSS(element:String) {
    let elements = stack.slice().reverse();
    console.log(rules);
    console.log("计算 元素 CSS", element);
    if (!element.computedStyle) {
        element.computedStyle = {};
    }

    for (const rule of rules) {
        let selectorParts = rule.selectors[0].split(" ").reverse();

        if (!match(element, selectorParts[0])) {
            continue;
        }

        let matched = false;

        let j = 1;
        for (let i = 0; i < elements.length; i++) {
            if (match(elements[i], selectorParts[j])) {
                j++;
            }
        }
        if (j >= selectorPasrts.length) {
            matched = true;
        }
        if (matched) {
            let sp = specificity(rule.selectors[0]);

            console.log("元素", element, "匹配到规则", rule);
            let computedStyle = element.computedStyle;
            for (const declaration of rule.declarations) {
                if (!computedStyle[declaration.property]) {
                    computedStyle[declaration.property] = {};
                }
                if (!computedStyle[declaration.property].specificity) {
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                } else if (compare(computedStyle[declaration.property].specificity, sp) < 0) {
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                }
            }
            console.log(element.computedStyle);
        }
    }
}

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
        computeCSS(element);
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
            // 遇到style标签时，执行css规则操作
            if (top.tagName === "style") {
                addCSSRules(top.children[0].content);
            }
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
