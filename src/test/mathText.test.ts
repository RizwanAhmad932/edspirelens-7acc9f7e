import { describe, it, expect } from "vitest";
import { formulaToHtml, mathToHtml } from "@/components/MathText";
describe("mathToHtml", () => {
  it("renders inline $..$ with KaTeX", () => { expect(mathToHtml("Energy $E=mc^2$ ok")).toContain("katex"); });
  it("leaves plain prices alone", () => { expect(mathToHtml("costs 5 dollars")).not.toContain("katex"); });
  it("escapes html", () => { expect(mathToHtml("<b>")).toBe("&lt;b&gt;"); });
  it("keeps delimited equations intact in raw-formula mode", () => {
    expect(formulaToHtml("$x=\\frac{1}{2}$ and $\\alpha=3$ ")).toContain("katex");
  });
});
