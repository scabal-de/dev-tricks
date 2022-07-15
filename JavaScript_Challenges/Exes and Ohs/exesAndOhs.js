function XO(str) {
  const x = str.toUpperCase()?.match(/X/g);
  const o = str.toUpperCase().match(/O/g);

  return (x && x.length) === (o && o.length);
}

console.log(XO("Oaaaoaxx"));
