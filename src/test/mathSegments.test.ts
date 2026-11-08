import { describe, expect, it } from "vitest";
import { toMathSegments } from "@/lib/mathSegments";

describe("toMathSegments", () => {
  it("keeps prose around inline and display equations", () => {
    expect(toMathSegments("Energy $E=mc^2$ then $$F=ma$$" )).toEqual([
      { type: "text", value: "Energy " },
      { type: "math", value: "E=mc^2", display: false },
      { type: "text", value: " then " },
      { type: "math", value: "F=ma", display: true },
    ]);
  });

  it("supports the alternate LaTeX delimiters", () => {
    expect(toMathSegments("\\(x^2\\) and \\[y^2\\]").filter((part) => part.type === "math")).toEqual([
      { type: "math", value: "x^2", display: false },
      { type: "math", value: "y^2", display: true },
    ]);
  });

  it("treats raw formula-section lines as display equations", () => {
    expect(toMathSegments("\\frac{a}{b}=c\nE=mc^2", true)).toEqual([
      { type: "math", value: "\\frac{a}{b}=c", display: true },
      { type: "text", value: "\n" },
      { type: "math", value: "E=mc^2", display: true },
    ]);
  });
});