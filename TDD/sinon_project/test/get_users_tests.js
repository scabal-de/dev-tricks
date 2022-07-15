let expect = require("chai").expect;
let chai = require("chai");
let sinon = require("sinon");
let sinonChai = require("sinon-chai");
let request = require("request");
chai.should();
chai.use(sinonChai);

let getUsers = require("../get_users");

describe("GetUsers Test", () => {
  let spy;
  beforeEach(() => {
    spy = sinon.spy();
    sinon.stub(request, "get").callsFake((url, callback) => {
      callback({}, { body: '{"users":["user1","user2"]}' });
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("Can call getUsers", () => {
    let spy = sinon.spy();
    getUsers(spy);
    spy.should.have.been.calledOnce;
  });

  it("Calls the correct URL", () => {
    getUsers(spy);
    request.get.should.have.been.calledWith("https://www.mysite.com/api/users");
  });

  it("Returns correct data", () => {
    getUsers(spy);
    spy.should.have.been.calledWith({ users: ["user1", "user2"] });
  });
});
