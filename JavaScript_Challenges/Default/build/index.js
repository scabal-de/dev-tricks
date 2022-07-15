"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function findOdd(A) {
  let result = undefined;

  if (Array.isArray(A)) {
    let count = [];
    result = null;
    A.map(i => count[i] = count[i] ? count[i] + 1 : 1);
    Object.keys(count).map(i => {
      count[i] % 2 !== 0 ? result = parseInt(i) : null;
    });
  }

  return result;
}

console.log(findOdd([1, 2, 2, 3, 1, 4, 4, 1, 2, 2, 3]));
var _default = findOdd;
exports.default = _default;