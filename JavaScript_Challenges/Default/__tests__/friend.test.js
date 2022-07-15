import friend from "../challenges/friend";

describe("Friends", () => {
  it("Validating the response of an array of persons with one invalid element", () => {
    expect(friend(["Ryan", "Kieran", "Mark"])).toStrictEqual(["Ryan", "Mark"]);
  });
  it("Validating an array of peoples and numbers where only one comply with the rule", () => {
    expect(friend(["Ryan", "Jimmy", "123", "4", "Cool Man"])).toStrictEqual([
      "Ryan",
    ]);
  });
  it("Two elements don't comply the rule", () => {
    expect(
      friend(["Jimm", "Cari", "aret", "truehdnviegkwgvke", "sixtyiscooooool"])
    ).toStrictEqual(["Jimm", "Cari", "aret"]);
  });
  it("One element don't comply the rule", () => {
    expect(friend(["Love", "Your", "Face", "1"])).toStrictEqual([
      "Love",
      "Your",
      "Face",
    ]);
  });
  //   it("None of the items complied with the rule.", () => {
  //     expect(friend(["sdassdsa", "adsadsassa"])).toBe("");
  //   });
  //   it("Validating an empty array", () => {
  //     expect(friend([])).toBe("");
  //   });
  //   it("Validating an input null", () => {
  //     expect(friend()).toBe("");
  //   });
});
