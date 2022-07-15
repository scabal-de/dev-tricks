const { assert } = require("chai");
const expect = require("chai").expect;
const should = require("chai").should;

let actual = true;
let expected = true;

/**
 * Language Chains
 * to, be, been, is, that, which, has,
 * have, with, at, of, same, but, does
 */

describe("Chai Assert API Calls", () => {
  it("Assert types", () => {
    console.log("Assert types");
    assert.isTrue(true, "true");
    // assert.isNaN(1.1, "NaN");
    // assert.exists(foo, "!Exists");
    // assert.isArray(obj, "!Array");
    assert.equal(actual, expected, "are equals");
    // assert.isString(actual, "is not a string");
    // assert.property(object, propName, "[message]");
    // assert.throws(function);
  });
});

it("likes BDD!", () => {
  let result = true; /* productionCall() */

  expect(result).to.equal(true);
  //   result.should.equal(true);
  //   expect(result).to.equal(1);
  expect(result).to.be.true;
  //   expect(result).to.be.instanceOf(a);
  //   expect(badFn).to.throw();
});
