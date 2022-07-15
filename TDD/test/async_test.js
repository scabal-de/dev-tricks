var expect = require("chai").expect;

myAsyncFunction = (callback) => {
  setTimeout(() => {
    callback("blah");
  }, 50);
};

myPromiseFunction = () => {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      resolve("blah");
    }, 50);
  });
};

it("test_async", (done) => {
  myAsyncFunction((str) => {
    expect(str).to.equal("blah");
    done();
  });
});

it("test_promise", () => {
  myPromiseFunction().then((res) => {
    expect(res).to.equal("blah");
  });
});

it("test_asybc_await", async () => {
  let result = await myPromiseFunction();
  expect(result).to.equal("blah");
});
