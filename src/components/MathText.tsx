import { memo, useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Renders text that may contain LaTeX: $$block$$, \[block\], $inline$, \(inline\).
 * Falls back to raw text if KaTeX cannot parse a fragment.
 */
const RE = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)[^$\n]+?(?<!\s)\$)/g;

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
  return String(text)
    .split(RE)
    .map((part) => {
      if (!part) return "";
      let tex: string | null = null;
      let display = false;
      if (part.startsWith("$$") && part.endsWith("$$")) { tex = part.slice(2, -2); display = true; }
      else if (part.startsWith("\\[")) { tex = part.slice(2, -2); display = true; }
      else if (part.startsWith("\\(")) tex = part.slice(2, -2);
      else if (part.length > 2 && part.startsWith("$") && part.endsWith("$")) tex = part.slice(1, -1);
      if (tex !== null) return render(tex.trim(), display) ?? esc(part);
      return esc(part);
    })
    .join("");
}

/** Raw formula block: whole string treated as LaTeX if it has no delimiters. */
export function formulaToHtml(text: string) {
  if (!text) return "";
  if (RE.test(text)) { RE.lastIndex = 0; return mathToHtml(text); }
  RE.lastIndex = 0;
  return text.split("\n").map((l) => (l.trim() ? render(l.trim(), true) ?? esc(l) : "")).join("");
}

interface Props { text: string; className?: string; as?: "span" | "p" | "div"; formula?: boolean }

const MathText = ({ text, className, as = "span", formula }: Props) => {
  const html = useMemo(() => (formula ? formulaToHtml(text) : mathToHtml(text)), [text, formula]);
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default memo(MathText);
