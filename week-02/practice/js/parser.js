"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHTML = void 0;
const EOF = Symbol("EOF");
let currentToken = null;
let currentAttribute = null;
let stack = [{ type: "document", children: [] }];
let currentTextNode = null;
const css = require("css");
let rules = [];
function addCSSRules(text) {
    var _a;
    let ast = css.parse(text);
    console.log(JSON.stringify(ast, null, "    "));
    rules.push(...(_a = ast.stylesheet) === null || _a === void 0 ? void 0 : _a.rules);
}
function match(element, selector) {
    if (!selector || !element.attributes) {
        return false;
    }
    if (selector.charAt(0) == "#") {
        let attr = element.attributes.filter(attr => attr.name === "id")[0];
        if (attr && attr.value === selector.replace("#", "")) {
            return true;
        }
    }
    else if (selector.charAt(0) == ".") {
        let attr = element.attributes.filter(attr => attr.name === "class")[0];
        if (attr && attr.value === selector.replace(".", "")) {
            return true;
        }
    }
    else {
        if (element.tagName === selector) {
            return true;
        }
    }
    return false;
}
function specificity(selector) {
    let p = [0, 0, 0, 0];
    let selectorParts = selector.split(" ");
    for (const part of selectorParts) {
        if (part.charAt(0) === "#") {
            p[1] += 1;
        }
        else if (part.charAt(0) === ".") {
            p[2] += 1;
        }
        else {
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
function computeCSS(element) {
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
                }
                else if (compare(computedStyle[declaration.property].specificity, sp) < 0) {
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                }
            }
            console.log(element.computedStyle);
        }
    }
}
function emit(token) {
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
        if (!token.isSelfClosing) {
            stack.push(element);
        }
        currentTextNode = null;
    }
    else if (token.type === "endTag") {
        if (top.tagName != token.tagName) {
            throw new Error("Tag start end doesn't match!");
        }
        else {
            if (top.tagName === "style") {
                addCSSRules(top.children[0].content);
            }
            stack.pop();
        }
        currentTextNode = null;
    }
    else if (token.type === "text") {
        if (currentTextNode === null) {
            currentTextNode = {
                type: "text",
                content: ""
            };
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
}
function data(c) {
    if (c === "<") {
        return tagOpen;
    }
    else if (c === EOF) {
        emit({
            type: "EOF"
        });
        return;
    }
    else {
        emit({
            type: "text",
            content: c
        });
        return data;
    }
}
function tagOpen(c) {
    if (c === "/") {
        return endTagOpen;
    }
    else if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "startTag",
            tagName: ""
        };
        return tagName(c);
    }
    else {
        emit({
            type: "text",
            content: c
        });
        return;
    }
}
function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "endTag",
            tagName: ""
        };
        return tagName(c);
    }
    else if (c === ">") {
    }
    else if (c === EOF) {
    }
    else {
    }
}
function tagName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    }
    else if (c === "/") {
        return selfClosingStartTag;
    }
    else if (c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c;
        return tagName;
    }
    else if (c === ">") {
        emit(currentToken);
        return data;
    }
    else {
        currentToken.tagName += c;
        return tagName;
    }
}
function beforeAttributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    }
    else if (c === ">" || c === "/" || c === EOF) {
        return afterAttributeName(c);
    }
    else if (c === "=") {
        return beforeAttributeName;
    }
    else {
        currentAttribute = {
            name: "",
            value: ""
        };
        return attributeName(c);
    }
}
function attributeName(c) {
    if (c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
        return afterAttributeName(c);
    }
    else if (c === "=") {
        return beforeAttributeValue;
    }
    else if (c === "\u0000") {
    }
    else if (c === "\"" || c === "'" || c === "<") {
    }
    else {
        currentAttribute.name += c;
        return attributeName;
    }
}
function afterAttributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return afterAttributeName;
    }
    else if (c === "/") {
        return selfClosingStartTag;
    }
    else if (c === "=") {
        return beforeAttributeValue;
    }
    else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }
    else if (c === EOF) {
    }
    else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: "",
            value: ""
        };
        return attributeName(c);
    }
}
function selfClosingStartTag(c) {
    if (c === ">") {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    }
    else if (c === "EOF") {
    }
    else {
    }
}
function beforeAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
        return beforeAttributeValue;
    }
    else if (c === "\"") {
        return doubleQuotedAttributeValue;
    }
    else if (c === "\'") {
        return singleQuotedAttributeValue;
    }
    else if (c === ">") {
    }
    else {
        return UnquotedAttributeValue(c);
    }
}
function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    }
    else if (c === "/") {
        return selfClosingStartTag;
    }
    else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }
    else if (c === EOF) {
    }
    else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}
function doubleQuotedAttributeValue(c) {
    if (c === "\"") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    }
    else if (c === "\u0000") {
    }
    else if (c === EOF) {
    }
    else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}
function singleQuotedAttributeValue(c) {
    if (c === "\'") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    }
    else if (c === "\u0000") {
    }
    else if (c === EOF) {
    }
    else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}
function UnquotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    }
    else if (c === "/") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    }
    else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }
    else if (c === "\u0000") {
    }
    else if (c === "\"" || c === "'" || c === "<" || c === "=" || c === "`") {
    }
    else if (c === EOF) {
    }
    else {
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}
function parseHTML(html) {
    console.log(html);
    let state = data;
    for (const c of html) {
        state = state(c);
    }
    state = state(EOF);
    console.log(stack[0]);
    return stack[0];
}
exports.parseHTML = parseHTML;
