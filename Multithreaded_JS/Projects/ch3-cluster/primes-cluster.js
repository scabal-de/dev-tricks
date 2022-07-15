var cluster = require("cluster");
var express = require("express");
var sleep = require("sleep");
var numCPUs = require("os").cpus().length;

function primeNumbersTill(n) {
  let primes = [];

  for (let i = 2; i <= n; i++) {
    if (isPrime(i)) {
      primes.push(i);
    }
  }
  return primes;
}

function isPrime(n) {
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      return false;
    }
  }
  return n > 1;
}

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    // Create a worker
    cluster.fork();
  }
} else {
  // Workers share the TCP connection in this server
  var app = express();

  app.get("/primes", function (req, res) {
    var randSleep = Math.round(10000 + Math.random() * 10000);
    sleep.usleep(randSleep);

    const n = req.query.n || 1;
    res.json(primeNumbersTill(n));
  });

  // All workers use this port
  app.listen(3000);
}
