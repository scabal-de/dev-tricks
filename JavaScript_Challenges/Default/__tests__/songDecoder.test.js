import songDecoder from "../challenges/songDecoder";

describe("Soung Decoder", () => {
  it("Validate a string decoded with", () => {
    expect(songDecoder("AWUBBWUBC")).toBe("A B C");
  });
  it("Validating with a coded string", () => {
    expect(songDecoder("AWUBWUBWUBBWUBWUBWUBC")).toBe("A B C");
  });
  it("Validating with a coded string 2", () => {
    expect(songDecoder("WUBAWUBBWUBCWUB")).toBe("A B C");
  });
  it("Validating with a coded string with spaces", () => {
    expect(songDecoder("A BWUBC")).toBe("A B C");
  });
  it("Validating with a complex coded string", () => {
    expect(
      songDecoder("WUBWEWUBAREWUBWUBTHEWUBCHAMPIONSWUBMYWUBFRIENDWUB")
    ).toBe("WE ARE THE CHAMPIONS MY FRIEND");
  });
});
