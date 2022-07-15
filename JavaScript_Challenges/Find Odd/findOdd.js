function findOdd(A) {
  A.map((i) => (count[i] = count[i] ? count[i] + 1 : 1));
  Object.keys(count).map((i) => {
    return count[i] % 2 !== 0 ? (result = parseInt(i)) : null;
  });
}

console.log(findOdd([1, 2, 2, 3, 1, 4, 4, 1, 2, 2, 3]));
