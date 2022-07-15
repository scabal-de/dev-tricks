import exesAndOhs from "../challenges/exesAndOhs";

describe("Exes and Ohs", () => {
  it("Validating a invalid simple string", () => {
    expect(exesAndOhs("xc")).toBe(false);
  });
  it("Validating a valid string", () => {
    expect(exesAndOhs("xxOo")).toBe(true);
  });
  it("Validating an invalid string", () => {
    expect(exesAndOhs("xxxm")).toBe(false);
  });
  it("Validating an invalid string 2", () => {
    expect(exesAndOhs("xOo")).toBe(false);
  });
  it("Validating an invalid string 3", () => {
    expect(exesAndOhs("ooom")).toBe(false);
  });
});
