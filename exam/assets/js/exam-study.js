/* ============================================================
   EXAM STUDY DASHBOARD - Chapter Study View
   Tabs: Summary -> Definitions -> Theory -> Points -> Questions
         -> Q&A -> Test -> Result -> Revision
         (Summary FIRST, Test AFTER study)
   ============================================================ */
(function () {
  'use strict';
  const EXAM = window.EXAM = window.EXAM || {};
  const ui = EXAM.ui;
  const study = EXAM.study = {};

  const TABS = [
    { id: 'summary', icon: '📖', label: 'Summary' },
    { id: 'definitions', icon: '📌', label: 'Definitions' },
    { id: 'theory', icon: '🧠', label: 'Theory' },
    { id: 'points', icon: '⭐', label: 'Important Points' },
    { id: 'questions', icon: '❓', label: 'Important Questions' },
    { id: 'answers', icon: '✍️', label: 'Question Answers' },
    { id: 'test', icon: '📝', label: 'Test' },
    { id: 'result', icon: '📊', label: 'Result' },
    { id: 'revision', icon: '🔄', label: 'Revision' },
  ];

  study.findSubjectForChapter = async function (chapterId) {
    return await ui.api('api/chapters.php?id=' + chapterId);
  };

  study.render = async function (subjectId, chapterId, content) {
    // Load chapter meta (for title) + content
    const page = {
      chapterId, subjectId, content,
      data: null,
      activeTab: 'summary',
      lastResult: null,
    };
    study._page = page;
    if (study._initialTab) { page.activeTab = study._initialTab; study._initialTab = null; }
    await loadChapter(page);
    drawFrame(page);
    wireTabs(page);
    await openTab(page, page.activeTab);
  };

  async function loadChapter(page) {
    const data = await ui.api('api/summaries.php?chapter_id=' + page.chapterId);
    page.data = data;
  }

  function drawFrame(page) {
    const d = page.data;
    const ch = d.chapter;
    page.content.innerHTML = `
      <button class="exam-btn exam-btn-ghost exam-btn-sm exam-mb-8" data-study="back">← Back to Chapters</button>
      <div class="exam-flex-between exam-mb-16">
        <div>
          <h1 class="exam-h1">${ui.esc(ch.title)}</h1>
          <div class="exam-subtitle">${ui.esc(ch.subject_name)} · ${ui.statusBadge(ch.status)}</div>
        </div>
        <div class="exam-flex exam-gap-sm">
          <button class="exam-btn exam-btn-sm exam-btn-ghost" data-study="regenerate">↻ Regenerate Content</button>
          <button class="exam-btn exam-btn-sm exam-btn-ghost" data-study="pdf">📄 PDF</button>
        </div>
      </div>

      <div class="exam-tabs" id="exam-study-tabs">
        ${TABS.map((t) => `<button class="exam-tab" data-tab="${t.id}"><span>${ui.esc(t.icon)}</span> ${ui.esc(t.label)}</button>`).join('')}
      </div>
      <div id="exam-study-body"></div>`;

    const subj = page.data && page.data.chapter ? page.data.chapter.subject_id : page.subjectId;
    page.content.querySelector('[data-study="back"]').addEventListener('click', () => {
      EXAM.app.go('subject', subj);
    });
    page.content.querySelector('[data-study="pdf"]').addEventListener('click', () => {
      EXAM.pdf.open('api/pdf.php?subject_id=' + subj, { page: (page.data.chapter.start_page || 1) });
    });
    page.content.querySelector('[data-study="regenerate"]').addEventListener('click', () => regenerateChapter(page));
  }

  // Show (or update) an inline error banner at the top of the study body.
  function showErrorBanner(page, message) {
    const body = page.content.querySelector('#exam-study-body');
    if (!body) return;
    let banner = body.querySelector('.exam-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'exam-error-banner';
      body.prepend(banner);
    }
    banner.innerHTML = `<span class="exam-error-banner-icon">⚠️</span><span class="exam-error-banner-text"></span><button class="exam-error-banner-close" title="Dismiss">×</button>`;
    banner.querySelector('.exam-error-banner-text').textContent = message;
    banner.querySelector('.exam-error-banner-close').addEventListener('click', () => banner.remove());
  }

  // Full chapter regeneration (deletes + regenerates everything on the server).
  // Runs as an asynchronous background job; we poll until it finishes.
  async function regenerateChapter(page) {
    const btn = page.content.querySelector('[data-study="regenerate"]');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="exam-spinner"></span> ⏳ Regenerating…';
    try {
      const res = await ui.api('api/chapters.php', { method: 'POST', body: { action: 'regenerate', id: page.chapterId }, raw: true });
      if (typeof window !== 'undefined' && res.error) throw new Error(res.error.message);
      const jobId = res.data && res.data.job_id;
      if (!jobId) throw new Error('Could not start the regeneration job.');
      ui.startJob(jobId);
      await ui.pollJob(jobId, {
        onProgress: () => { btn.innerHTML = '<span class="exam-spinner"></span> ⏳ Regenerating with AI… (background job)'; },
      });
      const stillHere = document.getElementById('exam-content') === page.content;
      if (stillHere) {
        ui.toast('Content regenerated with AI ✨', 'success');
        await loadChapter(page);
        await openTab(page, 'summary');
      } else {
        ui.toast('Regeneration finished in background.', 'success');
      }
    } catch (e) {
      showErrorBanner(page, e.message);
      ui.toast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  }

  function wireTabs(page) {
    page.content.querySelectorAll('.exam-tab').forEach((tb) => {
      tb.addEventListener('click', () => openTab(page, tb.dataset.tab));
    });
    page.content.querySelector('#exam-study-tabs').addEventListener('click', (e) => {
      const tb = e.target.closest('.exam-tab');
      if (tb) {
        page.content.querySelectorAll('.exam-tab').forEach((t) => t.classList.toggle('active', t === tb));
      }
    });
  }

  async function openTab(page, tabId) {
    page.activeTab = tabId;
    page.content.querySelectorAll('.exam-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    const body = page.content.querySelector('#exam-study-body');

    switch (tabId) {
      case 'summary': await renderSummary(page, body); break;
      case 'definitions': await renderDefinitions(page, body); break;
      case 'points': await renderPoints(page, body); break;
      case 'theory': await renderTheory(page, body); break;
      case 'questions': await renderQuestions(page, body); break;
      case 'answers': await renderAnswers(page, body); break;
      case 'test': await renderTestTab(page, body); break;
      case 'result': await renderResultTab(page, body); break;
      case 'revision': await renderRevisionTab(page, body); break;
    }
    ui.renderDiagrams(body);
  }

  /* ---------- helpers ---------- */
  function ensureContentButtons(page, body) {
    // Buttons to generate missing content
    const d = page.data;
    const needSummary = !d.has_summary;
    const needQuestions = (d.chapter.questions_count || 0) < 4;
    const totalTopics = Array.isArray(d.chapter.topics) ? d.chapter.topics.length : 0;
    body.querySelectorAll('[data-gen]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const kind = btn.dataset.gen;
        const btnLabel = btn.textContent.trim().replace(/^⚡\s*/, '');
        btn.disabled = true;
        btn.innerHTML = '<span class="exam-spinner"></span> ⏳ Starting AI generation…';
        const scope = kind === 'summary' ? 'summary' : kind === 'content' ? 'content' : 'all';

        // Progress label: generation now runs as an asynchronous background job,
        // so while polling it we reuse the chapter's generated-topic count and
        // show "topic N of M ready" on the button.
        const updateProgressLabel = async function () {
          try {
            const st = await ui.api('api/summaries.php?chapter_id=' + page.chapterId);
            const ch = st && st.chapter ? st.chapter : null;
            const done = ch && ch.study_topics_count ? ch.study_topics_count : 0;
            const total = ch && Array.isArray(ch.topics) ? ch.topics.length : totalTopics;
            if (total > 0) {
              btn.innerHTML = '<span class="exam-spinner"></span> ⏳ Generating with AI… (' + Math.min(done + 1, total) + '/' + total + ' topics ready)';
            } else {
              btn.innerHTML = '<span class="exam-spinner"></span> ⏳ Generating with AI… (runs in the background)';
            }
          } catch (e) {
            btn.innerHTML = '<span class="exam-spinner"></span> ⏳ Generating with AI… (runs in the background)';
          }
        };

        try {
          // For questions use the questions API
          if (kind === 'questions' || kind === 'allq') {
            const q = await ui.api('api/questions.php', {
              method: 'POST',
              body: { chapter_id: page.chapterId, types: ['mcq', 'definition', 'concept', 'short_answer', 'long_answer'], count_per_type: 3, force: false },
              raw: true,
            });
            if (typeof window !== 'undefined' && q.error) throw new Error(q.error.message);
            const qJob = q.data && q.data.job_id;
            if (!qJob) throw new Error('Could not start the question generation job.');
            ui.startJob(qJob);
            await ui.pollJob(qJob, { onProgress: updateProgressLabel });
          }
          const res = await ui.api('api/summaries.php', { method: 'POST', body: { chapter_id: page.chapterId, scope, force: false }, raw: true });
          if (typeof window !== 'undefined' && res.error) throw new Error(res.error.message);
          const jobId = res.data && res.data.job_id;
          if (!jobId) throw new Error('Could not start the generation job.');
          ui.startJob(jobId);
          await ui.pollJob(jobId, { onProgress: updateProgressLabel });

          // Only touch the UI if the user is still on this chapter (a long
          // generation may have finished after they navigated somewhere else).
          const stillHere = document.getElementById('exam-content') === page.content;
          if (stillHere) {
            body.querySelector('.exam-error-banner')?.remove();
            ui.toast(kind === 'summary' ? 'Summary generated!' : 'Study content generated!', 'success');
            await loadChapter(page);
            openTab(page, kind === 'summary' ? 'summary' : kind === 'questions' || kind === 'allq' ? 'questions' : 'definitions');
          } else {
            ui.toast('Generation finished in background.', 'success');
          }
        } catch (e) {
          btn.disabled = false;
          btn.innerHTML = '⚡ ' + btnLabel;
          showErrorBanner(page, e.message);
          ui.toast(e.message, 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  function markSummaryViewed(page) {
    const d = page.data;
    if (d.chapter.summary_viewed) return;
    ui.api('api/chapters.php', { method: 'POST', body: { action: 'mark_viewed', id: page.chapterId, viewed: 1 } })
      .then(() => { d.chapter.summary_viewed = 1; d.chapter.status = 'studying'; })
      .catch(() => {});
  }

  /* ---------- SUMMARY TAB ---------- */
  async function renderSummary(page, body) {
    const d = page.data;
    if (!d.has_summary || !d.summary_ready) {
      const syllabusOnly = d.syllabus_only || d.chapter.content_level === 'syllabus';
      body.innerHTML = `
        <div class="exam-card exam-empty">
          <div class="exam-empty-icon">📖</div>
          <div class="exam-empty-title">Summary not generated yet</div>
          <div class="exam-mt-8">${syllabusOnly
            ? 'AI will generate an easy-language summary + definitions + theory + key points + important questions from this unit\'s syllabus topics.'
            : 'Generates an easy-language summary + definitions + key points from the PDF content only.'}</div>
          <div class="exam-mt-16"><button class="exam-btn" data-gen="all">⚡ Generate Summary & Content</button></div>
        </div>`;
      ensureContentButtons(page, body);
      return;
    }

    const isSyllabus = d.syllabus_only || d.chapter.content_level === 'syllabus';
    const easeShort = (d.chapter.easy_explanation || '');
    const examFocus = d.chapter.exam_focus || [];
    body.innerHTML = `
      <div class="exam-card">
        <div class="exam-flex-between exam-mb-16">
          <h2 class="exam-h2">📖 Easy-Language Summary</h2>
          <button class="exam-btn exam-btn-sm exam-btn-success" data-study="mark-viewed">✓ Mark as Studied</button>
        </div>
        ${isSyllabus ? '<div class="exam-mt-16 exam-badge exam-badge-yellow">AI-generated study explanation based on this syllabus topic.</div>' : ''}
        <div class="exam-summary-body">${ui.md(easeShort)}</div>
        <div class="exam-mt-16">
          <h3>🎯 Exam Focus</h3>
          <div class="exam-chip-row exam-mt-8">${examFocus.map((f) => `<span class="exam-term-chip"><b>🔥</b> ${ui.esc(f)}</span>`).join('') || '<span class="exam-muted">Not available</span>'}</div>
        </div>
        <div class="exam-mt-16 exam-muted" style="font-size:12px">${isSyllabus ? 'AI-generated study material from the syllabus topics' : 'Content generated from the uploaded PDF'} · ${ui.esc(d.chapter.last_generated_at || '')}</div>
      </div>`;

    body.querySelector('[data-study="mark-viewed"]').addEventListener('click', (el) => {
      markSummaryViewed(page);
      el.target.disabled = true;
      ui.toast('Summary marked as studied ✅ Now take the test!', 'success');
    });

    // Auto-mark viewed when user has genuinely scrolled/waited on summary
    if (!d.chapter.summary_viewed) {
      setTimeout(() => markSummaryViewed(page), 12000);
    }
  }

  /* ---------- DEFINITIONS TAB ---------- */
  function parseContent(page) {
    const d = page.data;
    const defs = safeJson(d.chapter.definitions_json);
    const points = safeJson(d.chapter.important_points_json);
    const terms = safeJson(d.chapter.key_terms_json);
    const examImp = safeJson(d.chapter.exam_important_json);
    const examples = safeJson(d.chapter.examples_json);
    const memory = safeJson(d.chapter.memory_tricks_json);
    const examAnswers = safeJson(d.chapter.exam_answers_json);
    const differences = safeJson(d.chapter.differences_json);
    return { defs, points, terms, examImp, examples, memory, examAnswers, differences };
  }
  function safeJson(s) { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }

  async function renderDefinitions(page, body) {
    const { defs } = parseContent(page);
    const isSyllabus = page.data.syllabus_only || page.data.chapter.content_level === 'syllabus';
    if (!page.data.content_ready && defs.length === 0) {
      body.innerHTML = `
        <div class="exam-card exam-empty">
          <div class="exam-empty-icon">📌</div>
          <div class="exam-empty-title">Definitions not generated yet</div>
          <div class="exam-mt-8">${isSyllabus
            ? 'AI will write exam-friendly definitions for every topic detected in this unit.'
            : 'Generate definitions, important points, key terms and examples from the PDF.'}</div>
          <div class="exam-mt-16"><button class="exam-btn" data-gen="content">⚡ Generate Definitions & Content</button></div>
        </div>`;
      ensureContentButtons(page, body);
      return;
    }
    if (defs.length === 0) {
      body.innerHTML = `<div class="exam-card exam-empty"><div class="exam-empty-icon">📌</div>
        <div class="exam-empty-title">No definitions were produced</div>
        <div class="exam-mt-8">The generator could not create definitions for this unit. Try regenerating the content.</div>
        <div class="exam-mt-16"><button class="exam-btn" data-gen="content">⚡ Regenerate Content</button></div></div>`;
      ensureContentButtons(page, body);
      return;
    }
    const simpleRaw = (page.data.chapter.simple_explanation || '').trim();
    body.innerHTML = `<div class="exam-card"><h2 class="exam-h2">📌 Definitions</h2>
      ${isSyllabus ? '<div class="exam-mt-16 exam-badge exam-badge-yellow">AI-generated study explanation based on this syllabus topic.</div>' : ''}` +
      (simpleRaw ? `<div class="exam-h3 exam-mt-16">💡 Easy Explanation</div>
        <div class="exam-summary-body exam-mt-8">${ui.esc(simpleRaw)}</div>` : '') +
      defs.map((x) => `
        <div class="exam-definition-card">
          <div class="exam-definition-term">${ui.esc(x.term || '')}</div>
          <div class="exam-definition-text">${ui.esc(x.definition || '')}</div>
        </div>`).join('') +
      `</div>`;
  }

  /* ---------- POINTS TAB ---------- */
  async function renderPoints(page, body) {
    const { points, terms, examImp, examples, memory, differences } = parseContent(page);
    const isSyllabus = page.data.syllabus_only || page.data.chapter.content_level === 'syllabus';
    if (!page.data.content_ready && points.length === 0) {
      body.innerHTML = `
        <div class="exam-card exam-empty">
          <div class="exam-empty-icon">⭐</div>
          <div class="exam-empty-title">Important points not generated yet</div>
          <div class="exam-mt-16"><button class="exam-btn" data-gen="content">⚡ Generate Content</button></div>
        </div>`;
      ensureContentButtons(page, body);
      return;
    }
    if (points.length === 0 && examImp.length === 0 && terms.length === 0) {
      body.innerHTML = `<div class="exam-card exam-empty"><div class="exam-empty-title">No important points were produced.</div>
        <div class="exam-mt-8">The generator could not create points for this unit. Try regenerating the content.</div>
        <div class="exam-mt-16"><button class="exam-btn" data-gen="content">⚡ Regenerate Content</button></div></div>`;
      ensureContentButtons(page, body);
      return;
    }
    let html = `<div class="exam-card"><h2 class="exam-h2">⭐ Important Points</h2>
      ${isSyllabus ? '<div class="exam-mt-16 exam-badge exam-badge-yellow">AI-generated study explanation based on this syllabus topic.</div>' : ''}`;
    for (const p of points) {
      html += `<div class="exam-point-item">
        <span class="exam-point-bullet">•</span>
        <div><div>${ui.md(p.point)}</div>${p.reason ? `<div class="exam-point-reason">Why it matters: ${ui.md(p.reason)}</div>` : ''}</div>
      </div>`;
    }
    if (examImp.length) {
      html += `<div class="exam-h3 exam-mt-16">🎯 Most Important for Exam</div>`;
      for (const e of examImp) {
        const stars = examPriorityStars(e.priority);
        html += `<div class="exam-exam-card">
          <span class="exam-badge exam-badge-yellow exam-mr">${stars}</span>${ui.md(e.item)}
          ${e.why ? `<div class="exam-point-reason">${ui.md(e.why)}</div>` : ''}</div>`;
      }
    }
    if (terms.length) {
      html += `<div class="exam-h3 exam-mt-16">🔑 Key Terms</div><div class="exam-chip-row">`;
      for (const t of terms) {
        html += `<span class="exam-term-chip"><b>${ui.esc(t.term)}</b>${t.context ? ' — ' + ui.md(t.context) : ''}</span>`;
      }
      html += `</div>`;
    }
    if (examples.length) {
      html += `<div class="exam-h3 exam-mt-16">📝 Examples</div>`;
      for (const ex of examples) {
        html += `<div class="exam-exam-card"><div class="exam-exam-tag">${ui.esc(ex.title || 'Example')}</div><div class="exam-mt-8">${ui.md(ex.content || '')}</div></div>`;
      }
    }
    if (differences.length) {
      html += `<div class="exam-h3 exam-mt-16">⚡ Compare & Memorise (Difference Tables)</div>`;
      for (const df of differences) {
        const rows = (df.differences || []);
        for (const table of rows) {
          const pts = table.points || [];
          html += `<div class="exam-diff-table exam-mt-8">
            <div class="exam-exam-tag">${ui.esc(df.topic || '')}</div>
            <div class="exam-diff-head"><span>${ui.esc(table.a || '')}</span><span class="exam-muted">vs</span><span>${ui.esc(table.b || '')}</span></div>`;
          if (pts.length) {
            html += `<table class="exam-table"><thead><tr><th>Aspect</th><th>${ui.esc(table.a)}</th><th>${ui.esc(table.b)}</th></tr></thead><tbody>`;
            for (const p of pts) {
              html += `<tr><td>${ui.esc(p.aspect || '')}</td><td>${ui.esc(p.a || '')}</td><td>${ui.esc(p.b || '')}</td></tr>`;
            }
            html += `</tbody></table>`;
          }
          html += `</div>`;
        }
      }
    }
    if (memory.length) {
      html += `<div class="exam-h3 exam-mt-16">🧠 Memory Tricks</div>`;
      for (const m of memory) {
        html += `<div class="exam-exam-card"><span class="exam-badge exam-badge-purple exam-mr">🧠 REMEMBER</span>${ui.md(m.topic || '')}${m.trick ? '<div class="exam-point-reason exam-mt-8">' + ui.md(m.trick) + '</div>' : ''}</div>`;
      }
    }
    const revisionRaw = (page.data.chapter.revision_notes || '').trim();
    if (revisionRaw) {
      html += `<div class="exam-h3 exam-mt-16">🔄 Quick Revision Notes</div>
        <div class="exam-summary-body exam-mt-8">${ui.md(revisionRaw)}</div>`;
    }
    html += `</div>`;
    body.innerHTML = html;
  }

  function examPriorityStars(priority) {
    if (priority === 'very_high') return '⭐⭐⭐ Very Important';
    if (priority === 'medium') return '⭐ Important';
    return '⭐⭐ Important';
  }

  /* ---------- THEORY TAB ---------- */
  async function renderTheory(page, body) {
    const d = page.data;
    const isSyllabus = d.syllabus_only || d.chapter.content_level === 'syllabus';
    const theoryRaw = (d.chapter.theory_json || '').trim();

    if (!d.content_ready && theoryRaw === '') {
      body.innerHTML = `
        <div class="exam-card exam-empty">
          <div class="exam-empty-icon">🧠</div>
          <div class="exam-empty-title">Theory not generated yet</div>
          <div class="exam-mt-8">${isSyllabus
            ? 'AI will explain every topic of this unit properly so you understand the concept.'
            : 'Generates a clear, easy-language explanation of the chapter from the PDF content.'}</div>
          <div class="exam-mt-16"><button class="exam-btn" data-gen="content">⚡ Generate Theory</button></div>
        </div>`;
      ensureContentButtons(page, body);
      return;
    }

    if (theoryRaw === '' || theoryRaw.indexOf('Information not clearly available') !== -1) {
      body.innerHTML = `<div class="exam-card exam-empty"><div class="exam-empty-icon">🧠</div>
        <div class="exam-empty-title">Theory not available</div>
        <div class="exam-mt-8">The generator could not produce theory for this unit. Try regenerating the content.</div>
        <div class="exam-mt-16"><button class="exam-btn" data-gen="content">⚡ Regenerate Theory</button></div></div>`;
      ensureContentButtons(page, body);
      return;
    }

    body.innerHTML = `
      <div class="exam-card">
        <h2 class="exam-h2">🧠 Theory</h2>
        ${isSyllabus ? '<div class="exam-mt-16 exam-badge exam-badge-yellow">AI-generated study explanation based on this syllabus topic.</div>' : ''}
        <div class="exam-summary-body exam-mt-8">${ui.md(theoryRaw)}</div>
      </div>`;
  }

  /* ---------- QUESTIONS TAB (Important Questions) ---------- */
  async function renderQuestions(page, body) {
    let qs = [];
    try { qs = await ui.api('api/questions.php?chapter_id=' + page.chapterId + '&mode=study'); } catch (e) {}
    const isSyllabus = page.data.syllabus_only || page.data.chapter.content_level === 'syllabus';

    if (!qs || qs.length === 0) {
      body.innerHTML = `
        <div class="exam-card exam-empty">
          <div class="exam-empty-icon">❓</div>
          <div class="exam-empty-title">Important questions not generated yet</div>
          <div class="exam-mt-8">${isSyllabus
            ? 'AI will create MCQs, definition, concept and short-answer questions from this unit\'s syllabus topics.'
            : 'AI will create MCQs, definition, concept and short-answer questions from the PDF content.'}</div>
          <div class="exam-mt-16"><button class="exam-btn" data-gen="questions">⚡ Generate Important Questions</button></div>
        </div>`;
      ensureContentButtons(page, body);
      return;
    }

    const grouped = { mcq: [], definition: [], concept: [], short_answer: [], long_answer: [], true_false: [] };
    for (const q of qs) (grouped[q.question_type] = grouped[q.question_type] || []).push(q);
    let currentQ = 0;
    let shown = [];
    const total = qs.length;

    const draw = () => {
      const q = qs[currentQ];
      let optHtml = '';
      if (q.question_type === 'mcq' && q.options && q.options.length) {
        optHtml = `<div class="exam-chip-row exam-mt-8">${q.options.map((o, i) => `<span class="exam-term-chip">${String.fromCharCode(65 + i)}. ${ui.esc(o)}</span>`).join('')}</div>`;
      }
      body.innerHTML = `
        <div class="exam-card">
          <div class="exam-flex-between exam-mb-8">
            <h2 class="exam-h2">❓ Important Questions</h2>
            <span class="exam-badge exam-badge-blue">${currentQ + 1} / ${total}</span>
          </div>
          ${isSyllabus ? '<div class="exam-mt-16 exam-badge exam-badge-yellow">AI-generated study explanation based on this syllabus topic.</div>' : ''}
          <div class="exam-qitem">
            <div class="exam-qhead">
              <span class="exam-qnum">${ui.typeShort(q.question_type)}</span>
              <div>${ui.esc(q.question_text)}</div>
            </div>
            ${optHtml}
            <div class="exam-qmeta">Topic: ${ui.esc(q.topic || 'General')}</div>
            <button class="exam-btn exam-btn-sm exam-btn-ghost" data-qa="reveal">👁️ Show Answer</button>
            <div class="exam-answer" id="exam-q-answer">
              <div class="exam-answer-label">✅ Answer</div>
              <div>${ui.esc(q.correct_answer)}</div>
              ${q.explanation ? `<div class="exam-point-reason exam-mt-8">💡 ${ui.esc(q.explanation)}</div>` : ''}
            </div>
          </div>
          <div class="exam-flex exam-gap-sm exam-mt-8">
            <button class="exam-btn exam-btn-sm exam-btn-ghost" data-qa="prev" ${currentQ === 0 ? 'disabled' : ''}>◀ Prev</button>
            <button class="exam-btn exam-btn-sm exam-btn-ghost" data-qa="next" ${currentQ === total - 1 ? 'disabled' : ''}>Next ▶</button>
          </div>
        </div>`;
      body.querySelector('[data-qa="reveal"]').addEventListener('click', (e) => {
        const an = body.querySelector('#exam-q-answer');
        an.classList.toggle('open');
        e.target.textContent = an.classList.contains('open') ? '🙈 Hide Answer' : '👁️ Show Answer';
      });
      body.querySelector('[data-qa="prev"]').addEventListener('click', () => {
        if (currentQ > 0) { currentQ--; draw(); }
      });
      body.querySelector('[data-qa="next"]').addEventListener('click', () => {
        if (currentQ < total - 1) { currentQ++; draw(); }
      });
    };
    draw();
  }

  /* ---------- ANSWERS TAB (Q&A) ---------- */
  async function renderAnswers(page, body) {
    let qs = [];
    try { qs = await ui.api('api/questions.php?chapter_id=' + page.chapterId + '&mode=study'); } catch (e) {}
    const isSyllabus = page.data.syllabus_only || page.data.chapter.content_level === 'syllabus';
    const { examAnswers } = parseContent(page);

    if ((!qs || qs.length === 0) && examAnswers.length === 0) {
      body.innerHTML = `
        <div class="exam-card exam-empty">
          <div class="exam-empty-icon">✍️</div>
          <div class="exam-empty-title">No questions yet — Q&A will appear here.</div>
          <div class="exam-mt-16"><button class="exam-btn" data-gen="questions">⚡ Generate Questions & Answers</button></div>
        </div>`;
      ensureContentButtons(page, body);
      return;
    }
    let html = `<div class="exam-card"><h2 class="exam-h2">✍️ Question & Answers</h2>
      ${isSyllabus ? '<div class="exam-mt-16 exam-badge exam-badge-yellow">AI-generated study explanation based on this syllabus topic.</div>' : ''}
      <div class="exam-muted exam-mb-16">${isSyllabus ? 'Every answer is in EASY language, generated from this unit\'s topics.' : 'Every answer is in EASY language, based only on the uploaded PDF.'}</div>`;
    if (examAnswers.length) {
      html += `<div class="exam-h3 exam-mt-16">🎯 Model Exam Answers (3 / 5 / 7 Marks)</div>`;
      for (const ea of examAnswers) {
        for (const [i, ans] of (ea.answers || []).entries()) {
          html += `<div class="exam-exam-card">
            <span class="exam-badge exam-badge-blue exam-mr">📝 ${ui.esc(ans.marks || '?')} Marks</span>${ui.md(ea.topic || '')}
            <div class="exam-point-reason exam-mt-8">${ui.md(ans.answer || '')}</div>
          </div>`;
          void i;
        }
      }
    }
    if (qs && qs.length) {
      html += qs.map((q, i) => `
        <div class="exam-qitem">
          <div class="exam-qhead">
            <span class="exam-qnum">${i + 1}</span>
            <div><span class="exam-badge exam-badge-purple exam-mr">${ui.typeShort(q.question_type)}</span> ${ui.esc(q.question_text)}</div>
          </div>
          <button class="exam-btn exam-btn-sm exam-btn-ghost exam-mt-8" data-ans="reveal" data-i="${i}">👁️ Show Answer</button>
          <div class="exam-answer" id="exam-answer-${i}">
            <div class="exam-answer-label">✅ Answer (Easy Language)</div>
            <div class="exam-mt-8">${ui.md(q.correct_answer)}</div>
            ${q.explanation ? `<div class="exam-point-reason exam-mt-8">💡 ${ui.md(q.explanation)}</div>` : ''}
          </div>
        </div>`).join('');
    }
    html += `</div>`;
    body.innerHTML = html;
    body.querySelectorAll('[data-ans="reveal"]').forEach((b) => {
      b.addEventListener('click', () => {
        const an = body.querySelector('#exam-answer-' + b.dataset.i);
        an.classList.toggle('open');
        b.textContent = an.classList.contains('open') ? '🙈 Hide Answer' : '👁️ Show Answer';
      });
    });
  }

  /* ---------- TEST TAB ---------- */
  async function renderTestTab(page, body) {
    const d = page.data;
    if (!d.chapter.summary_viewed) {
      body.innerHTML = `
        <div class="exam-card exam-empty">
          <div class="exam-empty-icon">📖</div>
          <div class="exam-empty-title">Study the Summary first</div>
          <div class="exam-mt-8">The test unlocks after you have studied the summary. Go to the 📖 Summary tab, read it, and mark it as studied.</div>
          <div class="exam-mt-16">
            <button class="exam-btn" data-study="goto-summary">📖 Go to Summary</button>
          </div>
        </div>`;
      body.querySelector('[data-study="goto-summary"]').addEventListener('click', () => openTab(page, 'summary'));
      return;
    }
    const qcount = (d.chapter && d.chapter.questions_count) || 0;
    if (qcount < 4) {
      body.innerHTML = `
        <div class="exam-card exam-empty">
          <div class="exam-empty-icon">📝</div>
          <div class="exam-empty-title">Not enough questions yet</div>
          <div class="exam-mt-8">Generate the chapter questions first (Important Questions tab).</div>
          <div class="exam-mt-16"><button class="exam-btn" data-gen="questions">⚡ Generate Questions</button></div>
        </div>`;
      ensureContentButtons(page, body);
      return;
    }
    body.innerHTML = `
      <div class="exam-card">
        <h2 class="exam-h2">📝 Chapter Test</h2>
        <div class="exam-muted exam-mb-16">MCQs, definition, concept, short-answer and long-answer (explain/differentiate) questions — all based on the chapter PDF content.</div>
        <button class="exam-btn exam-btn-lg exam-btn-primary" data-test="start">🚀 Start Chapter Test</button>
      </div>`;
    body.querySelector('[data-test="start"]').addEventListener('click', () => {
      EXAM.tests.startFull(page.chapterId, body);
    });
  }

  /* ---------- RESULT TAB ---------- */
  async function renderResultTab(page, body) {
    let res = null;
    try {
      res = await ui.api('api/results.php?chapter_id=' + page.chapterId);
    } catch (e) {}
    if (!res || res.attempts.length === 0) {
      body.innerHTML = `<div class="exam-card exam-empty"><div class="exam-empty-icon">📊</div>
        <div class="exam-empty-title">No test results yet</div>
        <div class="exam-mt-8">Take the chapter test to see your result here.</div>
        <div class="exam-mt-16"><button class="exam-btn" data-study="goto-test">📝 Go to Test</button></div></div>`;
      body.querySelector('[data-study="goto-test"]').addEventListener('click', () => openTab(page, 'test'));
      return;
    }
    const last = res.attempts[0];
    const passed = last.passed ? 1 : 0;
    const wrongCount = Math.max(0, (last.total_questions || 0) - (last.score || 0));
    body.innerHTML = `
      <div class="exam-card exam-mb-16">
        <div class="exam-result-banner">
          ${ui.ring(last.percentage, 92, 9)}
          <div class="exam-result-stats">
            <div class="exam-result-stat">
              <div class="exam-result-stat-value">${last.score}/${last.total_questions}</div>
              <div class="exam-result-stat-label">Score</div>
            </div>
            <div class="exam-result-stat">
              <div class="exam-result-stat-value" style="color:var(--success)">${last.score}</div>
              <div class="exam-result-stat-label">Correct Answers</div>
            </div>
            <div class="exam-result-stat">
              <div class="exam-result-stat-value" style="color:var(--danger)">${wrongCount}</div>
              <div class="exam-result-stat-label">Wrong Answers</div>
            </div>
            <div class="exam-result-stat">
              <div class="exam-result-stat-value">${last.percentage}%</div>
              <div class="exam-result-stat-label">Percentage</div>
            </div>
            <div class="exam-result-stat">
              <div class="exam-result-stat-value">${last.passing_score}%</div>
              <div class="exam-result-stat-label">Passing</div>
            </div>
            <div class="exam-result-stat">
              ${passed ? '<span class="exam-badge exam-badge-green">✅ Passed</span>' : '<span class="exam-badge exam-badge-red">❌ Failed</span>'}
            </div>
          </div>
        </div>
        <div class="exam-muted exam-mt-16">${ui.esc(last.test_type === 'retest' ? 'Retest' : 'Full test')} · ${ui.esc(last.timestamp)}</div>
      </div>`;

    // Weak topics for this chapter
    if (res.weak_topics.length) {
      body.innerHTML += `<div class="exam-card exam-mb-16">
        <h2 class="exam-h2">🔴 Weak Topics (from wrong answers)</h2>` +
        res.weak_topics.map((w) => `
          <div class="exam-weak-head exam-mb-8">
            <div class="exam-weak-topic">🔴 ${ui.esc(w.topic_name)}</div>
            <button class="exam-btn exam-btn-sm exam-btn-primary" data-action="retest-here" data-weak="${w.id}">📝 Retest</button>
          </div>
          <div class="exam-point-reason exam-mb-8">${ui.esc(w.why_weak || '')}</div>`).join('') +
        `</div>`;
      body.querySelectorAll('[data-action="retest-here"]').forEach((b) => {
        b.addEventListener('click', () => openTab(page, 'revision'));
      });
    }

    // Review of the last attempt (re-fetch detailed answers)
    let review = [];
    if (res.attempt_review && res.attempt_review.length) review = res.attempt_review;

    body.innerHTML += `<div class="exam-card">
      <h2 class="exam-h2">Question Review</h2>
      <div class="exam-tabs">${review.length === 0 ? '<div class="exam-muted exam-p-8">Detailed review available in the test result screen.</div>' : ''}</div>
    </div>`;

    const testNav = `<div class="exam-test-result-nav exam-mt-16">
      <button class="exam-btn" data-study="retake">🔄 Retake Full Test</button>
      <button class="exam-btn exam-btn-ghost" data-study="goto-revision">Revise Weak Topics</button>
    </div>`;
    body.innerHTML += testNav;
    body.querySelector('[data-study="retake"]').addEventListener('click', () => openTab(page, 'test'));
    if (body.querySelector('[data-study="goto-revision"]')) {
      body.querySelector('[data-study="goto-revision"]').addEventListener('click', () => openTab(page, 'revision'));
    }
  }

  /* ---------- REVISION TAB ---------- */
  async function renderRevisionTab(page, body) {
    let res = null;
    try { res = await ui.api('api/results.php?chapter_id=' + page.chapterId); } catch (e) {}
    const weak = (res && res.weak_topics) || [];

    if (weak.length === 0) {
      body.innerHTML = `<div class="exam-card exam-empty"><div class="exam-empty-icon">✅</div>
        <div class="exam-empty-title">No weak topics in this chapter</div>
        <div class="exam-mt-8">You are doing great!</div></div>`;
      return;
    }

    body.innerHTML = `<div class="exam-card">
      <h2 class="exam-h2">🔄 Chapter Revision</h2>
      <div class="exam-muted exam-mb-16">Revise these weak topics, then retest only them.</div>`;

    for (const w of weak) {
      body.innerHTML += `
        <div class="exam-weak-card">
          <div class="exam-weak-head">
            <div class="exam-weak-topic">🔴 ${ui.esc(w.topic_name)}</div>
            <div class="exam-flex exam-gap-sm">
              <button class="exam-btn exam-btn-sm exam-btn-primary" data-rev="retest-all">📝 Retest Weak Topics</button>
              <button class="exam-btn exam-btn-sm exam-btn-success" data-rev="resolved" data-id="${w.id}">✓ Mark Resolved</button>
            </div>
          </div>
          <div class="exam-weak-why"><b>Why weak:</b> ${ui.esc(w.why_weak || 'Recent wrong answers.')}</div>
          <form class="exam-weak-notes" data-rev="save-notes" data-id="${w.id}">
            <label class="exam-label">Short revision note</label>
            <textarea class="exam-textarea" rows="2">${ui.esc(w.revision_notes || '')}</textarea>
            <div class="exam-mt-8"><button class="exam-btn exam-btn-sm exam-btn-success">💾 Save Notes</button></div>
          </form>
        </div>`;
    }
    body.innerHTML += `</div>`;

    body.querySelectorAll('[data-rev="resolved"]').forEach((b) => {
      b.addEventListener('click', async () => {
        await ui.api('api/results.php', { method: 'POST', body: { action: 'resolve', id: b.dataset.id } });
        ui.toast('Weak topic resolved 🎉', 'success');
        openTab(page, 'revision');
      });
    });
    body.querySelectorAll('form[data-rev="save-notes"]').forEach((f) => {
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        await ui.api('api/results.php', { method: 'POST', body: { action: 'update_weak', id: f.dataset.id, revision_notes: f.querySelector('textarea').value } });
        ui.toast('Revision notes saved.', 'success');
      });
    });
    const retestBtn = body.querySelector('[data-rev="retest-all"]');
    if (retestBtn) retestBtn.addEventListener('click', () => {
      EXAM.tests.retestWeakAll(page.chapterId, body);
    });
  }

  EXAM.study = study;
})();