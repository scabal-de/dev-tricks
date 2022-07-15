let expect = require("chai").expect;

describe("Test_suite1", () => {
  it("expects true to equal true", () => {
    expect(true).to.equal(true);
  });
});

describe("Test_suite2", () => {
  describe("Test_suite3", () => {
    it("expects false to equal false", () => {
      expect(false).to.equal(false);
    });
  });

  it("expects false to equal false", () => {
    expect(false).to.equal(false);
  });
});
