import decodedMorseCode from "../challenges/decodeMorseCode";

describe("Decode Morse Code", () => {
  it("Validating a simple morse code", () => {
    expect(decodedMorseCode(".... . -.--   .--- ..- -.. .")).toBe("HEY JUDE");
  });
  it("Validating a simple morse code 2", () => {
    expect(
      decodedMorseCode("... .- -- ..- . .-..   -.-. .- -... .- .-..")
    ).toBe("SAMUEL CABAL");
  });
  it("Validating a large morse code", () => {
    expect(
      decodedMorseCode(
        "..   .... .- ...- .   --. --- -   .-   -.. .- - .   .- -   .-   --.- ..- .- .-. - . .-.   - ---   . .. --. .... - .-.-.-   ..   .-- .. .-.. .-..   ... . .   -.-- --- ..-   .- -   - .... .   --. .- - . --..--   ... ---   -.. ---   -. --- -   -... .   .-.. .- - . .-.-.-"
      )
    ).toBe(
      "I HAVE GOT A DATE AT A QUARTER TO EIGHT. I WILL SEE YOU AT THE GATE, SO DO NOT BE LATE."
    );
  });
  it("Validating a morsecode with numbers", () => {
    expect(
      decodedMorseCode("-. .. -.-. .   - ---   --4 . . -   -.-- --- ..-")
    ).toBe("NICE TO MEET YOU");
  });
  it("Validating a morsecode with others spsecial characters", () => {
    expect(
      decodedMorseCode(
        "-. .. -.-. .&   - ---   -- .======= . -   -!.-- --- ..-"
      )
    ).toBe("NICE TO MEET YOU");
  });
  it("Validating a morsecode with letters", () => {
    expect(
      decodedMorseCode("-. .. -.-. .HELLO   - ---   -- . . -   A-.-- --- ..Z-")
    ).toBe("NICE TO MEET YOU");
  });
  it("Validating an object input", () => {
    expect(decodedMorseCode({})).toBe(undefined);
  });
  it("Validating a number input", () => {
    expect(decodedMorseCode(123)).toBe(undefined);
  });
  it("Validating an empty input", () => {
    expect(decodedMorseCode("")).toBe("");
  });
  it("Validating a null input", () => {
    expect(decodedMorseCode()).toBe(undefined);
  });
  it("Validating a SOS code", () => {
    expect(decodedMorseCode("...---...")).toBe("SOS");
  });
  it("Validating a SOS code 2", () => {
    expect(
      decodedMorseCode(
        "   ... --- ... -.-.--   - .... .   --.- ..- .. -.-. -.-   -... .-. --- .-- -.   ..-. --- -..-   .--- ..- -- .--. ...   --- ...- . .-.   - .... .   .-.. .- --.. -.--   -.. --- --. .-.-.-   -.-. --- -.. . ---... .----. ..--- ...-- ..... -.... ....- .----."
      )
    ).toBe("SOS! THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. CODE:'23564'");
  });
});
