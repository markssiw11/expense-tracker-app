import { drawRandomEntries, getWheelRotationTarget } from "./randomPicker";

describe("drawRandomEntries", () => {
  it("returns unique entries when duplicates are disabled", () => {
    expect(drawRandomEntries(["A", "B", "C"], 2, false, () => 0)).toEqual([
      "B",
      "C",
    ]);
  });

  it("allows the same entry to be drawn more than once", () => {
    expect(drawRandomEntries(["A", "B"], 3, true, () => 0)).toEqual([
      "A",
      "A",
      "A",
    ]);
  });

  it("caps unique winners at the number of entries", () => {
    expect(drawRandomEntries(["A", "B"], 5, false, () => 0)).toHaveLength(2);
  });

  it("aligns the selected wheel segment under the fixed top pointer", () => {
    const entries = 5;
    const selectedIndex = 3;
    const target = getWheelRotationTarget(147, selectedIndex, entries);
    const segmentCenter = -90 + (selectedIndex + 0.5) * (360 / entries);
    const finalCenter = (((segmentCenter + target) % 360) + 360) % 360;

    expect(finalCenter).toBeCloseTo(270);
  });
});
