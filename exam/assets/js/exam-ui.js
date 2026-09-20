/* ============================================================
   EXAM STUDY DASHBOARD - UI Helpers & API client
   ============================================================ */
(function () {
  'use strict';
  const EXAM = window.EXAM = window.EXAM || {};
  const ui = EXAM.ui = {};

  // API origin override (set window.EXAM_API_BASE when the API lives on a
  // different origin than the static frontend). Default: same origin.
  const API_BASE = (window.EXAM_API_BASE || '').replace(/\/+$/, '');
  const apiUrl = function (endpoint) {
    return API_BASE ? API_BASE + '/' + String(endpoint).replace(/^\/+/, '') : endpoint;
  };

  // CSRF token: from the PHP meta tag (session-bound) or lazily fetched from
  // api/csrf.php (Node server serves api/<name>.php URLs).
  let csrfToken = (() => {
    const m = document.querySelector('meta[name="exam-csrf"]');
    return m ? m.content : '';
  })();
  let csrfFetchedAt = 0;

  async function ensureCsrf() {
    if (csrfToken) {
      if (csrfFetchedAt === 0) return csrfToken; // meta token is session-bound
      if (Date.now() - csrfFetchedAt < 23 * 3600 * 1000) return csrfToken;
    }
    const raw = await (await fetch(apiUrl('api/csrf.php'))).json();
    if (!raw || !raw.success || !raw.data || !raw.data.token) {
      throw new Error('Could not obtain a CSRF token. Reload the page.');
    }
    csrfToken = raw.data.token;
    csrfFetchedAt = Date.now();
    return csrfToken;
  }

  // ---------- API client ----------
  ui.api = async function (endpoint, opts = {}) {
    const { method = 'GET', body = null, form = null, raw = false } = opts;
    let headers = {};
    let bodyData = undefined;

    if (form) {
      // multipart upload
      bodyData = form;
    } else if (body !== null) {
      headers['Content-Type'] = 'application/json';
      bodyData = JSON.stringify(body);
    }

    if (method !== 'GET') headers['X-CSRF-Token'] = await ensureCsrf();

    const timeoutMs = (method === 'GET') ? 30000 : 0;
    const ctrl = timeoutMs ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : null;
    let res;
    try {
      res = await fetch(apiUrl(endpoint), { method, headers, body: bodyData, signal: ctrl ? ctrl.signal : undefined });
    } catch (err) {
      if (ctrl && ctrl.signal.aborted) throw new Error('Request timed out: ' + endpoint);
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try { const j = await res.json(); msg = j.error?.message || msg; } catch (e) {}
      throw new Error(msg);
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Request failed');
    return raw ? data : data.data;
  };

  // ---------- Async AI job: trigger + polling ----------
  // Starts the Netlify background worker for a freshly created job. On a local
  // server (localhost) the API already runs the job in-process, so nothing to
  // start here. Called after ui.api returns { job_id }.
  ui.startJob = async function (jobId) {
    const host = window.location.hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') return;
    try {
      const token = await ensureCsrf();
      await fetch('/.netlify/functions/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ job_id: Number(jobId) }),
      });
    } catch (e) { /* background trigger is best-effort; polling still recovers */ }
  };

  // Poll GET /api/jobs.php?id=... until the background generation job finishes.
  // opts: { intervalMs, timeoutMs, onProgress(job) }. Resolves with the final job.
  ui.pollJob = async function (jobId, opts = {}) {
    const intervalMs = opts.intervalMs || 4000;
    const timeoutMs = opts.timeoutMs || 25 * 60 * 1000;
    const onProgress = opts.onProgress || null;
    const started = Date.now();
    let last = null;

    for (;;) {
      let job = null;
      try {
        job = await ui.api('api/jobs.php?id=' + Number(jobId));
      } catch (e) { /* transient network error — keep polling */ }

      if (job) {
        last = job;
        if (onProgress) { try { onProgress(job); } catch (e) {} }
        if (job.status === 'done') return job;
        if (job.status === 'failed') throw new Error(job.error || 'AI generation failed.');
      }

      if (Date.now() - started >= timeoutMs) {
        throw new Error(last && last.status === 'running'
          ? 'AI generation is still running. Give it a couple more minutes, then reload the page.'
          : 'Could not reach the AI generation job. Reload the page to check.');
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  };

  // ---------- Escape ----------
  ui.esc = function (s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  };

  // ---------- Markdown → HTML (light) ----------
  ui.md = function (s) {
    if (!s) return '';
    s = String(s).replace(/\r\n/g, '\n');

    // Protect code blocks
    const codes = [];

    // Mermaid diagrams: ```mermaid ... ``` handled specially (BEFORE generic code blocks)
    const diagrams = [];
    s = s.replace(/```mermaid\s*([\s\S]*?)```/g, function (_, m) {
      diagrams.push(m);
      return '\x00MERMAID' + (diagrams.length - 1) + '\x00';
    });

    // Remaining code blocks
    s = s.replace(/```([\s\S]*?)```/g, function (_, m) { codes.push(m); return '\x00CODE' + (codes.length - 1) + '\x00'; });

    // Inline formatting (on full text before line processing)
    const inline = function (t) {
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
      t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
      t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
      return t;
    };
    s = inline(s);

    // Line-by-line rendering into blocks
    const lines = s.split('\n');
    const out = [];
    let i = 0;
    const isHeading = /^(#{1,4}) (.+)$/;

    while (i < lines.length) {
      const line = lines[i];

      // Horizontal rule
      if (/^-{3,}$/.test(line.trim())) { out.push('<hr>'); i++; continue; }

      // Headings
      const hm = line.match(isHeading);
      if (hm) {
        const lvl = hm[1].length;
        out.push('<h' + lvl + '>' + hm[2] + '</h' + lvl + '>');
        i++;
        continue;
      }

      // Tables (| a | b |)
      if (/^\|.+/.test(line)) {
        const rows = [];
        while (i < lines.length && /^\|.+/.test(lines[i])) {
          const cells = lines[i].split('|').slice(1, -1).map(function (c) { return c.trim(); });
          rows.push('<tr>' + cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>');
          i++;
        }
        out.push('<table class="exam-table">' + rows.join('') + '</table>');
        continue;
      }

      // Unordered list
      if (/^[\-\*] \S/.test(line)) {
        const items = [];
        while (i < lines.length) {
          const m = lines[i].match(/^[\-\*] (.+)$/);
          if (!m) break;
          items.push('<li>' + m[1] + '</li>');
          i++;
        }
        out.push('<ul>' + items.join('') + '</ul>');
        continue;
      }

      // Ordered list
      if (/^\d+\.\s+\S/.test(line)) {
        const items = [];
        while (i < lines.length) {
          const m = lines[i].match(/^\d+\.\s+(.+)$/);
          if (!m) break;
          items.push('<li>' + m[1] + '</li>');
          i++;
        }
        out.push('<ol>' + items.join('') + '</ol>');
        continue;
      }

      // Standalone code/mermaid tokens → push as-is
      if (/^\x00(MERMAID|CODE)\d+\x00$/.test(line.trim())) {
        out.push(line.trim());
        i++;
        continue;
      }

      // Blank → ignore, continue
      if (line.trim() === '') { i++; continue; }

      // Paragraph: collect until blank line or block marker
      const para = [];
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === '' || isHeading.test(l) || /^\|.+/.test(l)
            || /^[\-\*] \S/.test(l) || /^\d+\.\s+\S/.test(l)
            || /^-{3,}$/.test(l.trim()) || /^\x00(MERMAID|CODE)\d+\x00$/.test(l.trim())) break;
        para.push(l);
        i++;
      }
      if (para.length) out.push('<p>' + para.join('<br>') + '</p>');
    }

    s = out.join('\n');
    // Restore mermaid diagrams
    s = s.replace(/\x00MERMAID(\d+)\x00/g, function (_, n) {
      return '<div class="exam-diagram" data-mermaid="' + ui.esc(diagrams[parseInt(n)]) + '"></div>';
    });
    // Restore code blocks (escaped)
    s = s.replace(/\x00CODE(\d+)\x00/g, function (_, n) {
      return '<pre><code>' + ui.esc(codes[parseInt(n)]) + '</code></pre>';
    });
    return s;
  };

  // ---------- Mermaid diagram rendering ----------
  ui.renderDiagrams = function (context) {
    const root = context && context.querySelector ? context : document;
    const nodes = root.querySelectorAll('.exam-diagram[data-mermaid]');
    if (!nodes.length || typeof window.mermaid === 'undefined') return;
    try {
      window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
    } catch (e) { /* ignore */ }
    let id = 0;
    Array.prototype.forEach.call(nodes, function (el) {
      const code = el.getAttribute('data-mermaid') || '';
      id++;
      const holder = el;
      // Validate BEFORE render: mermaid v10 resolves with an error <svg> ("x error in text")
      // instead of rejecting on bad syntax, so parse() first.
      const draw = function () {
        return window.mermaid.parse(code).then(function () {
          return window.mermaid.render('exam-md-' + id, code);
        });
      };
      draw().then(function (res) {
        if (res && res.svg && res.svg.indexOf('error') === -1) {
          holder.innerHTML = res.svg;
          holder.removeAttribute('data-mermaid');
        } else {
          holder.innerHTML = '<pre class="exam-diagram-error">' + ui.esc(code) + '</pre>';
        }
      }).catch(function () {
        holder.innerHTML = '<pre class="exam-diagram-error">' + ui.esc(code) + '</pre>';
      });
    });
  };

  // ---------- Toast ----------
  ui.toast = function (msg, type = 'info', ms = 3800) {
    const root = document.getElementById('exam-toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'exam-toast ' + type;
    el.innerHTML = '<span>' + ui.esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, ms - 300);
    setTimeout(() => el.remove(), ms);
  };

  // ---------- Modal ----------
  ui.modal = function (titleHtml, bodyHtml, width = 720) {
    const root = document.getElementById('exam-modal-root');
    if (!root) return;
    root.innerHTML = `
      <div class="exam-modal-overlay" data-close-modal="1">
        <div class="exam-modal" style="max-width:${width}px">
          <div class="exam-modal-head">
            <div class="exam-modal-title">${titleHtml}</div>
            <button class="exam-modal-close" data-close-modal="1">✕</button>
          </div>
          <div class="exam-modal-body" id="exam-modal-body">${bodyHtml}</div>
        </div>
      </div>`;
    root.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.exam-modal') && e.currentTarget.hasAttribute('data-close-modal') && e.currentTarget.classList.contains('exam-modal')) {}
        if (e.target === el || el.classList.contains('exam-modal-overlay') || el.classList.contains('exam-modal-close')) {
          ui.closeModal();
        }
      });
    });
    document.addEventListener('keydown', ui._modalKey = function (e) { if (e.key === 'Escape') ui.closeModal(); });
  };

  ui.closeModal = function () {
    const root = document.getElementById('exam-modal-root');
    if (root) root.innerHTML = '';
    if (ui._modalKey) document.removeEventListener('keydown', ui._modalKey);
  };

  ui.modalBody = function (html) {
    const b = document.getElementById('exam-modal-body');
    if (b) b.innerHTML = html;
  };

  // ---------- Badges ----------
  ui.statusBadge = function (status) {
    const map = {
      not_started: ['🔒', 'Not Started', 'gray'],
      studying: ['📖', 'Studying', 'blue'],
      test_pending: ['📝', 'Test Pending', 'yellow'],
      needs_revision: ['🔄', 'Needs Revision', 'red'],
      completed: ['✅', 'Completed', 'green'],
    };
    const [icon, label, color] = map[status] || [status, status, 'gray'];
    return `<span class="exam-badge exam-badge-${color}">${icon} ${ui.esc(label)}</span>`;
  };

  ui.typeShort = function (t) {
    return { mcq: 'MCQ', definition: 'Definition', concept: 'Concept', short_answer: 'Short Answer', long_answer: 'Long Answer', true_false: 'True/False' }[t] || t;
  };

  // ---------- Progress ring (SVG) ----------
  ui.ring = function (pct, size = 84, stroke = 8, color = null) {
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    const use = color || (p >= 80 ? 'var(--success)' : p >= 50 ? 'var(--primary)' : 'var(--danger)');
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - p / 100);
    return `
      <div class="exam-ring" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--surface-2)" stroke-width="${stroke}" fill="none"/>
          <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="${use}" stroke-width="${stroke}" fill="none"
                  stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round"/>
        </svg>
        <div class="exam-ring-text" style="color:${use}">${Math.round(p)}%</div>
      </div>`;
  };

  // ---------- Progress bar ----------
  ui.progressBar = function (pct, color = '') {
    return `<div class="exam-progress-track"><div class="exam-progress-fill ${color}" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>`;
  };

  // ---------- Spinner ----------
  ui.spinner = function (label) {
    return `<div class="exam-spinner-wrap"><span class="exam-spinner"></span>${label ? '<div class="exam-mt-8">' + ui.esc(label) + '</div>' : ''}</div>`;
  };

  // ---------- Empty state ----------
  ui.empty = function (icon, title, sub) {
    return `<div class="exam-empty"><div class="exam-empty-icon">${icon}</div>
      <div class="exam-empty-title">${ui.esc(title)}</div>
      ${sub ? '<div class="exam-mt-8">' + ui.esc(sub) + '</div>' : ''}</div>`;
  };

  EXAM.ui = ui;
})();