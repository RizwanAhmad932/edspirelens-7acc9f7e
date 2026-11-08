# Plan: Advanced motion and clear math PDFs

## 1. Refine app motion
- Add coordinated, lightweight interaction and content-entry motion to the existing design tokens and styles.
- Keep effects GPU-friendly, avoid distracting continuous movement, and honor reduced-motion preferences.
- Apply motion to shared controls/surfaces so it is consistent across pages.

## 2. Make math clear in downloaded PDFs
- Reuse the existing KaTeX parser and render equations visually in the PDF export rather than stripping LaTeX syntax into plain text.
- Preserve readable surrounding prose, support inline and display delimiters, and keep multi-page export legible.
- Add focused tests for formula-bearing PDF content and math conversion, then verify the export and animations in the preview.

## Technical details
- Keep the existing jsPDF A4 page layout and generate crisp equation imagery from KaTeX-rendered HTML for PDF embedding.
- Use existing semantic motion/color tokens and the current reduced-motion media query; avoid changes to the database or AI providers.
