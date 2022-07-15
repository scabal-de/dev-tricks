let expect = require("chai").expect;

before("root setup code", () => {
  console.log("root setup code");
});
after("root teardown code", () => {
  console.log("root teardown code");
});
beforeEach("root setup for each test", () => {
  console.log("root setup code for each test");
});
afterEach("root teardown code for each test", () => {
  console.log("root teardown code for each test");
});

describe("Test_suite2", () => {
  it("test3", () => {
    console.log("test3");
    expect(true).to.equal(true);
  });
});
