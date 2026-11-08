export interface MathSegment {
  type: "text" | "math";
  value: string;
  display?: boolean;
}

const DELIMITED_MATH = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)[^$\n]+?(?<!\s)\$)/g;

/** Split mixed prose and LaTeX while retaining whether an expression is display math. */
export function toMathSegments(input: string, forceFormula = false): MathSegment[] {
  const text = String(input ?? "");
  if (forceFormula) {
    return text.split("\n").flatMap((line, index, lines) => {
      const parts: MathSegment[] = line.trim() ? [{ type: "math", value: line.trim(), display: true }] : [];
      if (index < lines.length - 1) parts.push({ type: "text", value: "\n" });
      return parts;
    });
  }

  const segments: MathSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(DELIMITED_MATH)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ type: "text", value: text.slice(cursor, index) });
    const display = token.startsWith("$$") || token.startsWith("\\[");
    const value = display ? token.slice(2, -2) : token.startsWith("\\(") ? token.slice(2, -2) : token.slice(1, -1);
    segments.push({ type: "math", value: value.trim(), display });
    cursor = index + token.length;
  }
  if (cursor < text.length) segments.push({ type: "text", value: text.slice(cursor) });
  return segments.length ? segments : [{ type: "text", value: text }];
}