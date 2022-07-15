"use strict";

function XO(str) {
  var _str$toUpperCase;

  const x = (_str$toUpperCase = str.toUpperCase()) === null || _str$toUpperCase === void 0 ? void 0 : _str$toUpperCase.match(/X/g);
  const o = str.toUpperCase().match(/O/g);
  return o && x ? o.length === x.length ? true : false : o === x ? true : false;
}

console.log(XO("Oaaaoaxx"));