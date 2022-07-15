let expect = require("chai").expect;

describe("Test_suite1", () => {
  before("setup code", () => {
    console.log("setup code");
  });
  after("teardown code", () => {
    console.log("teardown code");
  });
  beforeEach("setup for each test", () => {
    console.log("setup code for each test");
  });
  afterEach("teardown code for each test", () => {
    console.log("teardown code for each test");
  });
  it("test1", () => {
    console.log("test1");
    expect(true).to.equal(true);
  });

  it("test2", () => {
    console.log("test2");
    expect(true).to.equal(true);
  });
});
