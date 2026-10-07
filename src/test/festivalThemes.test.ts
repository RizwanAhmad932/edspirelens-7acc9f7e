import { describe, expect, it } from "vitest";
import { FESTIVAL_THEMES, getFestivalTheme, normalizeTheme } from "@/lib/festivalThemes";

describe("festival catalog", () => {
  it("has one original appearance and nine distinct celebrations", () => {
    expect(FESTIVAL_THEMES).toHaveLength(10);
    expect(new Set(FESTIVAL_THEMES.map(theme => theme.name)).size).toBe(10);
    expect(FESTIVAL_THEMES.filter(theme => theme.art)).toHaveLength(9);
  });
  it("safely restores the original for unknown or empty selections", () => {
    expect(normalizeTheme("unknown")).toBe("none");
    expect(normalizeTheme(null)).toBe("none");
    expect(normalizeTheme("eid")).toBe("eid");
  });
  it("shares the same greeting between previews and live banners", () => {
    expect(getFestivalTheme("diwali").greeting).toBe("Happy Diwali");
    expect(getFestivalTheme("none").art).toBeUndefined();
  });
});