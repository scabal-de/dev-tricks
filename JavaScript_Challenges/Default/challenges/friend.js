function friend(friends) {
  return friends.filter((i) => i.length === 4);
}

console.log(friend(["Ryan", "Kieran", "Mark"]));

export default friend;
