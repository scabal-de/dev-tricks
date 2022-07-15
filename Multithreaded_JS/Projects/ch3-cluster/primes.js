const app = require("express")();
var sleep = require("sleep");

const primeNumbersTill = (n) => {
  let primes = [];

  for (let i = 2; i <= n; i++) {
    if (isPrime(i)) {
      primes.push(i);
    }
  }
  return primes;
};

const isPrime = (n) => {
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      return false;
    }
  }
  return n > 1;
};

app.get("/primes", (req, res) => {
  var randSleep = Math.round(10000 + Math.random() * 10000);
  sleep.usleep(randSleep);

  const n = req.query.n || 1;
  res.json(primeNumbersTill(n));
});

app.listen(3000, () => {
  console.log("Listening port 3000");
});
