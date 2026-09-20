'use strict';
/**
 * PDF text extraction ported from exam_extract_pdf in exam/api/config.php.
 * Strategy: pdfjs-dist (per-page, most reliable) -> pdf-parse fallback.
 * Returns { pages: [{page, text}], full: "--- Page N ---\n\n..." }
 */

async function extractPdf(buffer) {
  // 1) pdfjs-dist per-page extraction
  try {
    const pages = await extractWithPdfjs(buffer);
    if (pages.length > 0 || buffer.length > 0) {
      const full = pages
        .map((pg) => '\n\n--- Page ' + pg.page + ' ---\n\n' + pg.text)
        .join('');
      return { pages, full };
    }
  } catch (e) {
    /* fall through to pdf-parse */
  }

  // 2) pdf-parse fallback (single blob of text, like the pure-PHP fallback)
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = String(data.text || '');
    const pages = text.trim() ? [{ page: 1, text }] : [];
    return { pages, full: text };
  } catch (e2) {
    return { pages: [], full: '' };
  }
}

async function extractWithPdfjs(buffer) {
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  // Node has no Web Worker; run on the main thread.
  pdfjs.GlobalWorkerOptions.workerSrc = '';
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: true,
    isEvalSupported: false,
  });
  const doc = await loadingTask.promise;
  const pages = [];
  const n = doc.numPages;
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const lines = [];
    let line = '';
    for (const item of tc.items) {
      const str = item.str || '';
      if (item.hasEOL) {
        lines.push((line + str).trimEnd());
        line = '';
      } else {
        line += str;
      }
    }
    if (line.trim()) lines.push(line.trimEnd());
    pages.push({ page: i, text: lines.join('\n') });
  }
  try { await doc.destroy(); } catch (e) { /* ignore */ }
  return pages;
}

module.exports = { extractPdf, extractWithPdfjs };