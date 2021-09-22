"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const images_1 = require("images");
function render(viewport, element) {
    if (element.style) {
        let img = (0, images_1.default)(element.style.width, element.style.height);
        if (element.style["background-color"]) {
            let color = element.style["background-color"] || "rgb(0, 0, 0)";
            color.match(/rgb\((\d+),(\d+),(\d+)\)/);
            img.fill(Number(RegExp.$1), Number(RegExp.$2), Number(RegExp.$3), 1);
            viewport.draw(img, element.style.left || 0, element.style.top || 0);
        }
    }
    if (element.children) {
        for (let child of element.children) {
            render(viewport, child);
        }
    }
}
exports.default = render;
