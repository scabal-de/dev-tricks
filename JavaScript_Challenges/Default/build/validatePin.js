"use strict";

const validatePIN = pin => {
  return !/[\-d\.d\W\D\s]/.test(pin) && /(\b[\d]{4}\b)|(\b[\d]{6}\b)/.test(pin);
};

console.log(validatePIN("12.0"));