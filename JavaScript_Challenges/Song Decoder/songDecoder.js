const songDecoder = (song) => {
  return song
    .toUpperCase()
    .replace(/(WUB)+/g, " ")
    .trim();
};

console.log(songDecoder("A BWUBC"));
