import validatePIN from "../challenges/validatePin";

describe("Validate PIN", () => {
  it("Wrong output for '1'", () => {
    expect(validatePIN("1")).toBe(false);
  });
  it("Wrong output for '12'", () => {
    expect(validatePIN("12")).toBe(false);
  });
  it("Wrong output for '123'", () => {
    expect(validatePIN("123")).toBe(false);
  });
  it("Wrong output for '12345'", () => {
    expect(validatePIN("12345")).toBe(false);
  });
  it("Wrong output for '1234567'", () => {
    expect(validatePIN("1234567")).toBe(false);
  });
  it("should return False for pins which contain characters other than digits", () => {
    expect(validatePIN("a234")).toBe(false);
  });
  it("should return False for pins which contain characters other than digits 2", () => {
    expect(validatePIN(".234")).toBe(false);
  });
  it("Should return True for valid pins", () => {
    expect(validatePIN("1234")).toBe(true);
  });
  it("Validating a valid pin", () => {
    expect(validatePIN("0000")).toBe(true);
  });
  it("Validating a valid pin 2", () => {
    expect(validatePIN("123456")).toBe(true);
  });
  it("Validating a valid pin 3", () => {
    expect(validatePIN("000000")).toBe(true);
  });
});
