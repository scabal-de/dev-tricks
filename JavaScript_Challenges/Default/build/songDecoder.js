"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

const songDecoder = (song, decoder = "WUB") => {
  let regx = new RegExp(decoder.toUpperCase(), "g");
  const res = song.toUpperCase().replace(regx, " ").replace(/\s\s+/g, " ").trim();
  return res;
};

console.log(songDecoder("A BWUBC"));
var _default = songDecoder;
exports.default = _default;