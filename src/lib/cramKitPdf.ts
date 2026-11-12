import { toMathSegments } from "@/lib/mathSegments";
import katex from "katex";
import "katex/dist/katex.min.css";
import html2canvas from "html2canvas";
import type { DocSection } from "@/lib/exportDoc";
import { jsPDF } from "jspdf";

const escapeHtml = (value: string) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char] ?? char));

function richHtml(value: string) {
  return toMathSegments(value).map((segment) => {
    if (segment.type === "text") return escapeHtml(segment.value).replace(/\n/g, "<br>");
    try {
      return katex.renderToString(segment.value, {
        displayMode: Boolean(segment.display), throwOnError: false, strict: "ignore", output: "html",
      });
    } catch {
      return escapeHtml(segment.value);
    }
  }).join("");
}

function contentBlocks(sections: DocSection[]) {
  const blocks: { html: string; className: string }[] = [];
  for (const section of sections) {
    if (!section.items.length) continue;
    blocks.push({ html: escapeHtml(section.heading), className: "section-heading" });
    if (section.type === "kv") {
      for (const entry of section.items) {
        blocks.push({ html: richHtml(entry.term), className: "term" });
        blocks.push({ html: richHtml(entry.definition), className: "body indent" });
      }
    } else if (section.type === "qa") {
      section.items.forEach((entry, index) => {
        if (entry.meta) blocks.push({ html: richHtml(entry.meta), className: "meta" });
        blocks.push({ html: `${index + 1}. ${richHtml(entry.question)}`, className: "question" });
        if (entry.answer) blocks.push({ html: `<b>Answer:</b> ${richHtml(entry.answer)}`, className: "body indent" });
      });
    } else {
      for (const item of section.items) {
        const prefix = section.type === "list" ? "• " : "";
        blocks.push({ html: `${prefix}${richHtml(item)}`, className: section.type === "formula" ? "formula" : "body" });
      }
    }
  }
  return blocks;
}

/** Cram Kit export: browser-rendered text/equations avoid missing glyphs in PDF fonts. */
export async function exportCramKitPdf(options: {
  title: string;
  subtitle?: string;
  sections: DocSection[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const headerHeight = 34;
  const footerHeight = 34;
  const contentWidthPt = pageWidth - margin * 2;
  const rasterScale = 2;
  const stage = document.createElement("div");
  Object.assign(stage.style, {
    position: "fixed", left: "-100000px", top: "0", width: `${contentWidthPt * rasterScale}px`,
    boxSizing: "border-box", padding: "0", margin: "0", color: "#171923", background: "#ffffff",
    fontFamily: "Arial, 'Segoe UI', sans-serif", fontSize: `${10.5 * rasterScale}px`,
    lineHeight: "1.48", overflowWrap: "anywhere", wordBreak: "normal",
  });
  const style = document.createElement("style");
  style.textContent = `
    .ck-title{font-size:${20 * rasterScale}px;font-weight:700;line-height:1.2;margin:0 0 ${5 * rasterScale}px}
    .ck-subtitle{font-size:${9.5 * rasterScale}px;color:#555b6c;margin:0 0 ${12 * rasterScale}px}
    .ck-block{box-sizing:border-box;width:100%;margin:0 0 ${5 * rasterScale}px;white-space:pre-wrap}
    .ck-section-heading{font-size:${10 * rasterScale}px;font-weight:700;color:#303c73;text-transform:uppercase;
      border-bottom:1px solid #d9dce8;padding-bottom:${3 * rasterScale}px;margin:${9 * rasterScale}px 0 ${6 * rasterScale}px}
    .ck-term,.ck-question{font-weight:700}.ck-body{color:#252938}.ck-indent{padding-left:${10 * rasterScale}px}
    .ck-meta{font-size:${8 * rasterScale}px;color:#555b6c}.ck-formula{font-family:Arial,sans-serif;padding:${2 * rasterScale}px 0}
    .katex-display{margin:.35em 0;text-align:left}.katex{font-size:1em}
  `;
  document.head.appendChild(style);
  document.body.appendChild(stage);

  try {
    const title = document.createElement("div");
    title.className = "ck-title";
    title.innerHTML = richHtml(options.title);
    stage.appendChild(title);
    if (options.subtitle) {
      const subtitle = document.createElement("div");
      subtitle.className = "ck-subtitle";
      subtitle.innerHTML = richHtml(options.subtitle);
      stage.appendChild(subtitle);
    }
    for (const block of contentBlocks(options.sections)) {
      const element = document.createElement("div");
      element.className = `ck-block ck-${block.className}`;
      element.innerHTML = block.html;
      stage.appendChild(element);
    }

    const fullCanvas = await html2canvas(stage, {
      backgroundColor: "#ffffff", scale: 1, logging: false, width: Math.round(contentWidthPt * rasterScale),
      windowWidth: Math.round(contentWidthPt * rasterScale),
    });
    const usableHeightPt = pageHeight - headerHeight - footerHeight - margin;
    const sliceHeightPx = Math.max(1, Math.floor(usableHeightPt * rasterScale));
    const pageCount = Math.max(1, Math.ceil(fullCanvas.height / sliceHeightPx));
    for (let page = 0; page < pageCount; page++) {
      if (page > 0) doc.addPage();
      const top = page * sliceHeightPx;
      const height = Math.min(sliceHeightPx, fullCanvas.height - top);
      const pageSlice = document.createElement("canvas");
      pageSlice.width = fullCanvas.width;
      pageSlice.height = height;
      const context = pageSlice.getContext("2d");
      if (!context) continue;
      context.drawImage(fullCanvas, 0, top, fullCanvas.width, height, 0, 0, fullCanvas.width, height);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229);
      doc.text("EDSPIRE LENS", margin, 25);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110, 112, 130);
      doc.text(options.title.replace(/[^\x20-\x7E]/g, ""), pageWidth - margin, 25, { align: "right", maxWidth: contentWidthPt * 0.72 });
      doc.addImage(pageSlice.toDataURL("image/png"), "PNG", margin, headerHeight, contentWidthPt, height / rasterScale, undefined, "FAST");
      doc.setDrawColor(238, 239, 246);
      doc.line(margin, pageHeight - 27, pageWidth - margin, pageHeight - 27);
      doc.setFontSize(7.5);
      doc.setTextColor(110, 112, 130);
      doc.text(new Date().toLocaleDateString(), margin, pageHeight - 15);
      doc.text(`Page ${page + 1}`, pageWidth - margin, pageHeight - 15, { align: "right" });
    }
    const safeName = options.title.replace(/[^\w\d -]/g, "").trim().slice(0, 60) || "edspire-cram-kit";
    doc.save(`${safeName}.pdf`);
  } finally {
    stage.remove();
    style.remove();
  }
}