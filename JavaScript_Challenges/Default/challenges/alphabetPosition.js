function alphabetPosition(text) {
  const str = text.toLowerCase().match(/[a-z]/gi);
  return str ? str.map((i) => i.charCodeAt() - 96).join(" ") : "";
}

console.log(alphabetPosition("The sunset sets at twelve o' clock."));

export default alphabetPosition;
