import findOdd from "../challenges/findOdd";

describe("Find Odd", () => {
  it("Validate array of integers, test 1", () => {
    expect(
      findOdd([20, 1, -1, 2, -2, 3, 3, 5, 5, 1, 2, 4, 20, 4, -1, -2, 5])
    ).toBe(5);
  });
  it("Validate array of integers, test 2", () => {
    expect(findOdd([1, 1, 2, -2, 5, 2, 4, 4, -1, -2, 5])).toBe(-1);
  });
  it("Validate array of integers, test 3", () => {
    expect(findOdd([20, 1, 1, 2, 2, 3, 3, 5, 5, 4, 20, 4, 5])).toBe(5);
  });
  it("Validate array of integers, test 4", () => {
    expect(findOdd([10])).toBe(10);
  });
  it("Validate array of integers, test 5", () => {
    expect(findOdd([1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1])).toBe(10);
  });
  it("Validate array of integers, test 6", () => {
    expect(findOdd([5, 4, 3, 2, 1, 5, 4, 3, 2, 10, 10])).toBe(1);
  });
  it("Validate array of strings", () => {
    expect(
      findOdd(["5", "4", "3", "2", "1", "5", "4", "3", "2", "10", "10"])
    ).toBe(1);
  });
  it("Validate empty array ", () => {
    expect(findOdd([])).toBe(null);
  });
  it("Validate using an object", () => {
    expect(findOdd({ 1: 1, 2: 2 })).toBe(undefined);
  });
  it("Validate using a string", () => {
    expect(findOdd("10")).toBe(undefined);
  });
  it("Validate using booleans", () => {
    expect(findOdd(true)).toBe(undefined);
  });
  it("Validate using a null value", () => {
    expect(findOdd(null)).toBe(undefined);
  });
});
