"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function friend(friends) {
  return friends.filter(i => i.length === 4);
}

console.log(friend(["Ryan", "Kieran", "Mark"]));
var _default = friend;
exports.default = _default;