let request = require("request");
module.exports = getUsers = (callback) => {
  request.get("https://www.mysite.com/api/users", (err, res) => {
    callback(JSON.parse(res.body));
  });
};
