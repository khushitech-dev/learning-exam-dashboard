/* ============================================================
   EXAM STUDY DASHBOARD - Global Search
   Searches chapters, topics, definitions, questions, answers.
   ============================================================ */
(function () {
  'use strict';
  const EXAM = window.EXAM = window.EXAM || {};
  const search = EXAM.search = {};
  let indexCache = null;

  search.render = function (content, ui) {
    const debounceId = 'exam-search-debounce';
    content.innerHTML = `
      <div class="exam-page-header">
        <h1 class="exam-h1">🔍 Search</h1>
        <div class="exam-subtitle">Search chapters, topics, definitions, questions and answers.</div>
      </div>
      <div class="exam-card">
        <input class="exam-search-input" id="exam-search-input" type="text" placeholder="Type to search… e.g. 'primary key', 'photosynthesis'">
        <input class="exam-search-input exam-mt-8" id="exam-search-subject" type="text" placeholder="Filter by subject name (optional)">
        <div id="exam-search-results" class="exam-mt-16"></div>
      </div>`;

    const input = document.getElementById('exam-search-input');
    const subj = document.getElementById('exam-search-subject');

    const run = () => search.run(input.value.trim(), subj.value.trim(), ui, document.getElementById('exam-search-results'));
    input.addEventListener('input', () => run());
    subj.addEventListener('input', () => run());
  };

  search.run = async function (q, subjectFilter, ui, resultsEl) {
    if (!q || q.length < 2) {
      resultsEl.innerHTML = `<div class="exam-muted">Start typing to search across all subjects…</div>`;
      return;
    }
    resultsEl.innerHTML = ui.spinner('Searching…');
    try {
      const data = await ui.api('api/search.php?q=' + encodeURIComponent(q) + (subjectFilter ? '&subject_id=' + encodeURIComponent(subjectFilter) : ''));
      renderResults(data, q, ui, resultsEl);
    } catch (e) {
      resultsEl.innerHTML = '<div class="exam-empty">⚠️ ' + ui.esc(e.message || e) + '</div>';
    }
  };

  function renderResults(data, q, ui, el) {
    let total = (data.chapters ? data.chapters.length : 0)
      + (data.definitions ? data.definitions.length : 0)
      + (data.terms ? data.terms.length : 0)
      + (data.points ? data.points.length : 0)
      + (data.questions ? data.questions.length : 0);

    if (total === 0) {
      el.innerHTML = ui.empty('🔍', 'No results for "' + q + '"', 'Try a different keyword.');
      return;
    }

    let html = `<div class="exam-muted exam-mb-8">${total} result(s) for <b>${ui.esc(q)}</b></div>`;

    if (data.chapters && data.chapters.length) {
      html += `<div class="exam-search-group-title">📖 Chapters</div>`;
      for (const c of data.chapters) {
        html += `<div class="exam-point-item"><span class="exam-point-bullet">•</span>
          <div><a href="#/subject/${c.subject_id}/chapter/${c.id}">${ui.esc(c.title)}</a>
          <div class="exam-point-reason">${ui.esc(c.subject_name)} · ${ui.statusBadge(c.status)}</div></div></div>`;
      }
    }

    if (data.definitions && data.definitions.length) {
      html += `<div class="exam-search-group-title">📌 Definitions</div>`;
      for (const d of data.definitions) {
        html += `<div class="exam-definition-card">
          <div class="exam-definition-term">${ui.esc(d.term)}</div>
          <div class="exam-definition-text">${ui.esc(d.definition)}</div>
          <div class="exam-point-reason exam-mt-8"><a href="#/subject/${d.subject_id}/chapter/${d.chapter_id}">${ui.esc(d.chapter_title)}</a> · ${ui.esc(d.subject_name)}</div>
        </div>`;
      }
    }

    if (data.terms && data.terms.length) {
      html += `<div class="exam-search-group-title">🔑 Key Terms</div><div class="exam-chip-row">`;
      for (const t of data.terms) {
        html += `<span class="exam-term-chip"><b>${ui.esc(t.term)}</b> — ${ui.esc(t.context || '')}
          <a href="#/subject/${t.subject_id}/chapter/${t.chapter_id}">→ ${ui.esc(t.chapter_title)}</a></span>`;
      }
      html += `</div>`;
    }

    if (data.points && data.points.length) {
      html += `<div class="exam-search-group-title">⭐ Important Points</div>`;
      for (const p of data.points) {
        html += `<div class="exam-point-item"><span class="exam-point-bullet">•</span>
          <div><div>${ui.esc(p.point)}</div>${p.reason ? `<div class="exam-point-reason">${ui.esc(p.reason)}</div>` : ''}
          <div class="exam-point-reason"><a href="#/subject/${p.subject_id}/chapter/${p.chapter_id}">${ui.esc(p.chapter_title)}</a></div></div></div>`;
      }
    }

    if (data.questions && data.questions.length) {
      html += `<div class="exam-search-group-title">❓ Questions & Answers</div>`;
      for (const qq of data.questions) {
        html += `<div class="exam-qitem">
          <div class="exam-qhead"><span class="exam-qnum">Q</span><div>${ui.esc(qq.question_text)}</div></div>
          <div class="exam-answer open exam-mt-8"><div class="exam-answer-label">✅ Answer</div>${ui.esc(qq.correct_answer)}</div>
          <div class="exam-point-reason exam-mt-8"><a href="#/subject/${qq.subject_id}/chapter/${qq.chapter_id}">${ui.esc(qq.chapter_title)}</a></div>
        </div>`;
      }
    }

    el.innerHTML = html;
  }
})();