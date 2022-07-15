import alphabetPosition from "../challenges/alphabetPosition";

describe("Alphabet positions", () => {
  it("Validating the positions of each character in the alphabet using a known sentence, test 1", () => {
    expect(alphabetPosition("The sunset sets at twelve o' clock.")).toBe(
      "20 8 5 19 21 14 19 5 20 19 5 20 19 1 20 20 23 5 12 22 5 15 3 12 15 3 11"
    );
  });
  it("Validating the positions of each character in the alphabet using a known sentence, test 2", () => {
    expect(alphabetPosition("The narwhal bacons at midnight.")).toBe(
      "20 8 5 14 1 18 23 8 1 12 2 1 3 15 14 19 1 20 13 9 4 14 9 7 8 20"
    );
  });
  it("Validating the result of a null input", () => {
    expect(alphabetPosition("")).toBe("");
  });
  it("Validating the result of only special characters as a input", () => {
    expect(alphabetPosition("!$$%&  ¿")).toBe("");
  });
  it("Validating the result of only string numbers as a input", () => {
    expect(alphabetPosition("12316 55")).toBe("");
  });
});
