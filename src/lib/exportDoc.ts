/**
 * Generic client-side document exporter.
 * Renders a print-styled window (Save as PDF) or downloads plain markdown —
 * no PDF library required, works on mobile & desktop.
 */

export type DocSection =
  | { heading: string; type: "list"; items: string[] }
  | { heading: string; type: "text"; items: string[] }
  | { heading: string; type: "formula"; items: string[] }
  | { heading: string; type: "kv"; items: { term: string; definition: string }[] }
  | {
      heading: string;
      type: "qa";
      items: { question: string; answer: string; meta?: string }[];
    };

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );

function renderSection(s: DocSection): string {
  const head = `<h2>${esc(s.heading)}</h2>`;
  switch (s.type) {
    case "list":
      if (!s.items?.length) return "";
      return head + `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    case "text":
      if (!s.items?.length) return "";
      return head + s.items.map((i) => `<p>${esc(i)}</p>`).join("");
    case "formula":
      if (!s.items?.length) return "";
      return head + s.items.map((i) => `<div class="formula">${esc(i)}</div>`).join("");
    case "kv":
      if (!s.items?.length) return "";
      return (
        head +
        s.items
          .map((t) => `<div class="term"><b>${esc(t.term)}</b>${esc(t.definition)}</div>`)
          .join("")
      );
    case "qa":
      if (!s.items?.length) return "";
      return (
        head +
        s.items
          .map(
            (q, i) => `<div class="qa">
              ${q.meta ? `<span class="meta">${esc(q.meta)}</span>` : ""}
              <div class="q">${i + 1}. ${esc(q.question)}</div>
              ${q.answer ? `<div class="a"><b>Ans.</b> ${esc(q.answer)}</div>` : ""}
            </div>`,
          )
          .join("")
      );
    default:
      return "";
  }
}

/**
 * Clean the text of glyphs the jsPDF standard (WinAnsi) fonts can't render,
 * which is what produced garbled / clipped output before.
 */
const clean = (s: unknown) =>
  String(s ?? "")
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[\u2022\u25CF]/g, "-")
    .replace(/[^\x09\x0A\x20-\x7E\u00A1-\u00FF]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

/** Real .pdf file download using jsPDF — A4 with safe margins; text is never clipped. */
export async function exportDocPdf(opts: {
  title: string;
  subtitle?: string;
  sections: DocSection[];
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const ML = 54; // left margin
  const MR = 54; // right margin
  const MT = 64; // top margin (content starts below running header)
  const MB = 56; // bottom margin (footer lives below)
  const contentW = pageW - ML - MR;

  let y = MT;
  let pageIndex = 1;

  const ACCENT: [number, number, number] = [79, 70, 229];
  const INK: [number, number, number] = [24, 24, 32];
  const MUTED: [number, number, number] = [110, 112, 130];

  /** Hard-break tokens longer than the available width so nothing bleeds off-page. */
  const breakLongWords = (text: string, width: number) =>
    text
      .split(/\s+/)
      .map((word) => {
        if (doc.getTextWidth(word) <= width) return word;
        let out = "";
        let cur = "";
        for (const ch of word) {
          if (doc.getTextWidth(cur + ch) > width && cur) {
            out += cur + "\u200B ";
            cur = "";
          }
          cur += ch;
        }
        return out + cur;
      })
      .join(" ");

  const drawChrome = () => {
    // top hairline + brand
    doc.setDrawColor(226, 227, 236);
    doc.setLineWidth(0.6);
    doc.line(ML, 40, pageW - MR, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...ACCENT);
    doc.text("EDSPIRE LENS", ML, 33);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(clean(opts.title).slice(0, 62), pageW - MR, 33, { align: "right" });
    // footer
    doc.setDrawColor(238, 239, 246);
    doc.line(ML, pageH - 40, pageW - MR, pageH - 40);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(new Date().toLocaleDateString(), ML, pageH - 26);
    doc.text(`Page ${pageIndex}`, pageW - MR, pageH - 26, { align: "right" });
  };

  const addPage = () => {
    doc.addPage();
    pageIndex += 1;
    drawChrome();
    y = MT;
  };

  const room = (h: number) => {
    if (y + h > pageH - MB) addPage();
  };

  type WOpts = {
    size?: number;
    style?: "normal" | "bold" | "italic";
    font?: "helvetica" | "courier";
    indent?: number;
    hanging?: number;
    gapAfter?: number;
    color?: [number, number, number];
    lead?: number;
  };

  /** Measure + draw wrapped text, honouring indent and hanging indent. */
  const write = (text: string, o: WOpts = {}) => {
    const {
      size = 10.5,
      style = "normal",
      font = "helvetica",
      indent = 0,
      hanging = 0,
      gapAfter = 6,
      color = INK,
      lead = 1.45,
    } = o;
    const body = clean(text);
    if (!body) return;
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const restW = contentW - indent - hanging;
    const lineH = size * lead;

    // wrap against the narrower width so the hanging lines never overflow
    const lines: string[] = doc.splitTextToSize(breakLongWords(body, restW), restW);
    lines.forEach((line, i) => {
      room(lineH);
      const x = ML + indent + (i === 0 ? 0 : hanging);
      doc.text(line.replace(/\u200B/g, ""), x, y + size * 0.85);
      y += lineH;
    });
    y += gapAfter;
  };

  const sectionHeading = (label: string) => {
    room(46);
    y += 4;
    doc.setFillColor(...ACCENT);
    doc.rect(ML, y + 1, 3, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...ACCENT);
    doc.text(clean(label).toUpperCase(), ML + 10, y + 10.5, { maxWidth: contentW - 10 });
    y += 22;
  };

  // ---- Cover header -------------------------------------------------------
  drawChrome();
  doc.setFillColor(244, 245, 252);
  doc.roundedRect(ML, y - 6, contentW, 0.1, 6, 6, "F");
  write(opts.title, { size: 19, style: "bold", gapAfter: 2, lead: 1.25 });
  if (opts.subtitle) write(opts.subtitle, { size: 9.5, color: MUTED, gapAfter: 8 });
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.2);
  doc.line(ML, y, ML + 70, y);
  y += 18;

  // ---- Body ---------------------------------------------------------------
  for (const s of opts.sections) {
    if (!s.items?.length) continue;
    sectionHeading(s.heading);

    if (s.type === "list") {
      s.items.forEach((i) => write(`-  ${i}`, { indent: 6, hanging: 12, gapAfter: 4 }));
    } else if (s.type === "text") {
      s.items.forEach((i) => write(i, { gapAfter: 7 }));
    } else if (s.type === "formula") {
      s.items.forEach((i) =>
        write(i, { font: "courier", size: 10, indent: 8, hanging: 8, gapAfter: 6, color: [40, 40, 90] }),
      );
    } else if (s.type === "kv") {
      s.items.forEach((t) => {
        write(t.term, { size: 10.5, style: "bold", gapAfter: 1 });
        write(t.definition, { indent: 10, gapAfter: 8, color: [55, 60, 78] });
      });
    } else if (s.type === "qa") {
      s.items.forEach((q, i) => {
        room(48);
        if (q.meta) write(q.meta, { size: 8, color: [120, 110, 190], gapAfter: 1 });
        write(`${i + 1}.  ${q.question}`, { style: "bold", hanging: 16, gapAfter: 2 });
        if (q.answer)
          write(`Ans.  ${q.answer}`, { indent: 16, hanging: 22, gapAfter: 9, color: [60, 68, 88] });
      });
    }
    y += 4;
  }

  doc.save(`${safeName(opts.title)}.pdf`);
}

const safeName = (t: string) => t.replace(/[^\w\d -]/g, "").trim().slice(0, 60) || "edspire-notes";

/** Legacy printable-window export (kept as a fallback). */
export function exportDocPrintable(opts: {
  title: string;
  subtitle?: string;
  sections: DocSection[];
}) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=860,height=940");
  if (!win) return;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${esc(opts.title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#111; margin:0; padding:32px; line-height:1.55; }
  header { border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:22px; }
  h1 { font-size:22px; margin:0; }
  .subtitle { font-size:12px; color:#666; margin-top:4px; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:0.09em; margin:22px 0 8px; color:#222; border-left:3px solid #111; padding-left:8px; page-break-after:avoid; }
  ul { margin:0; padding-left:20px; }
  li, p { margin:0 0 6px; font-size:13px; }
  .formula { font-family:"SFMono-Regular", Menlo, monospace; background:#f4f4f5; border:1px solid #e4e4e7; border-radius:6px; padding:6px 10px; margin:4px 0; font-size:13px; }
  .term { margin-bottom:10px; font-size:13px; }
  .term b { display:block; margin-bottom:2px; }
  .qa { margin-bottom:12px; page-break-inside:avoid; font-size:13px; }
  .qa .meta { display:inline-block; font-size:10px; letter-spacing:.06em; text-transform:uppercase; background:#eef2ff; color:#3730a3; border-radius:99px; padding:2px 8px; margin-bottom:4px; }
  .qa .q { font-weight:600; }
  .qa .a { color:#374151; margin-top:3px; }
  footer { margin-top:34px; font-size:10px; color:#888; text-align:center; }
  @media print { body { padding:14mm; } }
</style></head>
<body>
  <header>
    <h1>${esc(opts.title)}</h1>
    ${opts.subtitle ? `<div class="subtitle">${esc(opts.subtitle)}</div>` : ""}
  </header>
  ${opts.sections.map(renderSection).join("")}
  <footer>Generated by Edspire Lens · ${new Date().toLocaleDateString()}</footer>
  <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));</script>
</body></html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

/** Download the same content as a .md file for offline use. */
export function exportDocMarkdown(opts: { title: string; subtitle?: string; sections: DocSection[] }) {
  const lines: string[] = [`# ${opts.title}`];
  if (opts.subtitle) lines.push(`_${opts.subtitle}_`);
  for (const s of opts.sections) {
    if (!s.items?.length) continue;
    lines.push(`\n## ${s.heading}\n`);
    if (s.type === "list") lines.push(...s.items.map((i) => `- ${i}`));
    else if (s.type === "text") lines.push(...s.items.map((i) => `${i}\n`));
    else if (s.type === "formula") lines.push(...s.items.map((i) => `\`${i}\``));
    else if (s.type === "kv") lines.push(...s.items.map((t) => `**${t.term}** — ${t.definition}`));
    else if (s.type === "qa")
      lines.push(
        ...s.items.map(
          (q, i) => `${i + 1}. ${q.meta ? `(${q.meta}) ` : ""}${q.question}\n   > ${q.answer}`,
        ),
      );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opts.title.replace(/[^\w\d -]/g, "").slice(0, 60) || "edspire-notes"}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
