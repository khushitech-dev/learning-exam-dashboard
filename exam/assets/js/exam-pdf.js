/* ============================================================
   EXAM STUDY DASHBOARD - PDF Viewer (PDF.js)
   Opens the uploaded subject PDF in a modal, synced to chapter pages.
   ============================================================ */
(function () {
  'use strict';
  const EXAM = window.EXAM = window.EXAM || {};
  const pdf = EXAM.pdf = {};

  pdf.open = async function (pdfUrl, opts = {}) {
    // Prefix the API origin when the frontend is hosted separately (Netlify).
    if (pdfUrl && /^(.+\.)?php/i.test(pdfUrl) && window.EXAM_API_BASE) {
      pdfUrl = window.EXAM_API_BASE.replace(/\/+$/, '') + '/' + pdfUrl.replace(/^\/+/, '');
    }
    EXAM.ui.modal('📄 PDF Viewer', EXAM.ui.spinner('Loading PDF…'), 900);
    try {
      const lib = await pdf._lib();
      const task = pdfjsLib.getDocument(pdfUrl);
      const doc = await task.promise;
      let pageNum = opts.page || 1;
      const maxPages = doc.numPages;

      const renderPage = async () => {
        const page = await doc.getPage(pageNum);
        const base = 1100; // viewport width target
        const vp1 = page.getViewport({ scale: 1 });
        const scale = base / vp1.width;
        const viewport = page.getViewport({ scale });
        EXAM.ui.modalBody(`
          <div class="exam-pdf-controls">
            <button class="exam-btn exam-btn-ghost exam-btn-sm" data-pdf="prev">◀ Prev</button>
            <span>Page <b data-pdf="page">${pageNum}</b> / ${maxPages}</span>
            <button class="exam-btn exam-btn-ghost exam-btn-sm" data-pdf="next">Next ▶</button>
          </div>
          <div class="exam-pdf-canvas-wrap"><canvas id="exam-pdf-canvas"></canvas></div>
        `);
        const canvas = document.getElementById('exam-pdf-canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        document.querySelectorAll('[data-pdf]').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (btn.dataset.pdf === 'prev' && pageNum > 1) { pageNum--; renderPage(); }
            if (btn.dataset.pdf === 'next' && pageNum < maxPages) { pageNum++; renderPage(); }
          });
        });
      };

      renderPage();
    } catch (e) {
      EXAM.ui.modalBody('<div class="exam-empty"><div class="exam-empty-icon">⚠️</div><div class="exam-empty-title">Could not load PDF</div><div>' + EXAM.ui.esc(e.message || e) + '</div></div>');
    }
  };

  pdf._lib = function () {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'lib/pdf.min.js';
      s.onload = () => resolve(window.pdfjsLib);
      s.onerror = (e) => reject(new Error('PDF.js failed to load: ' + (e.message || e)));
      document.head.appendChild(s);
    });
  };

  pdf.workerSetup = function () {
    if (window.pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.min.js';
    }
  };

  EXAM.pdf = pdf;
})();