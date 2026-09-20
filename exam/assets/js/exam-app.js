/* ============================================================
   EXAM STUDY DASHBOARD - MAIN APP
   Hash router, sidebar, pages: Dashboard, My Subjects, Upload,
   Chapter list, Weak Topics, Tests, Revision, Final Summaries.
   ============================================================ */
(function () {
  'use strict';
  const EXAM = window.EXAM = window.EXAM || {};
  const ui = EXAM.ui;
  const app = EXAM.app = {};

  /* Watchdog for the subject-'processing' poll: a subject stuck in 'processing'
     (interrupted upload or hung job) used to make this page re-render every 2.5s
     forever — showing an endless "Loading…" loop. After ~30 polls we stop and
     show an explicit message instead. */
  let processingWatchdog = {};

  /* ---------- Global error surface: never leave the page silently stuck ---------- */
  let _lastSurface = '';
  function surfaceError(msg, ms) {
    try {
      if (!msg || _lastSurface === msg) return;
      _lastSurface = msg;
      ui.toast(msg, 'error', ms || 7000);
      setTimeout(function () { _lastSurface = ''; }, 5000);
    } catch (e) {}
  }
  window.addEventListener('error', function (ev) { surfaceError('Error: ' + (ev.message || 'script error')); });
  window.addEventListener('unhandledrejection', function (ev) {
    const r = ev.reason;
    surfaceError('Unhandled error: ' + ((r && r.message) || r || 'Promise rejected'));
  });

  /* ---------- Fatal guard: core UI script missing ---------- */
  if (!ui) {
    window.EXAM = EXAM;
    EXAM.app = {
      go: function () {},
      navigate: function () {},
      render: function () {},
      getSubjects: function () { return Promise.resolve([]); },
    };
    EXAM._wireContent = function () {};
    document.addEventListener('DOMContentLoaded', function () {
      const c = document.getElementById('exam-content');
      if (c) {
        c.innerHTML = '<div class="exam-empty">' +
          '<div class="exam-empty-icon">⚠️</div>' +
          '<div class="exam-empty-title">Core scripts failed to load</div>' +
          '<div class="exam-mt-8">exam-ui.js could not be loaded. Press Ctrl+Shift+R to hard-refresh and clear any stale cache.</div>' +
          '</div>';
      }
    });
    return;
  }

  app.state = {
    route: 'dashboard',
    subjectId: null,
    chapterId: null,
    subjectsCache: null,
  };

  /* ---------- Router ---------- */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { name: 'dashboard' };
    if (parts[0] === 'subject') {
      let subjectId = null, chapterId = null;
      if (parts[1] === 'chapter') {
        chapterId = parseInt(parts[2], 10) || null;
      } else if (parts[1] > 0) {
        subjectId = parseInt(parts[1], 10) || null;
        if (parts[2] === 'chapter') chapterId = parseInt(parts[3], 10) || null;
        else if (parts[2]) chapterId = parseInt(parts[2], 10) || null;
      }
      return { name: 'subject', subjectId, chapterId };
    }
    return { name: parts[0] };
  }

  function setActiveNav(name) {
    document.querySelectorAll('.exam-nav-item').forEach((n) => {
      let isActive = n.dataset.nav === name;
      if (name === 'subject') isActive = n.dataset.nav === 'subjects';
      n.classList.toggle('active', isActive);
    });
  }

  function navItems() {
    return ['dashboard', 'subjects', 'upload', 'weak', 'tests', 'revision', 'summaries', 'search', 'settings'];
  }

  function setupSidebar() {
    document.querySelectorAll('.exam-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        app.navigate(btn.dataset.nav);
        document.getElementById('exam-sidebar').classList.remove('open');
      });
    });
    const hamburger = document.getElementById('exam-hamburger');
    if (hamburger) hamburger.addEventListener('click', () => {
      const sb = document.getElementById('exam-sidebar');
      sb.classList.toggle('open');
      let bd = document.querySelector('.exam-backdrop');
      if (sb.classList.contains('open')) {
        bd = document.createElement('div');
        bd.className = 'exam-backdrop';
        bd.addEventListener('click', () => sb.classList.remove('open'));
        document.body.appendChild(bd);
      } else if (bd) bd.remove();
    });
    const tt = document.getElementById('exam-theme-toggle');
    if (tt) tt.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      localStorage.setItem('examDashboard_theme', cur);
      document.getElementById('exam-theme-icon').textContent = cur === 'dark' ? '☀️' : '🌙';
      document.getElementById('exam-theme-label').textContent = cur === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
  }

  // Never allow a subject route without an id (would hit the API with an empty id)
  function requireSubjectId(route, subjectId) {
    if (route !== 'subject' || subjectId) return true;
    ui.toast('Please open a subject from My Subjects to continue.', 'warning');
    return false;
  }

  app.navigate = function (route, subjectId, chapterId) {
    if (!requireSubjectId(route, subjectId)) return;
    if (subjectId && chapterId) location.hash = `#/subject/${subjectId}/chapter/${chapterId}`;
    else if (subjectId) location.hash = `#/subject/${subjectId}`;
    else location.hash = `#/${route}`;
  };

  app.go = function (route, subjectId, chapterId) {
    if (!requireSubjectId(route, subjectId)) return;
    if (subjectId && chapterId) location.hash = `#/subject/${subjectId}/chapter/${chapterId}`;
    else if (subjectId) location.hash = `#/subject/${subjectId}`;
    else { location.hash = `#/${route}`; app.maybeRender(); }
  };

  app.maybeRender = function () {
    render();
  };

  async function render() {
    const route = parseHash();
    const content = document.getElementById('exam-content');
    const escSafe = (ui && ui.esc) ? ui.esc : function (s) { return String(s == null ? '' : s); };
    try {
      content.innerHTML = ui.spinner('Loading…');
      armBootWatchdog();
      if (route.name === 'subject' && route.chapterId) {
        setActiveNav('subjects');
        await EXAM.study.render(route.subjectId, route.chapterId, content);
        return;
      }
      if (route.name === 'subject') {
        setActiveNav('subjects');
        if (!route.subjectId) { renderSubjectNotFound(content, 'No subject selected.'); return; }
        await renderSubjectChapters(route.subjectId, content);
        return;
      }
      setActiveNav(route.name);
      switch (route.name) {
        case 'dashboard': await renderDashboard(content); break;
        case 'subjects': await renderSubjects(content); break;
        case 'upload': renderUpload(content); break;
        case 'weak': await renderWeak(content); break;
        case 'tests': await renderTests(content); break;
        case 'revision': await renderRevision(content); break;
        case 'summaries': await renderSummaries(content); break;
        case 'search': EXAM.search.render(content, ui); break;
        case 'settings': EXAM.settings.render(content, ui); break;
        default: await renderDashboard(content);
      }
    } catch (e) {
      content.innerHTML = '<div class="exam-empty"><div class="exam-empty-icon">⚠️</div><div class="exam-empty-title">Something went wrong</div><div class="exam-mt-8">' + escSafe(e.message || e) + '</div></div>';
    }
  }

  /* ---------- Data cache ---------- */
  app.getSubjects = async function (force) {
    if (force || app.state.subjectsCache === null) {
      app.state.subjectsCache = await ui.api('api/subjects.php');
    }
    return app.state.subjectsCache;
  };

  app.loadSubject = async function (id) {
    return await ui.api('api/subjects.php?id=' + id);
  };

  app.loadChapters = async function (subjectId) {
    return await ui.api('api/chapters.php?subject_id=' + subjectId);
  };

  /* ================= DASHBOARD ================= */
  async function renderDashboard(content) {
    const d = await ui.api('api/subjects.php?action=dashboard');
    const t = d.totals || {};
    const recent = d.recent_attempts || [];
    const subjects = d.subjects || [];

    const statusBar = ['not_started', 'studying', 'test_pending', 'needs_revision', 'completed'].map((s) => {
      const n = t.status_counts?.[s] || 0;
      const label = { not_started: '🔒 Not Started', studying: '📖 Studying', test_pending: '📝 Test Pending', needs_revision: '🔄 Needs Revision', completed: '✅ Completed' }[s];
      return `<span class="exam-badge ${s === 'completed' ? 'exam-badge-green' : s === 'needs_revision' ? 'exam-badge-red' : s === 'test_pending' ? 'exam-badge-yellow' : 'exam-badge-gray'}">${label} · ${n}</span>`;
    }).join(' ');

    let html = `
      <div class="exam-page-header">
        <h1 class="exam-h1">📊 Exam Study Dashboard</h1>
        <div class="exam-subtitle">Study your college subjects from uploaded PDFs.</div>
      </div>

      <div class="exam-grid exam-grid-4 exam-mb-16">
        <div class="exam-card exam-stat-tile"><div class="exam-stat-value">${t.subjects ?? 0}</div><div class="exam-stat-label">Subjects</div></div>
        <div class="exam-card exam-stat-tile"><div class="exam-stat-value">${t.completed_chapters ?? 0}/${t.total_chapters ?? 0}</div><div class="exam-stat-label">Chapters Completed</div></div>
        <div class="exam-card exam-stat-tile"><div class="exam-stat-value">${t.avg_score_all ?? 0}%</div><div class="exam-stat-label">Avg Test Score</div></div>
        <div class="exam-card exam-stat-tile"><div class="exam-stat-value">${t.open_weak_topics ?? 0}</div><div class="exam-stat-label">Weak Topics Open</div></div>
      </div>

      <div class="exam-card exam-mb-16">
        <div class="exam-flex-between">
          <h2 class="exam-h2">Chapter Status</h2>
        </div>
        <div class="exam-chip-row">${statusBar || ui.esc('No chapters yet — upload a PDF to begin.')}</div>
      </div>`;

    if (subjects.length === 0) {
      html += `
        <div class="exam-card exam-text-center exam-empty">
          <div class="exam-empty-icon">📄</div>
          <div class="exam-empty-title">No subjects yet</div>
          <div>Upload your first subject PDF to start studying.</div>
          <div class="exam-mt-16"><button class="exam-btn" data-action="go-upload">📄 Upload PDF</button></div>
        </div>`;
    } else {
      html += `<div class="exam-grid exam-grid-3 exam-mb-16">`;
      for (const s of subjects) {
        html += `
          <div class="exam-subject-card" data-action="open-subject" data-id="${s.id}">
            <div class="exam-flex-between">
              <div class="exam-subject-name">${ui.esc(s.name)}</div>
              ${ui.statusBadge(s.status === 'ready' || s.total_chapters > 0 ? (s.completed_chapters === s.total_chapters && s.total_chapters > 0 ? 'completed' : 'studying') : 'not_started')}
            </div>
            <div class="exam-subject-meta">${s.completed_chapters}/${s.total_chapters} chapters done</div>
            <div>${ui.progressBar(s.overall_progress)}</div>
            <div class="exam-subject-stats">
              <span class="exam-badge exam-badge-blue">${s.overall_progress}% overall</span>
              <span class="exam-badge ${s.avg_score >= 60 ? 'exam-badge-green' : 'exam-badge-red'}">Avg ${s.avg_score}%</span>
            </div>
          </div>`;
      }
      html += `</div>`;
    }

    if (recent.length) {
      html += `<div class="exam-card">
        <h2 class="exam-h2">Recent Test Results</h2>
        <div class="exam-table-wrap"><table class="exam-table">
          <thead><tr><th>Subject</th><th>Chapter</th><th>Score</th><th>%</th><th>Result</th><th>When</th></tr></thead>
          <tbody>`;
      for (const r of recent) {
        const passed = r.passed ? 1 : 0;
        html += `<tr>
          <td>${ui.esc(r.subject_name)}</td>
          <td>${ui.esc(r.chapter_title)}</td>
          <td>${r.score}/${r.total_questions}</td>
          <td><b>${r.percentage}%</b></td>
          <td><span class="exam-badge ${passed ? 'exam-badge-green' : 'exam-badge-red'}">${passed ? '✅ Passed' : '❌ Failed'}</span></td>
          <td class="exam-nowrap">${ui.esc(r.timestamp)}</td>
        </tr>`;
      }
      html += `</tbody></table></div></div>`;
    }

    content.innerHTML = html;
    wireContent(content);
  }

  /* ================= MY SUBJECTS ================= */
  async function renderSubjects(content) {
    const subjects = await app.getSubjects(true);
    let html = `
      <div class="exam-page-header">
        <h1 class="exam-h1">🗂️ My Subjects</h1>
        <div class="exam-subtitle">All subjects uploaded for exam study.</div>
      </div>
      <div class="exam-mb-16"><button class="exam-btn" data-action="go-upload">📄 Upload New PDF</button></div>`;

    if (subjects.length === 0) {
      html += ui.empty('📚', 'No subjects yet', 'Upload a subject PDF to begin. Click "Upload PDF" in the sidebar.');
    } else {
      html += `<div class="exam-card exam-table-wrap"><table class="exam-table">
        <thead><tr><th>Subject</th><th>Status</th><th>Chapters</th><th>Progress</th><th>Avg Score</th><th>Actions</th></tr></thead>
        <tbody>`;
      for (const s of subjects) {
        const processing = s.status === 'processing';
        html += `<tr>
          <td><b>${ui.esc(s.name)}</b><div class="exam-muted">${ui.esc(s.pdf_original_name)}</div></td>
          <td>${processing ? '<span class="exam-badge exam-badge-yellow">⏳ Processing</span>' : (s.status === 'failed' ? '<span class="exam-badge exam-badge-red">Failed</span>' : '<span class="exam-badge exam-badge-green">✅ Ready</span>')}</td>
          <td>${s.total_chapters}</td>
          <td style="min-width:120px">${ui.progressBar(s.overall_progress)} <span class="exam-muted">${s.overall_progress}%</span></td>
          <td><b>${s.avg_score}%</b></td>
          <td class="exam-nowrap">
            <button class="exam-btn exam-btn-sm exam-btn-primary" data-action="open-subject" data-id="${s.id}">Open</button>
            <button class="exam-btn exam-btn-sm exam-btn-ghost" data-action="delete-subject" data-id="${s.id}" data-name="${ui.esc(s.name)}">Delete</button>
          </td>
        </tr>`;
      }
      html += `</tbody></table></div>`;
    }
    content.innerHTML = html;
    wireContent(content);
  }

  /* ================= SUBJECT CHAPTERS ================= */
  function renderSubjectNotFound(content, message) {
    content.innerHTML = `<div class="exam-card"><div class="exam-empty">
      <div class="exam-empty-icon">🚫</div>
      <div class="exam-empty-title">Subject not found</div>
      <div class="exam-mt-8">${ui.esc(message)}</div>
      <div class="exam-mt-16"><button class="exam-btn" data-action="go-back-subjects">← Back to My Subjects</button></div>
    </div></div>`;
    wireContent(content);
  }

  async function renderSubjectChapters(subjectId, content) {
    let data;
    try {
      data = await app.loadChapters(subjectId);
    } catch (e) {
      renderSubjectNotFound(content, (e && e.message) || 'Subject not found.');
      return;
    }
    const subj = data.subject;
    const chapters = data.chapters || [];
    const done = chapters.filter((c) => c.status === 'completed').length;
    const pct = chapters.length ? Math.round((done / chapters.length) * 100) : 0;

    let html = `
      <div class="exam-flex-between exam-mb-16">
        <div>
          <button class="exam-btn exam-btn-ghost exam-btn-sm exam-mb-8" data-action="go-back-subjects">← My Subjects</button>
          <h1 class="exam-h1">${ui.esc(subj.name)}</h1>
          <div class="exam-subtitle">${ui.esc(subj.pdf_original_name)} · ${subj.page_count || '?'} pages · ${chapters.length} chapters · ${subj.doc_count || 1} PDF source(s)</div>
        </div>
        <div class="exam-flex exam-gap-md">
          ${ui.ring(pct, 72, 7)}
          ${chapters.length ? `<button class="exam-btn exam-btn-sm exam-btn-primary" data-action="mock-test" data-id="${subj.id}">🎯 Full Subject Mock Test</button>` : ''}
          <button class="exam-btn exam-btn-sm exam-btn-ghost" data-action="pdf-view" data-id="${subj.id}">📄 View PDF</button>
        </div>
      </div>`;

    if (subj.status === 'processing') {
      const n = (processingWatchdog[subjectId] || 0) + 1;
      processingWatchdog[subjectId] = n;
      if (n >= 30) {
        delete processingWatchdog[subjectId];
        html += `<div class="exam-card"><div class="exam-empty">
          <div class="exam-empty-icon">⏳</div>
          <div class="exam-empty-title">Still processing…</div>
          <div class="exam-mt-8">This is taking longer than a minute. The upload may have been interrupted or the PDF is very large. You can try again, or remove and re-upload the subject if it stays stuck.</div>
          <div class="exam-mt-16"><button class="exam-btn exam-btn-primary" data-action="subject-reload">↻ Try Again</button></div>
        </div></div>`;
        content.innerHTML = html;
        wireContent(content);
        return;
      }
      html += `<div class="exam-card">${ui.spinner('Processing PDF and detecting chapters…')}</div>`;
      content.innerHTML = html;
      setTimeout(() => renderSubjectChapters(subjectId, content), 2500);
      return;
    }
    delete processingWatchdog[subjectId];
    if (subj.status === 'failed') {
      html += `<div class="exam-card"><div class="exam-empty">
        <div class="exam-empty-icon">⚠️</div>
        <div class="exam-empty-title">PDF could not be processed</div>
        <div>Could not extract readable text. The PDF may be scanned/image-only.</div></div></div>`;
      content.innerHTML = html;
      return;
    }

    const totalTopics = subj.total_topics || 0;
    const openWeak = subj.open_weak_topics || 0;
    const avgScore = subj.avg_score || 0;

    html += `<div class="exam-grid exam-grid-4 exam-mb-16">
      <div class="exam-card exam-stat-tile"><div class="exam-stat-value">${totalTopics}</div><div class="exam-stat-label">Total Topics</div></div>
      <div class="exam-card exam-stat-tile"><div class="exam-stat-value">${done}/${chapters.length}</div><div class="exam-stat-label">Units Complete</div></div>
      <div class="exam-card exam-stat-tile"><div class="exam-stat-value">${avgScore}%</div><div class="exam-stat-label">Test Average</div></div>
      <div class="exam-card exam-stat-tile"><div class="exam-stat-value">${openWeak}</div><div class="exam-stat-label">Weak Topics</div></div>
    </div>
    <div class="exam-flex exam-gap-sm exam-mb-16" style="flex-wrap:wrap">
      <span class="exam-badge exam-badge-green">✅ Strong Units: ${chapters.filter((c) => (c.best_score || 0) >= 60).length}</span>
      <span class="exam-badge exam-badge-red">🔄 Revision Required: ${subj.revision_required_units || 0} unit(s)</span>
      <span class="exam-badge exam-badge-purple">❓ Questions: ${subj.total_questions || 0}</span>
      <span class="exam-badge exam-badge-blue">🎯 Exam-Important Units: ${subj.exam_important_units || 0}</span>
      <span class="exam-badge exam-badge-yellow">🎯 Mock Tests: ${subj.mock_attempts || 0}</span>
    </div>`;

    if (chapters.length === 0) {
      html += `<div class="exam-card">${ui.empty('🔍', 'No chapters detected', 'Could not find clear chapter headings in the PDF.')}</div>`;
    } else {
      html += `<div class="exam-card">
        <h2 class="exam-h2">Chapters</h2>
        <div class="exam-table-wrap"><table class="exam-table">
          <thead><tr><th>#</th><th>Chapter</th><th>Status</th><th>Content</th><th>Best Score</th><th>Weak</th><th></th></tr></thead>
          <tbody>`;
      for (const c of chapters) {
        let contentBadge = '';
        if (c.summary_viewed && c.content_ready || c.summary_ready) contentBadge = '<span class="exam-badge exam-badge-green">📖 Studied</span>';
        else if (c.summary_ready || c.content_ready) contentBadge = '<span class="exam-badge exam-badge-blue">📖 Summary Ready</span>';
        else contentBadge = '<span class="exam-badge exam-badge-gray">📖 Not Generated</span>';
        let unitLabel = c.unit_type && c.unit_no ? `<span class="exam-badge exam-badge-purple">${ui.esc(c.unit_type)} ${ui.esc(c.unit_no)}</span> ` : '';
        if (c.content_level === 'syllabus') unitLabel += '<span class="exam-badge exam-badge-yellow">Syllabus only</span> ';
        html += `<tr>
          <td>${c.order_index}</td>
          <td><b>${ui.esc(c.title)}</b><div class="exam-muted">${unitLabel}Page ${c.start_page || '?'}</div></td>
          <td>${ui.statusBadge(c.status)}</td>
          <td>${contentBadge}</td>
          <td>${c.best_score ? '<b>' + c.best_score + '%</b>' : '<span class="exam-muted">—</span>'}</td>
          <td>${c.open_weak_topics ? '<span class="exam-badge exam-badge-red">🔴 ' + c.open_weak_topics + '</span>' : '<span class="exam-badge exam-badge-green">🟢 0</span>'}</td>
          <td><button class="exam-btn exam-btn-sm exam-btn-primary" data-action="open-chapter" data-id="${c.id}">Study</button></td>
        </tr>`;
      }
      html += `</tbody></table></div></div>`;
    }
    content.innerHTML = html;
    wireContent(content);
  }

  /* ================= UPLOAD PDF ================= */
  async function renderUpload(content) {
    const subjects = await app.getSubjects();
    const subjectOpts = (subjects || []).length
      ? `<div class="exam-form-group">
          <label class="exam-label">Attach to Existing Subject? (optional)</label>
          <select class="exam-input" id="exam-attach-subject">
            <option value="0">+ Create a New Subject…</option>
            ${(subjects || []).map((s) => `<option value="${s.id}">${ui.esc(s.name)} (${s.doc_count || 0} PDFs)</option>`).join('')}
          </select>
          <div class="exam-muted exam-mt-8" style="font-size:12px">Pick a subject to add this PDF as an additional source (Syllabus, Textbook, Notes…). Its chapters merge with the ones already detected.</div>
        </div>`
      : '';

    let html = `
      <div class="exam-page-header">
        <h1 class="exam-h1">📄 Upload PDF</h1>
        <div class="exam-subtitle">Upload a subject PDF (syllabus, textbook, notes, or any study material). The system extracts text, detects units/chapters, and builds your study system from the PDF content only.</div>
      </div>
      <div class="exam-card">
        <div class="exam-dropzone" id="exam-dropzone">
          <div class="exam-dropzone-icon">📄</div>
          <div class="exam-dropzone-title" id="exam-dz-title">Drop your PDF here or click to browse</div>
          <div class="exam-dropzone-sub">Only .pdf files · max 50 MB · scanned image-only PDFs may not work</div>
        </div>
        <input type="file" id="exam-file-input" accept="application/pdf,.pdf" class="exam-hide">
        ${subjectOpts}
        <div class="exam-form-group exam-mt-16" id="exam-subject-name-wrap">
          <label class="exam-label">Subject Name</label>
          <input class="exam-input" id="exam-subject-name" placeholder="e.g. Database Management Systems">
        </div>
        <div class="exam-form-group">
          <label class="exam-label">What type of PDF is this?</label>
          <select class="exam-input" id="exam-doc-type">
            <option value="auto">Detect automatically</option>
            <option value="syllabus">Syllabus / Course Outline</option>
            <option value="textbook">Textbook</option>
            <option value="notes">Notes / Handouts</option>
            <option value="general">General Study Material</option>
          </select>
          <div class="exam-muted exam-mt-8" style="font-size:12px">For a syllabus, only the detected outline is stored — detailed theory is never invented; it is generated once a textbook/notes PDF is added.</div>
        </div>
        <div class="exam-grid exam-grid-2" id="exam-test-options">
          <div class="exam-form-group">
            <label class="exam-label">Passing Score (%)</label>
            <input class="exam-input" id="exam-passing-score" type="number" min="1" max="100" value="60">
          </div>
          <div class="exam-form-group">
            <label class="exam-label">Questions per Test</label>
            <input class="exam-input" id="exam-questions-count" type="number" min="3" max="30" value="10">
          </div>
        </div>
        <div id="exam-upload-progress"></div>
        <button class="exam-btn exam-btn-lg" id="exam-upload-btn" disabled>🚀 Upload & Analyze</button>
      </div>`;
    content.innerHTML = html;
    wireContent(content);

    const attachSel = document.getElementById('exam-attach-subject');
    if (attachSel) {
      const nameWrap = document.getElementById('exam-subject-name-wrap');
      const testOpts = document.getElementById('exam-test-options');
      attachSel.addEventListener('change', () => {
        const existing = parseInt(attachSel.value, 10) > 0;
        nameWrap.style.display = existing ? 'none' : '';
        testOpts.style.display = existing ? 'none' : '';
      });
    }

    const dz = document.getElementById('exam-dropzone');
    const input = document.getElementById('exam-file-input');
    const fileState = { file: null };

    dz.addEventListener('click', () => input.click());
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('dragover');
      if (e.dataTransfer.files[0]) fileState.file = e.dataTransfer.files[0];
      if (fileState.file) setFile(fileState.file);
    });
    input.addEventListener('change', () => { if (input.files[0]) fileState.file = input.files[0]; if (fileState.file) setFile(fileState.file); });

    function setFile(f) {
      document.getElementById('exam-dz-title').textContent = f.name + ' (' + Math.round(f.size / 1024) + ' KB)';
      document.getElementById('exam-upload-btn').disabled = false;
    }

    document.getElementById('exam-upload-btn').addEventListener('click', async () => {
      const file = fileState.file;
      if (!file) return ui.toast('Please choose a PDF file first.', 'warning');
      const attachId = parseInt((document.getElementById('exam-attach-subject') || {}).value || '0', 10) || 0;
      const docType = (document.getElementById('exam-doc-type') || {}).value || 'auto';
      const name = document.getElementById('exam-subject-name').value.trim() || file.name.replace(/\.pdf$/i, '');
      const passing = parseInt(document.getElementById('exam-passing-score').value, 10) || 60;
      const qcount = parseInt(document.getElementById('exam-questions-count').value, 10) || 10;
      const btn = document.getElementById('exam-upload-btn');
      btn.disabled = true; btn.textContent = '⏳ Uploading & analyzing…';

      const form = new FormData();
      form.append('pdf', file);
      form.append('name', name);
      form.append('passing_score', passing);
      form.append('questions_per_test', qcount);
      if (attachId > 0) form.append('subject_id', attachId);
      form.append('doc_type', docType);

      try {
        const res = await ui.api('api/upload.php', { method: 'POST', form, raw: true });
        if (!res.success) throw new Error(res.error?.message || 'Upload failed');
        ui.toast('PDF uploaded and analyzed! ' + (res.data.chapter_count || 0) + ' chapters detected.', 'success');
        document.getElementById('exam-upload-progress').innerHTML = `
          <div class="exam-card exam-mt-16">
            <h3>Detected Chapters (${res.data.chapter_count || 0})</h3>
            <div class="exam-chip-row exam-mt-8">` +
              (res.data.chapters || []).map((c, i) => `<span class="exam-badge exam-badge-blue">${i + 1}. ${ui.esc(c.title)}</span>`).join(' ') +
            `</div>
            <div class="exam-mt-16"><button class="exam-btn exam-btn-success" data-action="open-subject" data-id="${res.data.subject_id}">Open Subject →</button></div>
          </div>`;
        wireContent(content);
      } catch (e) {
        ui.toast(e.message, 'error');
        btn.disabled = false; btn.textContent = '🚀 Upload & Analyze';
      }
    });
  }

  /* ================= WEAK TOPICS ================= */
  async function renderWeak(content) {
    const rows = await ui.api('api/results.php?all=1');
    let html = `
      <div class="exam-page-header">
        <h1 class="exam-h1">⚠️ Weak Topics</h1>
        <div class="exam-subtitle">Topics where you made mistakes. Revise and retest them.</div>
      </div>`;
    if (rows.length === 0) {
      html += ui.empty('🎉', 'No weak topics!', 'Great job — keep it up.');
    } else {
      html += `<div class="exam-grid"><div class="exam-card">
        <h2 class="exam-h2">Open Weak Topics</h2>`;
      for (const w of rows) {
        html += `
          <div class="exam-weak-card" id="wt-${w.id}">
            <div class="exam-weak-head">
              <div class="exam-weak-topic">🔴 ${ui.esc(w.topic_name)}
                <span class="exam-badge exam-badge-gray">${ui.esc(w.subject_name)}</span>
                <span class="exam-badge exam-badge-blue">${ui.esc(w.chapter_title)}</span>
              </div>
              <div class="exam-flex exam-gap-sm">
                <button class="exam-btn exam-btn-sm exam-btn-primary" data-action="retest-chapter" data-chap="${w.chapter_id}" data-weak="${w.id}">📝 Retest</button>
                <button class="exam-btn exam-btn-sm exam-btn-success" data-action="resolve-weak" data-id="${w.id}">✓ Resolved</button>
              </div>
            </div>
            <div class="exam-weak-why"><b>Why weak:</b> ${ui.esc(w.why_weak || 'Not answered correctly in a recent test.')}</div>
            ${w.revision_notes ? `<div class="exam-weak-why"><b>Revision notes:</b> ${ui.esc(w.revision_notes)}</div>` : ''}
            <button class="exam-btn exam-btn-sm exam-btn-ghost exam-mt-8" data-action="open-chapter-rev" data-id="${w.chapter_id}">Open chapter →</button>
          </div>`;
      }
      html += `</div></div>`;
    }
    content.innerHTML = html;
    wireContent(content);
  }

  /* ================= TESTS HISTORY ================= */
  async function renderTests(content) {
    const subjects = await app.getSubjects();
    let html = `
      <div class="exam-page-header">
        <h1 class="exam-h1">📝 Tests</h1>
        <div class="exam-subtitle">Test history across all subjects.</div>
      </div>` + ui.empty('📝', 'Loading test history…');

    content.innerHTML = html;

    let all = [];
    for (const s of subjects) {
      try {
        const chaps = await ui.api('api/chapters.php?subject_id=' + s.id);
        for (const c of chaps.chapters) {
          const r = await ui.api('api/results.php?chapter_id=' + c.id + '&subject_id=' + s.id);
          for (const a of r.attempts) {
            all.push({ subject: s.name, chapter: c.title, attempt: a });
          }
        }
      } catch (e) { /* skip */ }
    }

    if (all.length === 0) {
      html = `
        <div class="exam-page-header">
          <h1 class="exam-h1">📝 Tests</h1>
          <div class="exam-subtitle">Test history across all subjects.</div>
        </div>` + ui.empty('📝', 'No tests attempted yet', 'Open a chapter, study, then take the chapter test.');
      content.innerHTML = html;
      return;
    }

    all.sort((a, b) => b.attempt.timestamp.localeCompare(a.attempt.timestamp));
    html = `
      <div class="exam-page-header">
        <h1 class="exam-h1">📝 Tests</h1>
        <div class="exam-subtitle">Test history across all subjects.</div>
      </div>
      <div class="exam-card exam-table-wrap"><table class="exam-table">
        <thead><tr><th>Subject</th><th>Chapter</th><th>Score</th><th>%</th><th>Result</th><th>Type</th><th>When</th></tr></thead>
        <tbody>`;
    for (const { subject, chapter, attempt } of all) {
      html += `<tr>
        <td>${ui.esc(subject)}</td>
        <td>${ui.esc(chapter)}</td>
        <td>${attempt.score}/${attempt.total_questions}</td>
        <td><b>${attempt.percentage}%</b></td>
        <td><span class="exam-badge ${attempt.passed ? 'exam-badge-green' : 'exam-badge-red'}">${attempt.passed ? '✅ Passed' : '❌ Failed'}</span></td>
        <td>${attempt.test_type === 'retest' ? '<span class="exam-badge exam-badge-purple">Retest</span>' : attempt.test_type === 'subject' ? '<span class="exam-badge exam-badge-yellow">🎯 Mock</span>' : '<span class="exam-badge exam-badge-blue">Full</span>'}</td>
        <td class="exam-nowrap">${ui.esc(attempt.timestamp)}</td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
    content.innerHTML = html;
  }

  /* ================= REVISION ================= */
  async function renderRevision(content) {
    const rows = await ui.api('api/results.php?all=1');
    let html = `
      <div class="exam-page-header">
        <h1 class="exam-h1">🔄 Revision</h1>
        <div class="exam-subtitle">Revise weak topics, read revision notes, then retest.</div>
      </div>`;
    if (rows.length === 0) {
      html += ui.empty('✅', 'Nothing to revise', 'All topics clear. You are fully up to date!');
    } else {
      html += `<div class="exam-card">
        <h2 class="exam-h2">Revision List</h2>`;
      for (const w of rows) {
        html += `
          <div class="exam-weak-card">
            <div class="exam-weak-head">
              <div class="exam-weak-topic">🔴 ${ui.esc(w.topic_name)}
                <span class="exam-badge exam-badge-blue">${ui.esc(w.chapter_title)}</span>
                <span class="exam-badge exam-badge-gray">${ui.esc(w.subject_name)}</span>
              </div>
              <button class="exam-btn exam-btn-sm exam-btn-primary" data-action="retest-chapter" data-chap="${w.chapter_id}" data-weak="${w.id}">📝 Retest Weak Topics</button>
            </div>
            <form class="exam-weak-notes" data-action="save-notes" data-id="${w.id}">
              <label class="exam-label">Revision Notes</label>
              <textarea class="exam-textarea" rows="2" placeholder="Write your revision note / short explanation…">${ui.esc(w.revision_notes || '')}</textarea>
              <div class="exam-mt-8"><button class="exam-btn exam-btn-sm exam-btn-success">💾 Save Notes</button></div>
            </form>
          </div>`;
      }
      html += `</div>`;
    }
    content.innerHTML = html;
    wireContent(content);
  }

  /* ================= FINAL SUMMARIES ================= */
  async function renderSummaries(content) {
    const subjects = await app.getSubjects();
    let html = `
      <div class="exam-page-header">
        <h1 class="exam-h1">🏆 Final Summaries</h1>
        <div class="exam-subtitle">One-page exam revision summary per subject.</div>
      </div>`;

    if (subjects.length === 0) {
      html += ui.empty('🏆', 'No subjects yet', 'Upload a PDF to generate a final summary.');
      content.innerHTML = html;
      return;
    }

    for (const s of subjects) {
      let rowHtml = `<div class="exam-card">
        <div class="exam-flex-between">
          <h2 class="exam-h2">${ui.esc(s.name)}</h2>
          <div class="exam-flex exam-gap-sm">
            <button class="exam-btn exam-btn-sm exam-btn-primary" data-action="mock-test" data-id="${s.id}">🎯 Mock Test</button>
            <button class="exam-btn exam-btn-sm exam-btn-ghost" data-action="generate-final" data-id="${s.id}">⚡ Generate / Refresh</button>
          </div>
        </div>`;
      try {
        const fs = await ui.api('api/final_summaries.php?subject_id=' + s.id);
        if (fs.generated) {
          rowHtml += `<div class="exam-summary-body exam-mt-8">${ui.esc(fs.summary.content)}</div>
            <div class="exam-muted exam-mt-8">Word count: ${fs.summary.word_count} · ${ui.esc(fs.summary.generated_at)}</div>`;
        } else {
          rowHtml += `<div class="exam-muted exam-mt-8">No final summary yet. Generate one when chapters are complete.</div>`;
        }
      } catch (e) {
        rowHtml += `<div class="exam-muted exam-mt-8">${ui.esc(e.message)}</div>`;
      }
      rowHtml += `</div>`;
      html += rowHtml;
    }
    content.innerHTML = html;
    wireContent(content);
  }

  /* ---------- Global event wiring ---------- */
  function wireContent(root) {
    root.addEventListener('click', async (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action;

      if (action === 'go-upload') { app.navigate('upload'); }
      else if (action === 'go-back-subjects') { app.navigate('subjects'); }
      else if (action === 'subject-reload') { location.reload(); }
      else if (action === 'open-subject') { app.navigate('subject', el.dataset.id); }
      else if (action === 'open-chapter' || action === 'open-chapter-rev') {
        // need subject id too — fetch chapter
        try {
          const chaps = await EXAM.study.findSubjectForChapter(el.dataset.id);
          const sid = chaps.subject_id || chaps.subjectId || null;
          if (!sid) { ui.toast('Subject not found for this chapter.', 'error'); return; }
          app.go('subject', sid, el.dataset.id);
        } catch (err) { ui.toast(err.message, 'error'); }
      }
      else if (action === 'delete-subject') {
        const id = el.dataset.id;
        ui.modal('Delete Subject', `<p class="exam-mb-16">Delete <b>${el.dataset.name}</b> and all its chapters, tests and progress?</p>
          <div class="exam-flex exam-gap-sm"><button class="exam-btn exam-btn-danger" id="exam-confirm-delete">Delete</button>
          <button class="exam-btn exam-btn-ghost" data-close-modal="1">Cancel</button></div>`, 420);
        document.getElementById('exam-confirm-delete').addEventListener('click', async () => {
          try {
            await ui.api('api/subjects.php', { method: 'POST', body: { action: 'delete', id } });
            ui.closeModal();
            ui.toast('Subject deleted.', 'success');
            app.state.subjectsCache = null;
            render();
          } catch (err) { ui.toast(err.message, 'error'); }
        });
      }
      else if (action === 'pdf-view') {
        EXAM.pdf.open('api/pdf.php?subject_id=' + el.dataset.id);
      }
      else if (action === 'mock-test') {
        EXAM.tests.startMock(el.dataset.id);
      }
      else if (action === 'retest-chapter') {
        EXAM.tests.retestWeak(el.dataset.chap, el.dataset.weak);
      }
      else if (action === 'resolve-weak') {
        await ui.api('api/results.php', { method: 'POST', body: { action: 'resolve', id: el.dataset.id } });
        ui.toast('Weak topic resolved 🎉', 'success');
        render();
      }
      else if (action === 'generate-final') {
        const id = el.dataset.id;
        el.disabled = true; el.textContent = '⏳ Generating…';
        EXAM.ui.modal('🏆 Final Summary', EXAM.ui.spinner('Starting final-summary generation…'), 800);
        try {
          const res = await ui.api('api/final_summaries.php', { method: 'POST', body: { subject_id: id }, raw: true });
          if (!res.success) throw new Error(res.error?.message);
          const jobId = res.data && res.data.job_id;
          if (!jobId) throw new Error('Could not start the final summary job.');
          EXAM.ui.modalBody(EXAM.ui.spinner('Generating final summary from chapter content… (runs in the background, may take a couple of minutes)'));
          ui.startJob(jobId);
          await ui.pollJob(jobId);
          EXAM.ui.closeModal();
          ui.toast('Final summary generated.', 'success');
          el.disabled = false; el.textContent = '⚡ Generate / Refresh';
          exam_rerenderSummaries();
        } catch (err) { EXAM.ui.closeModal(); ui.toast(err.message, 'error'); el.disabled = false; el.textContent = '⚡ Generate / Refresh'; }
      }
    });

    // form submit handling for revision notes
    root.addEventListener('submit', async (e) => {
      const form = e.target.closest('form[data-action="save-notes"]');
      if (!form) return;
      e.preventDefault();
      const id = form.dataset.id;
      const notes = form.querySelector('textarea').value;
      await ui.api('api/results.php', { method: 'POST', body: { action: 'update_weak', id, revision_notes: notes } });
      ui.toast('Revision notes saved.', 'success');
    });
  }

  window.EXAM = EXAM;
  EXAM._wireContent = wireContent;

  /* ---------- Boot ---------- */
  function renderBootError(msg) {
    const content = document.getElementById('exam-content');
    if (!content || content.querySelector('.exam-empty, .exam-h1')) return;
    content.innerHTML = '<div class="exam-empty">' +
      '<div class="exam-empty-icon">⚠️</div>' +
      '<div class="exam-empty-title">Startup failed</div>' +
      '<div class="exam-mt-8">' + (msg ? String(msg) : 'An unexpected error happened while starting the app.') + '</div>' +
      '</div>';
  }

  /* ---------- Boot watchdog: if a render produces nothing within N seconds,
     replace the eternal "Loading…" with a visible, actionable error ---------- */
  function armBootWatchdog(ms) {
    const wait = (ms > 0) ? ms : 15000;
    setTimeout(function () {
      const content = document.getElementById('exam-content');
      if (!content) return;
      const seen = content.querySelector(
        '.exam-h1, .exam-h2, .exam-table, .exam-subject-card, .exam-stat-tile, .exam-empty, ' +
        '.exam-summary-body, .exam-tabs, .exam-dropzone, .exam-form-group, .exam-card');
      if (seen) return;
      content.innerHTML = '<div class="exam-empty">' +
        '<div class="exam-empty-icon">⏳</div>' +
        '<div class="exam-empty-title">The dashboard is stuck loading</div>' +
        '<div class="exam-mt-8">A request is still pending after ' + Math.round(wait / 1000) + 's. ' +
          'This is usually a temporary network block or a stale cached page.</div>' +
        '<div class="exam-mt-16"><button class="exam-btn exam-btn-primary" data-action="boot-retry">↻ Try Again</button></div>' +
        '</div>';
      const btn = content.querySelector('[data-action="boot-retry"]');
      if (btn) btn.addEventListener('click', function () { render(); });
    }, wait);
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      setupSidebar();
      window.addEventListener('hashchange', render);
      render();
      EXAM.pdf.workerSetup();
    } catch (err) {
      renderBootError((err && err.message) || '');
    }
  });

  async function exam_rerenderSummaries() {
    const content = document.getElementById('exam-content');
    await renderSummaries(content);
  }

  // expose helpers to study module
  app.render = render;
  app.renderRevision = renderRevision;
  app.renderWeak = renderWeak;
})();