import { memo, useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { toMathSegments } from "@/lib/mathSegments";

/**
 * Renders text that may contain LaTeX: $$block$$, \[block\], $inline$, \(inline\).
 * Falls back to raw text if KaTeX cannot parse a fragment.
 */
function render(tex: string, display: boolean) {
  try {
    return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: "ignore", output: "html" });
  } catch {
    return null;
  }
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

export function mathToHtml(text: string) {
  if (!text) return "";
  return toMathSegments(String(text))
    .map((segment) => segment.type === "math"
      ? render(segment.value, Boolean(segment.display)) ?? esc(segment.value)
      : esc(segment.value))
    .join("");
}

/** Raw formula block: whole string treated as LaTeX if it has no delimiters. */
export function formulaToHtml(text: string) {
  if (!text) return "";
  const delimited = toMathSegments(text);
  const segments = delimited.some((segment) => segment.type === "math")
    ? delimited
    : toMathSegments(text, true);
  return segments.map((segment) => segment.type === "math"
    ? render(segment.value, Boolean(segment.display)) ?? esc(segment.value)
    : esc(segment.value)).join("");
}

interface Props { text: string; className?: string; as?: "span" | "p" | "div"; formula?: boolean }

const MathText = ({ text, className, as = "span", formula }: Props) => {
  const html = useMemo(() => (formula ? formulaToHtml(text) : mathToHtml(text)), [text, formula]);
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default memo(MathText);
