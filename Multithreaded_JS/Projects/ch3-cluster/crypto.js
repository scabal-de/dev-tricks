var crypto = require("crypto");
var express = require("express");
var sleep = require("sleep");

var app = express();

app.get("/", function (req, res) {
  // Simulate route processing delay
  var randSleep = Math.round(10000 + Math.random() * 10000);
  sleep.usleep(randSleep);

  var numChars = Math.round(5000 + Math.random() * 5000);
  var randChars = crypto.randomBytes(numChars).toString("hex");
  res.send(randChars);
});

app.listen(3001);
