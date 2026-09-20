/* ============================================================
   EXAM STUDY DASHBOARD - Test engine
   Full chapter tests + weak-topic retests + FULL SUBJECT MOCK.
   ============================================================ */
(function () {
  'use strict';
  const EXAM = window.EXAM = window.EXAM || {};
  const ui = EXAM.ui;
  const tests = EXAM.tests = {};

  let session = null; // current live test session
  let io = null;      // {body, page} context for redraw

  function renderLive(container, html) {
    if (container) container.innerHTML = html;
  }

  tests.startFull = async function (chapterId, container) {
    try {
      const test = await ui.api('api/tests.php?chapter_id=' + chapterId + '&test_type=full');
      if (!test.attempt_token) {
        ui.toast(test.message || 'No questions available.', 'warning');
        return;
      }
      startSession(chapterId, test, container);
    } catch (e) {
      ui.toast(e.message, 'error');
    }
  };

  tests.startMock = async function (subjectId, container) {
    if (!container) container = document.getElementById('exam-content');
    try {
      const test = await ui.api('api/tests.php?subject_id=' + subjectId + '&test_type=subject');
      if (!test.attempt_token) {
        ui.toast(test.message || 'No questions across the subject yet. Generate Questions for each unit first.', 'warning');
        return;
      }
      startSession(null, test, container, subjectId);
    } catch (e) {
      ui.toast(e.message, 'error');
    }
  };

  tests.retestWeakAll = async function (chapterId, container) {
    try {
      const res = await ui.api('api/results.php?chapter_id=' + chapterId);
      const weak = (res.weak_topics || []).map((w) => w.id);
      if (weak.length === 0) { renderLive(container, ui.empty('✅', 'Nothing to retest', 'No open weak topics.')); return; }
      await tests.retestWeak(chapterId, weak.join(','), container);
    } catch (e) { ui.toast(e.message, 'error'); }
  };

  tests.retestWeak = async function (chapterId, weakIds, container) {
    if (!container) container = document.getElementById('exam-content');
    try {
      const url = 'api/tests.php?chapter_id=' + chapterId + '&test_type=retest&weak_topic_ids=' + encodeURIComponent(weakIds);
      const test = await ui.api(url);
      if (!test.attempt_token) {
        ui.toast(test.message || 'Not enough questions for these weak topics.', 'warning');
        return;
      }
      startSession(chapterId, test, container);
    } catch (e) { ui.toast(e.message, 'error'); }
  };

  function startSession(chapterId, test, container, subjectOverride) {
    session = { chapterId, test, subjectId: subjectOverride || test.subject_id || null, answers: {}, submitted: false };
    io = { container };
    renderTestUI();
  }

  function renderTestUI() {
    const t = session.test;
    const questions = t.questions || [];
    const isSubject = t.test_type === 'subject';
    let html = `
      <div class="exam-card">
        <div class="exam-flex-between exam-mb-16">
          <h2 class="exam-h2">${isSubject ? '🎯 Full Subject Mock Test' : t.test_type === 'retest' ? '🔄 Weak Topic Retest' : '📝 Chapter Test'}</h2>
          <span class="exam-badge exam-badge-blue">${questions.length} questions</span>
        </div>
        <div class="exam-muted exam-mb-16">${isSubject
          ? 'Covers the WHOLE syllabus — questions from every unit. Passing score: ' + t.test_config.passing_score + '%'
          : t.test_type === 'retest' ? 'Retest only your weak topics.'
          : 'Answer all questions. Passing score: ' + t.test_config.passing_score + '%'}</div>
        <div class="exam-mb-16">${ui.progressBar(sessionProgress())}</div>
        <div id="exam-live-questions"></div>
        <div class="exam-mt-16 exam-flex-between">
          <span class="exam-muted exam-mtext" id="exam-test-count">Answered ${Object.keys(session.answers).length}/${questions.length}</span>
          <button class="exam-btn exam-btn-lg" style="background:var(--success)" data-live="submit" ${Object.keys(session.answers).length === 0 ? 'disabled' : ''}>✅ Submit Test</button>
        </div>
      </div>`;

    if (!io || !io.container) {
      // Retest launched from a global page: embed into a modal-ish card at top
      const content = document.getElementById('exam-content');
      content.insertAdjacentHTML('afterbegin', html);
      const wrap = content.firstElementChild;
      renderQuestions(wrap);
      return;
    }
    renderLive(io.container, html);
    renderQuestions(io.container);
  }

  function sessionProgress() {
    if (!session) return 0;
    const n = (session.test.questions || []).length;
    return n ? Math.round((Object.keys(session.answers).length / n) * 100) : 0;
  }

  function renderQuestions(container) {
    const host = container.querySelector('#exam-live-questions');
    const questions = session.test.questions || [];
    host.innerHTML = questions.map((q, i) => {
      const ans = session.answers[q.id] || { chosen: null };
      let inner = '';
      if (q.question_type === 'mcq') {
        for (let k = 0; k < (q.options || []).length; k++) {
          const letter = String.fromCharCode(65 + k);
          inner += `<label class="exam-test-option" data-opt="${ui.esc(q.options[k])}" data-q="${q.id}">
            <input type="radio" name="q${q.id}" value="${ui.esc(q.options[k])}" style="margin-right:8px" ${ans.chosen === q.options[k] ? 'checked' : ''}>
            <b>${letter}.</b> ${ui.esc(q.options[k])}
          </label>`;
        }
      } else {
        inner = `<textarea class="exam-short-answer-input" data-q="${q.id}" rows="3" placeholder="Type your answer (easy language)…">${ui.esc(ans.chosen || '')}</textarea>`;
      }
      return `
        <div class="exam-qitem" style="border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:16px">
          <div class="exam-qhead"><span class="exam-qnum">Q${i + 1}</span>
            <div><span class="exam-badge exam-badge-purple">${ui.typeShort(q.question_type)}</span>
            <div style="margin-top:4px">${ui.esc(q.question_text)}</div></div>
          </div>
          <div class="exam-mt-8">${inner}</div>
        </div>`;
    }).join('');

    // wire interactions
    host.querySelectorAll('input[type="radio"]').forEach((r) => {
      r.addEventListener('change', () => {
        session.answers[r.dataset.q] = { chosen: r.value, correct: false };
        updateLiveUi(host);
      });
    });
    host.querySelectorAll('.exam-short-answer-input').forEach((ta) => {
      ta.addEventListener('input', () => {
        session.answers[ta.dataset.q] = { chosen: ta.value.trim(), correct: false };
        updateLiveUi(host);
      });
    });
    container.querySelectorAll('[data-live="submit"]').forEach((b) => {
      b.addEventListener('click', submitTest);
    });
  }

  function updateLiveUi(host) {
    const questions = session.test.questions || [];
    const countBadge = document.getElementById('exam-test-count');
    if (countBadge) countBadge.textContent = `Answered ${Object.keys(session.answers).length}/${questions.length}`;
    const bar = document.querySelector('#exam-live-questions') ? host.parentElement.querySelector('.exam-progress-fill') : null;
    const submitBtn = document.querySelector('[data-live="submit"]');
    if (submitBtn) submitBtn.disabled = Object.keys(session.answers).length === 0;
  }

  async function submitTest() {
    if (session.submitted) return;
    session.submitted = true;
    const btn = document.querySelector('[data-live="submit"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="exam-spinner"></span> Submitting…'; }

    const body = {
      attempt_token: session.test.attempt_token,
      answers: Object.keys(session.answers).map((id) => ({ question_id: parseInt(id, 10), chosen: session.answers[id].chosen })),
    };

    try {
      const res = await ui.api('api/tests.php', { method: 'POST', body });
      session.subjectId = res.subject_id;
      renderResult(res);
      // NOTE: previously the whole page was re-rendered here 2.5s after
      // submitting, which replaced the result screen with a fresh "Loading…"
      // and reopened the summary tab. Chapter/subject status now refreshes
      // automatically when the user navigates (the APIs always read live data),
      // so the result screen is left visible instead of being wiped.
      ui.toast(res.passed ? 'Test passed! 🎉' : 'Test failed — check weak topics and revise.', res.passed ? 'success' : 'warning');
    } catch (e) {
      ui.toast(e.message, 'error');
      session.submitted = false;
    }
  }

  function renderResult(res) {
    const questions = session.test.questions || [];
    // Map returned review (which contains correct answers) into per-question blocks
    const byId = {};
    (res.review || []).forEach((r) => { byId[r.question_id] = r; });

    let html = `
      <div class="exam-card exam-mb-16">
        <div class="exam-result-banner">
          ${ui.ring(res.percentage, 96, 10)}
          <div class="exam-result-stats">
            <div class="exam-result-stat"><div class="exam-result-stat-value">${res.score}/${res.total_questions}</div><div class="exam-result-stat-label">Score</div></div>
            <div class="exam-result-stat"><div class="exam-result-stat-value">${res.percentage}%</div><div class="exam-result-stat-label">Percentage</div></div>
            <div class="exam-result-stat"><div class="exam-result-stat-value">${res.passing_score}%</div><div class="exam-result-stat-label">Passing Score</div></div>
            <div class="exam-result-stat">${res.passed ? '<span class="exam-badge exam-badge-green">✅ PASSED</span>' : '<span class="exam-badge exam-badge-red">❌ FAILED</span>'}</div>
          </div>
        </div>
        <div class="exam-muted exam-mt-16">${res.test_type === 'subject' ? '🎯 Full Subject Mock Test' : res.test_type === 'retest' ? '🔁 Retest' : '📝 Full test'} · Attempt #${res.attempt_id}</div>
      </div>`;

    // Wrong questions summary
    const wrong = (res.review || []).filter((r) => !r.is_correct);
    if (wrong.length) {
      html += `<div class="exam-card exam-mb-16">
        <h2 class="exam-h2">❌ Questions You Got Wrong</h2>`;
      for (const w of wrong) {
        html += `<div class="exam-qitem">
          <div class="exam-qhead"><span class="exam-qnum">${ui.typeShort(w.type)}</span><div>${ui.esc(w.text)}</div></div>
          <div class="exam-weak-why exam-mt-8">Your answer: <b>${ui.esc(w.chosen || '(not answered)')}</b></div>
          <div class="exam-answer open exam-mt-8"><div class="exam-answer-label">✅ Correct: ${ui.esc(w.correct)}</div>
            ${w.explanation ? '<div class="exam-point-reason exam-mt-8">💡 ' + ui.esc(w.explanation) + '</div>' : ''}
            ${w.topic ? '<div class="exam-point-reason exam-mt-8">Topic: ' + ui.esc(w.topic) + '</div>' : ''}
          </div>
        </div>`;
      }
      html += `</div>`;
    }

    // Weak topics
    if ((res.weak_topics || []).length) {
      html += `<div class="exam-card exam-mb-16">
        <h2 class="exam-h2">🔴 Weak Topics (Revision Required)</h2>
        <div class="exam-chip-row">` +
        res.weak_topics.map((w) => `<span class="exam-term-chip">🔴 <b>${ui.esc(w.topic_name)}</b></span>`).join('') +
        `</div></div>`;
    }

    // All question review
    html += `<div class="exam-card">
      <h2 class="exam-h2">📋 Question Review</h2>`;
    (res.review || []).forEach((r, i) => {
      html += `<div class="exam-qitem">
        <div class="exam-qhead"><span class="exam-qnum">${i + 1}</span>
          <div><span class="exam-badge exam-badge-purple">${ui.typeShort(r.type)}</span> ${ui.esc(r.text)}</div>
        </div>
        <div class="exam-weak-why exam-mt-8" style="display:flex;gap:16px;flex-wrap:wrap">
          <span>Your answer: <b class="${r.is_correct ? 'color:var(--success)' : ''}">${ui.esc(r.chosen || '(not answered)')}</b></span>
          <span>Correct: <b>${ui.esc(r.correct)}</b></span>
          <span>${r.is_correct ? '<span class="exam-badge exam-badge-green">✅ Correct</span>' : '<span class="exam-badge exam-badge-red">❌ Wrong</span>'}</span>
        </div>
        ${r.explanation ? `<div class="exam-point-reason exam-mt-8">💡 ${ui.esc(r.explanation)}</div>` : ''}
      </div>`;
    });
    html += `</div>`;

    html += `<div class="exam-test-result-nav exam-mt-16">
      ${!res.passed ? '<button class="exam-btn exam-btn-danger" data-live="retake">🔁 Retake Test</button>' : ''}
    </div>`;

    if (io && io.container) renderLive(io.container, html);
    else {
      const content = document.getElementById('exam-content');
      const existing = document.querySelector('.exam-card[data-result="1"]');
      if (existing) { content.insertAdjacentHTML('afterbegin', html); }
      else content.innerHTML = html;
    }
    const rb = (io && io.container) ? io.container.querySelector('[data-live="retake"]') : document.querySelector('[data-live="retake"]');
    if (rb) rb.addEventListener('click', async () => {
      if (session.test && session.test.test_type === 'subject') {
        EXAM.tests.startMock(session.subjectId, io.container);
        return;
      }
      const chId = session.chapterId;
      let sid = session.subjectId;
      if (!sid) {
        try {
          const ch = await ui.api('api/chapters.php?id=' + chId);
          sid = ch.subject_id || null;
        } catch (e) { sid = null; }
      }
      if (!sid) { ui.toast('Subject not found.', 'error'); return; }
      EXAM.study._initialTab = 'test';
      EXAM.app.go('subject', sid, chId);
    });
  }

  EXAM.tests = tests;
})();