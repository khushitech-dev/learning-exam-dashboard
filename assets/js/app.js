/* ============================================================
   PERSONAL LEARNING DASHBOARD - MAIN APP
   Routing, page rendering, interaction logic
   ============================================================ */

(function () {
  const LD = window.LD;
  const S = LD.STATUS;
  const I = LD.IMPORTANCE;

  /* ---------- Router ---------- */
  let currentPage = 'dashboard';
  let currentProgId = null;

  function navigate(page, progId) {
    currentPage = page;
    currentProgId = progId || null;
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });
    render();
    hideMobileSidebar();
  }

  /* ---------- Sidebar ---------- */
  function setupSidebar() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.page));
    });
    document.getElementById('hamburger').addEventListener('click', () => {
      const sb = document.getElementById('sidebar');
      sb.classList.toggle('open');
      let backdrop = document.querySelector('.sidebar-backdrop');
      if (sb.classList.contains('open')) {
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'sidebar-backdrop';
          backdrop.addEventListener('click', hideMobileSidebar);
          document.body.appendChild(backdrop);
        }
      } else if (backdrop) backdrop.remove();
    });
  }

  function hideMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    const b = document.querySelector('.sidebar-backdrop');
    if (b) b.remove();
  }

  function setupTheme() {
    const root = document.documentElement;
    const updateLabel = () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const el = document.getElementById('theme-label');
      const m = document.getElementById('theme-toggle-mobile');
      if (el) el.textContent = isDark ? 'Light Mode' : 'Dark Mode';
      if (m) m.textContent = isDark ? '☀️' : '🌙';
    };
    const toggle = () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      root.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('learningDashboard_theme', root.getAttribute('data-theme'));
      updateLabel();
      // re-render to catch chart colors
      render();
    };
    document.getElementById('theme-toggle').addEventListener('click', toggle);
    document.getElementById('theme-toggle-mobile').addEventListener('click', toggle);
    updateLabel();
  }

  /* ---------- BIND EVENTS (delegated, attached once) ---------- */
  let actionsBound = false;
  function bindEvents() {
    if (actionsBound) return;
    actionsBound = true;
    const content = document.getElementById('content');

    content.addEventListener('click', (e) => {
      // navigation from program links / roadmap nodes
      const navEl = e.target.closest('[data-nav-to]');
      if (navEl) {
        e.preventDefault();
        currentPage = navEl.dataset.navTo;
        currentProgId = navEl.dataset.prog || null;
        navigate(currentPage, currentProgId);
        return;
      }
      bindActions(e);
    });
  }

  /* ============================================================
     DASHBOARD PAGE
     ============================================================ */
  function renderDashboard() {
    const stats = LD.overallStats();
    const st = LD.studyStreak();

    const statCards = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon icon-bg-purple">🗂️</div>
          <div>
            <div class="stat-value">${stats.totalPrograms}</div>
            <div class="stat-label">Total Programs</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon-bg-green">✅</div>
          <div>
            <div class="stat-value">${stats.completedPrograms}</div>
            <div class="stat-label">Completed Programs</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon-bg-blue">🚀</div>
          <div>
            <div class="stat-value">${stats.inProgress}</div>
            <div class="stat-label">Programs In Progress</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon-bg-red">⏰</div>
          <div>
            <div class="stat-value">${stats.upcomingDeadlines}</div>
            <div class="stat-label">Upcoming Deadlines</div>
            <div class="stat-sub">Next 7 days</div>
          </div>
        </div>
      </div>`;

    const overall = `
      <section class="card mb-16">
        <div class="card-title">📊 Overall Learning Progress</div>
        <div class="flex-between mb-8">
          <span class="text-muted">${stats.doneTopics} / ${stats.totalTopics} topics mastered</span>
          <b style="font-size:18px">${stats.overallPercent}%</b>
        </div>
        <div class="progress"><div class="progress-fill ${stats.overallPercent >= 70 ? 'green' : ''}" style="width:${stats.overallPercent}%"></div></div>
        <div class="flex-between mt-8 text-muted text-small">
          <span>🔥 Study streak: <b style="color:var(--orange)">${st} day${st !== 1 ? 's' : ''}</b></span>
          <span>Top program: <b>${LD.esc((stats.currentFocus || {}).name || '—')}</b></span>
        </div>
      </section>`;

    /* --- Current Focus --- */
    const focus = stats.currentFocus;
    let focusHTML = `<div class="empty-state">No active program selected. Set one in Settings or pick a program.</div>`;
    let deadlineHTML = '';

    if (focus) {
      // today's topics = next incomplete topics = daily goal
      const goal = LD.state.settings.dailyGoalTopics || 3;
      const remaining = focus.topics.filter(tp => !LD.isTopicDone(tp)).slice(0, goal);

      focusHTML = `
        <div class="focus-card">
          <div class="focus-tech">Current Focus</div>
          <h3>${LD.esc(focus.name)}</h3>
          <div class="today-topics">
            ${remaining.length ? remaining.map(tp => `
              <div class="today-goal-chip">
                <span class="tgc-title">${LD.esc(tp.title)}</span>
                <span class="tgc-actions">
                  <button class="tgc-btn" data-progress-topic="${LD.esc(tp.id)}" data-prog="${LD.esc(focus.id)}" title="Mark practiced">${tp.status === S.NOT_STARTED ? '▶ Start' : '✅ Practice'}</button>
                  <button class="tgc-btn tgc-btn-primary" data-test-topic="${LD.esc(tp.id)}" data-prog="${LD.esc(focus.id)}" title="Take the test">📝 Test</button>
                </span>
              </div>`).join('') : '<span class="today-chip">All topics done! 🎉</span>'}
          </div>
          <div class="text-small" style="opacity:.9">🎯 Today's target: complete ${Math.min(goal, focus.topics.length)} topic${goal !== 1 ? 's' : ''} + take their tests.</div>
        </div>`;

      const d = LD.deadlineStatus(focus);
      const cls = d.key === 'behind' || d.key === 'critical' || d.key === 'overdue' ? 'behind' : d.key === 'ahead_ish' ? 'ahead_ish' : '';
      const iconColor = d.icon === '🟢' ? 'green' : d.icon === '🟠' ? 'yellow' : 'red';

      deadlineHTML = `
        <section class="card deadline-card ${cls}">
          <div class="card-title">📆 Deadline: ${LD.esc(focus.name)}</div>
          <div class="deadline-status-big"><b>${d.key === 'done' ? 'Completed 🎉' : (d.days >= 0 ? d.days + ' Days Remaining' : Math.abs(d.days) + ' Days Overdue')}</b></div>
          <div class="grid grid-2" style="gap:10px">
            <div class="text-muted text-small">Topics remaining: <b style="color:var(--text)">${d.remaining}</b></div>
            <div class="text-muted text-small">Required: <b style="color:var(--text)">≈ ${d.required.toFixed(d.required >= 1 ? 0 : 1)} topics/day</b></div>
          </div>
          <div class="mt-8">${UI.deadlineBadge(d)}</div>
        </section>`;
    }

    /* --- Current programs grid --- */
    const progCards = LD.state.programs
      .map(p => {
        const pct = LD.completionPercent(p);
        const done = LD.countCompleted(p);
        const total = LD.countTopics(p);
        const d = LD.deadlineStatus(p);
        const st = LD.programStatus(p);
        return `
          <div class="program-card" data-nav-to="programs" data-prog="${LD.esc(p.id)}" style="cursor:pointer">
            <div class="prog-head">
              <div>
                <div class="prog-name">${LD.esc(p.name)}</div>
                <div class="prog-meta">${total} topics • ${p.difficulty}</div>
              </div>
              ${LD.programStatBadge(st)}
            </div>
            <div class="flex-between">
              <span class="text-small text-muted">${done}/${total} done</span>
              <b class="text-small">${pct}%</b>
            </div>
            <div class="progress"><div class="progress-fill ${pct >= 100 ? 'green' : ''}" style="width:${pct}%"></div></div>
            <div class="prog-stats-row mt-8">
              <span>⏳ ${d.days >= 0 ? d.days + 'd left' : 'overdue'}</span>
              ${UI.deadlineBadge(d)}
            </div>
            <div class="prog-stats-row">
              <span>Test avg: <b>${LD.programTestAverage(p) != null ? LD.programTestAverage(p) + '%' : '—'}</b></span>
              <span>${done >= total ? '✅ Complete' : `${total - done} remaining`}</span>
            </div>
          </div>`;
      }).join('');

    return `
      <div class="page-header">
        <h1>Learning Dashboard</h1>
        <div class="sub">LEARN → PRACTICE → TEST → ANALYZE → REVISE → MASTER</div>
      </div>
      ${statCards}
      ${overall}
      <div class="grid grid-2 mb-16">
        ${focusHTML ? `<div>${focusHTML}</div>` : ''}
        ${deadlineHTML ? `<div>${deadlineHTML}</div>` : ''}
      </div>
      <section>
        <div class="flex-between mb-12">
          <h2 style="font-size:18px">Current Programs</h2>
          <button class="btn btn-primary btn-sm" data-btn-add-program>+ Add Program</button>
        </div>
        <div class="grid grid-3">${progCards}</div>
      </section>`;
  }

  /* ============================================================
     PROGRAMS PAGE (list + detail)
     ============================================================ */
  function renderPrograms() {
    if (currentProgId) {
      const p = LD.state.programs.find(x => x.id === currentProgId);
      if (p) return renderProgramDetail(p);
      currentProgId = null;
    }
    return renderProgramList();
  }

  function renderProgramList() {
    const cards = LD.state.programs.map(p => {
      const pct = LD.completionPercent(p);
      const d = LD.deadlineStatus(p);
      const st = LD.programStatus(p);
      const avg = LD.programTestAverage(p);
      return `
        <div class="program-card">
          <div class="prog-head">
            <div>
              <div class="prog-name">${LD.esc(p.name)}</div>
              <div class="prog-meta">${LD.esc(p.difficulty)} • Start: ${formatDate(p.startDate)}</div>
            </div>
            ${LD.programStatBadge(st)}
          </div>
          <div class="flex-between">
            <span class="text-small text-muted">${LD.countCompleted(p)}/${LD.countTopics(p)} topics</span>
            <b>${pct}%</b>
          </div>
          <div class="progress"><div class="progress-fill ${pct >= 100 ? 'green' : ''}" style="width:${pct}%"></div></div>
          <div class="prog-stats-row mt-8">
            <span>Target: <b>${formatDate(p.targetDate)}</b></span>
            <span>⏳ ${d.days >= 0 ? d.days + (d.days===1?' day':' days') + ' left' : 'overdue'}</span>
          </div>
          <div class="prog-stats-row">
            <span>📝 Test avg: <b>${avg != null ? avg + '%' : '—'}</b></span>
            <span>${UI.deadlineBadge(d)}</span>
          </div>
          <div class="flex-between mt-8">
            <button class="btn btn-primary btn-sm" data-open-prog="${LD.esc(p.id)}">Open</button>
            <button class="btn btn-sm btn-ghost" data-edit-prog="${LD.esc(p.id)}">✏️ Edit</button>
            <button class="btn btn-sm btn-red" data-del-prog="${LD.esc(p.id)}">🗑</button>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="page-header">
        <h1>My Programs</h1>
        <div class="sub">Manage your learning programs and their topics.</div>
      </div>
      <div class="mb-16 flex-between">
        <div></div>
        <button class="btn btn-primary" data-btn-add-program>+ New Program</button>
      </div>
      <div class="grid grid-3">${cards || '<div class="empty-state">No programs yet.</div>'}</div>`;
  }

  function renderProgramDetail(p) {
    const pct = LD.completionPercent(p);
    const done = LD.countCompleted(p);
    const remain = LD.countRemaining(p);
    const d = LD.deadlineStatus(p);
    const avg = LD.programTestAverage(p);
    const clsCard = d.key === 'behind' || d.key === 'critical' || d.key === 'overdue' ? 'behind' : d.key === 'ahead_ish' ? 'ahead_ish' : '';

    // filter bar
    const sortTopics = (topics) => topics.slice().sort((a, b) => {
      const oa = LD.IMPORTANCE_META[a.importance].order;
      const ob = LD.IMPORTANCE_META[b.importance].order;
      return oa - ob;
    });

    const topicRows = sortTopics(p.topics).map(tp => {
      const m = LD.STATUS_META[tp.status];
      const pass = p.passingScore || 70;
      const testInfo = !tp.testTaken ? '<span class="badge badge-gray">Test: Not Taken</span>'
        : tp.passed ? `<span class="badge badge-green">Test: ${tp.testScore}% ✅</span>`
        : `<span class="badge badge-red">Test: ${tp.testScore}% 🔁 Revise</span>`;
      const revInfo = tp.revisionRequired ? '<span class="badge badge-red">Revision Required</span>' : (tp.testTake && tp.passed) || tp.testTaken ? '<span class="badge badge-green">No Revision Needed</span>' : '';

      const isMust = tp.importance === I.MUST;
      return `
        <div class="topic-row ${isMust ? 'highlight' : ''} ${LD.isTopicDone(tp) ? 'done' : ''}">
          <div class="topic-title">
            ${LD.esc(tp.title)}
            ${isMust ? '<span class="badge badge-yellow" style="margin-left:6px">⭐</span>' : ''}
          </div>
          <div class="flex-center" style="gap:6px;flex-wrap:wrap">
            ${UI.impBadge(tp.importance)}
            ${UI.statusBadge(tp.status)}
            ${testInfo}
            ${revInfo}
          </div>
          <div class="actions">
            ${tp.status !== S.MASTERED ? `<button class="btn btn-sm" data-progress-topic="${LD.esc(tp.id)}" data-prog="${LD.esc(p.id)}">${tp.status === S.NOT_STARTED ? 'Start' : tp.status === S.LEARNING ? 'Practice' : 'Practice'}</button>` : ''}
            <button class="btn btn-sm btn-primary" data-test-topic="${LD.esc(tp.id)}" data-prog="${LD.esc(p.id)}">📝 Test</button>
            ${tp.testTaken ? `<button class="btn btn-sm btn-green" data-retest-topic="${LD.esc(tp.id)}" data-prog="${LD.esc(p.id)}">↻ Retake</button>` : ''}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="page-header flex-between">
        <div>
          <button class="btn btn-sm btn-ghost" data-back-programs>← All Programs</button>
          <h1 style="margin-top:8px">${LD.esc(p.name)}</h1>
          <div class="sub">${LD.esc(p.difficulty)} • ${formatDate(p.startDate)} → ${formatDate(p.targetDate)} • ${p.days} days</div>
        </div>
        <div class="flex-center" style="gap:8px">
          <button class="btn btn-sm" data-edit-prog="${LD.esc(p.id)}">✏️ Edit Program</button>
          <button class="btn btn-sm btn-primary" data-open-summary="${LD.esc(p.id)}">📖 Final Summary</button>
        </div>
      </div>

      <div class="grid grid-4 mb-16" style="gap:16px">
        <div class="card">
          <div class="card-title">Progress</div>
          <div class="flex-between mb-8"><span class="text-muted text-small">${done}/${p.topics.length} topics</span><b>${pct}%</b></div>
          <div class="progress"><div class="progress-fill ${pct>=100?'green':''}" style="width:${pct}%"></div></div>
        </div>
        <div class="card">
          <div class="card-title">Remaining</div>
          <div class="stat-value">${remain}</div>
          <div class="text-muted text-small">topics left</div>
        </div>
        <div class="card">
          <div class="card-title">Test Average</div>
          <div class="stat-value">${avg != null ? avg + '%' : '—'}</div>
          <div class="text-muted text-small">across topic tests</div>
        </div>
        <div class="card">
          <div class="card-title">Deadline</div>
          <div class="text-muted text-small">${d.days >= 0 ? d.days + ' days remaining' : Math.abs(d.days) + ' days overdue'}</div>
          <div class="text-muted text-small mb-8">${d.remaining} topics • ≈ ${d.required.toFixed(1)}/day</div>
          ${UI.deadlineBadge(d)}
        </div>
      </div>

      <section class="card deadline-card ${clsCard} mb-16">
        <div class="card-title">🗓️ Schedule Tracking</div>
        <div class="grid grid-2" style="gap:14px">
          <div>
            <div class="text-muted text-small">Days remaining</div>
            <div class="stat-value">${d.days >= 0 ? d.days : '0'}</div>
            <div class="text-muted text-small">on ${formatDate(p.targetDate)}</div>
          </div>
          <div>
            <div class="text-muted text-small">Required pace</div>
            <div class="stat-value">≈ ${d.required.toFixed(1)}</div>
            <div class="text-muted text-small">topics per day (${d.remaining} topics / ${Math.max(1,d.days)} days)</div>
          </div>
        </div>
        <div class="mt-8">${UI.deadlineBadge(d)}</div>
      </section>

      <div class="flex-between mb-12">
        <h2 style="font-size:18px">Topics (${p.topics.length})</h2>
        <button class="btn btn-sm" data-manage-topics="${LD.esc(p.id)}">⚙️ Manage Topics</button>
      </div>
      <div class="topic-list">${topicRows}</div>`;
  }

  /* ============================================================
     ROADMAP PAGE
     ============================================================ */
  function renderRoadmap() {
    const stats = LD.overallStats();
    let cur = null;
    LD.state.programs.forEach(p => {
      if (p.id === LD.state.settings.currentFocus) cur = p.id;
      if (!cur) cur = null;
    });

    // Build ordered roadmap based on a suggested order
    const order = ['html', 'css', 'js', 'git', 'react', 'node', 'next', 'dsa', 'sql'];
    const others = LD.state.programs.filter(p => !order.includes(p.id));

    const nodes = order
      .map(id => LD.state.programs.find(p => p.id === id))
      .filter(Boolean)
      .concat(others);

    const html = nodes.map(p => {
      const pct = LD.completionPercent(p);
      const isCurrent = p.id === (LD.state.settings.currentFocus);
      let icon = '🔴';
      if (pct >= 100) icon = '✅';
      else if (pct > 0) icon = '🟡';
      return `
        <div class="roadmap-node ${pct >= 100 ? 'done' : ''} ${isCurrent ? 'current' : ''}" style="cursor:pointer" data-nav-to="programs" data-prog="${LD.esc(p.id)}">
          <div class="rm-badge">${icon}</div>
          <div class="rm-tech">${LD.esc(p.name)}</div>
          <div class="rm-status">${pct}% • ${LD.countCompleted(p)}/${LD.countTopics(p)} done</div>
        </div>
        <div class="roadmap-arrow">↓</div>`;
    }).join('');

    return `
      <div class="page-header">
        <h1>Learning Roadmap</h1>
        <div class="sub">Your developer journey — click a node to open the program.</div>
      </div>
      <div class="roadmap-h-scroll">
        <div class="roadmap">
          ${html}
          <div class="roadmap-node final">
            <div class="rm-badge">🚀</div>
            <div class="rm-tech">Full Stack Developer</div>
            <div class="rm-status">(Optional: add your own final goal)</div>
          </div>
        </div>
      </div>`;
  }

  /* ============================================================
     TESTS PAGE
     ============================================================ */
  function renderTests() {
    const weekly = LD.state.weeklyTests.slice().reverse();
    const history = LD.state.testHistory.slice().reverse().slice(0, 12);

    const weeklyCount = LD.state.settings.weeklyQuestions || 10;
    const pass = LD.state.settings.weeklyPassingScore || 70;
    const isSunday = LD.isTodaySunday();

    const weeklyHTML = `
      <section class="card mb-16">
        <div class="card-title">📅 Sunday Weekly Test</div>
        ${isSunday ? `
          <div class="sunday-banner">
            <div>
              <b>Today is Sunday!</b> Take your weekly test covering this week's topics.
            </div>
            <button class="btn btn-sm" data-start-weekly>Start Weekly Test</button>
          </div>` : `
          <div class="text-muted mb-8">Weekly tests are available every Sunday.</div>
        `}
        <div class="text-muted text-small mb-12">${weeklyCount} questions • Topics from the current week • Passing score: ${pass}%</div>
        <h3 class="mb-8" style="font-size:15px">Previous Weekly Tests</h3>
        <div class="topic-list">
          ${weekly.length ? weekly.map(w => `
            <div class="topic-row">
              <div class="topic-title">
                ${LD.esc(w.weekLabel)}
                <div class="topic-sub">${LD.esc(formatDate(w.timestamp.slice(0,10)))} • ${w.topics.length} topic(s)</div>
              </div>
              <span class="badge ${w.passed ? 'badge-green' : 'badge-red'}">${w.score}/${w.total} • ${w.percentage}%</span>
              ${w.passed ? '<span class="badge badge-green">✅ Passed</span>' : '<span class="badge badge-red">🔁 Needs Revision</span>'}
              <button class="btn btn-sm btn-ghost" data-view-weekly="${w.id}">View</button>
            </div>`).join('') : '<div class="empty-state">No weekly tests taken yet.</div>'}
        </div>
      </section>`;

    const histHTML = `
      <section class="card">
        <div class="card-title">📝 Topic Test History</div>
        ${history.length ? `
          <div class="topic-list">
          ${history.map(h => `
            <div class="topic-row">
              <div class="topic-title">
                ${LD.esc(h.topicTitle)}
                <div class="topic-sub">${LD.esc(h.programName)} • ${LD.esc(formatDate(h.timestamp.slice(0,10)))}</div>
              </div>
              <span class="badge ${h.passed ? 'badge-green' : 'badge-red'}">${h.score}/${h.total} • ${h.percentage}%</span>
              ${h.passed ? '<span class="badge badge-green">✅</span>' : '<span class="badge badge-red">🔁</span>'}
              <button class="btn btn-sm btn-ghost" data-view-test="${h.id}">View</button>
            </div>`).join('')}
          </div>` : '<div class="empty-state">No topic tests taken yet.</div>'}
      </section>`;

    return `
      <div class="page-header">
        <h1>Tests</h1>
        <div class="sub">Weekly Sunday tests and your topic test history.</div>
      </div>
      ${weeklyHTML}
      ${histHTML}`;
  }

  /* ============================================================
     WEAK TOPICS PAGE
     ============================================================ */
  function renderWeak() {
    const weak = LD.weakTopics();
    return `
      <div class="page-header">
        <h1>Weak Topics</h1>
        <div class="sub">Topics you scored below passing on. Revise and retake to master them.</div>
      </div>
      ${weak.length ? weak.map(w => {
        const p = w.program;
        const tp = w.topic;
        const score = tp.testScore;
        const low = score == null || score < (p.passingScore || 70);
        return `
          <div class="weak-card">
            <div class="weak-left">
              <div class="wt-name">${LD.esc(tp.title)} <span class="text-muted text-small">(${LD.esc(p.name)})</span></div>
              <div class="wt-prog">Importance: ${LD.IMPORTANCE_META[tp.importance].icon} ${LD.IMPORTANCE_META[tp.importance].label} • Revisions: ${tp.revisions || 0}</div>
            </div>
            <div class="weak-score ${low ? 'low' : ''}">${score != null ? score + '%' : 'No test'}</div>
            <div class="flex-center" style="gap:8px">
              <button class="btn btn-sm" data-open-prog="${LD.esc(p.id)}">Revise</button>
              <button class="btn btn-sm btn-primary" data-test-topic="${LD.esc(tp.id)}" data-prog="${LD.esc(p.id)}">Retake Test</button>
            </div>
          </div>`;
      }).join('') : '<div class="empty-state">🎉 No weak topics. Great job learning!</div>'}`;
  }

  /* ============================================================
     FINAL SUMMARIES PAGE (list + per-program summary)
     ============================================================ */
  function renderSummaries() {
    if (currentProgId) {
      const p = LD.state.programs.find(x => x.id === currentProgId);
      if (p) return renderFinalSummary(p);
      currentProgId = null;
    }

    const programs = LD.state.programs
      .slice()
      .sort((a, b) => {
        const ca = LD.finalSummary(a).isComplete ? 1 : 0;
        const cb = LD.finalSummary(b).isComplete ? 1 : 0;
        return cb - ca;
      });

    const cards = programs.map(p => {
      const s = LD.finalSummary(p);
      const cls = s.isComplete ? 'done' : p.id === LD.state.settings.currentFocus ? 'current' : '';
      return `
        <div class="summary-card ${cls}">
          <div class="prog-head">
            <div>
              <div class="prog-name">${LD.esc(p.name)}</div>
              <div class="prog-meta">${LD.esc(LD.IMPORTANCE_META[p.topics[0]?.importance]?.label || '')}</div>
            </div>
            ${s.isComplete ? '<span class="badge badge-green">✅ Completed</span>' : `<span class="badge badge-blue">${s.completion}% complete</span>`}
          </div>
          <div class="progress mb-8"><div class="progress-fill ${s.isComplete ? 'green' : ''}" style="width:${s.completion}%"></div></div>
          <div class="prog-stats-row">
            <span>Topics: <b>${s.done}/${s.total}</b></span>
            <span>Test avg: <b>${s.avg != null ? s.avg + '%' : '—'}</b></span>
            <span>${s.isComplete ? 'Target: ' + s.targetDays + 'd • Actual: ' + s.actualDays + 'd' : LD.esc(p.difficulty)}</span>
          </div>
          <div class="mt-8">
            <button class="btn btn-sm btn-primary" data-open-summary="${LD.esc(p.id)}">📖 Open Summary</button>
          </div>
        </div>`;
    }).join('') || '<div class="empty-state">No programs yet.</div>';

    return `
      <div class="page-header">
        <h1>Final Summaries</h1>
        <div class="sub">A permanent revision document for every program — open it anytime, even after you finish.</div>
      </div>
      <div class="grid grid-3">${cards}</div>`;
  }

  function renderFinalSummary(p) {
    const s = LD.finalSummary(p);
    const pass = p.passingScore || 70;

    if (!s.isComplete) {
      const remainTopics = s.total - s.done;
      return `
      <div class="page-header">
        <button class="btn btn-sm btn-ghost mb-8" data-back-summaries>← All Summaries</button>
        <h1>🔒 ${LD.esc(p.name)} — Final Summary</h1>
      </div>
      <div class="card final-locked" style="max-width:600px;margin:0 auto;text-align:center;padding:32px">
        <div style="font-size:46px" class="mb-8">🔒</div>
        <h2 class="mb-8">Final Summary Locked</h2>
        <p class="text-muted mb-16">Complete all required topics and tests to generate your final summary.</p>

        <div class="grid grid-3 mb-16" style="gap:12px">
          <div class="card">
            <div class="card-title">Completion</div>
            <div class="stat-value" style="font-size:26px">${s.completion}%</div>
          </div>
          <div class="card">
            <div class="card-title">Topics Done</div>
            <div class="stat-value" style="font-size:26px">${s.done} <span class="text-muted" style="font-size:14px">/ ${s.total}</span></div>
            <div class="text-muted text-small mt-8">${remainTopics} remaining</div>
          </div>
          <div class="card">
            <div class="card-title">Tests To Pass</div>
            <div class="stat-value" style="font-size:26px">${s.missingTests}</div>
            <div class="text-muted text-small mt-8">passing score ${pass}%</div>
          </div>
        </div>

        <div class="progress mb-16" style="max-width:360px;margin:0 auto"><div class="progress-fill" style="width:${s.completion}%"></div></div>

        <button class="btn btn-primary" data-open-prog="${LD.esc(p.id)}">Continue Learning →</button>
      </div>`;
    }

    const strongRows = s.strong.length ? s.strong.map(x => `
      <li><span>${LD.esc(x.topic.title)} <span class="text-muted text-small">(${LD.esc(x.score)}%)</span></span><span class="list-score" style="color:var(--green)">✅</span></li>`).join('')
      : '<li class="text-muted">No strong topics yet.</li>';

    const weakRows = s.weak.length ? s.weak.map(x => `
      <li class="flex-between" style="padding:6px 0">
        <span>${LD.esc(x.topic.title)} <span class="text-muted text-small">(${x.score != null ? x.score + '%' : 'no test'})</span></span>
        <button class="btn btn-sm btn-red" data-test-topic="${LD.esc(x.topic.id)}" data-prog="${LD.esc(p.id)}">↻ Retest</button>
      </li>`).join('')
      : '<li class="text-muted">Nothing to revise. 🎉</li>';

    const chainHTML = s.chainTopics.length ? s.chainTopics.map(tp => LD.esc(tp.title)).join(' <span class="chain-arrow">→</span> ')
      : '<span class="text-muted">Learn and test topics to build your revision chain.</span>';

    const histRows = s.history.length ? s.history.slice(0, 12).map(h => `
      <div class="topic-row">
        <div class="topic-title">
          ${LD.esc(h.topicTitle)}
          <div class="topic-sub">${formatDate(h.timestamp.slice(0,10))} • Attempts saved</div>
        </div>
        <span class="badge ${h.passed ? 'badge-green' : 'badge-red'}">${h.score}/${h.total} • ${h.percentage}%</span>
        ${h.passed ? '<span class="badge badge-green">✅</span>' : '<span class="badge badge-red">🔁</span>'}
        <button class="btn btn-sm btn-ghost" data-view-test="${h.id}">View</button>
      </div>`).join('')
      : '<div class="empty-state">No tests taken for this program yet.</div>';

    const pctCls = s.isComplete ? 'green' : '';
    return `
      <div class="page-header">
        <button class="btn btn-sm btn-ghost mb-8" data-back-summaries>← All Summaries</button>
        <h1>📖 ${LD.esc(p.name)} — Final Summary</h1>
        <div class="sub">${s.isComplete ? 'Program completed — use this to revise anytime.' : 'In progress — your summary updates in real time.'}</div>
      </div>

      <div class="grid grid-4 mb-16" style="gap:16px">
        <div class="card">
          <div class="card-title">Completion</div>
          <div class="stat-value" style="font-size:32px">${s.completion}%</div>
          <div class="progress mt-8"><div class="progress-fill ${pctCls}" style="width:${s.completion}%"></div></div>
        </div>
        <div class="card">
          <div class="card-title">Topics Completed</div>
          <div class="stat-value" style="font-size:32px">${s.done} <span class="text-muted" style="font-size:16px">/ ${s.total}</span></div>
          <div class="text-muted text-small mt-8">${s.total - s.done} remaining</div>
        </div>
        <div class="card">
          <div class="card-title">Duration</div>
          <div class="stat-value" style="font-size:20px">${s.targetDays} days <span class="text-muted" style="font-size:14px">target</span></div>
          <div class="text-muted text-small mt-8">Actual: <b>${s.actualDays} day${s.actualDays !== 1 ? 's' : ''}</b></div>
        </div>
        <div class="card">
          <div class="card-title">Test Average</div>
          <div class="stat-value" style="font-size:32px">${s.avg != null ? s.avg + '%' : '—'}</div>
          <div class="text-muted text-small mt-8">passing score ${pass}%</div>
        </div>
      </div>

      <div class="grid grid-2 mb-16">
        <div class="card">
          <div class="card-title">💪 Strong Topics</div>
          <ul class="strong-list">${strongRows}</ul>
        </div>
        <div class="card">
          <div class="card-title">🔁 Needs Revision</div>
          <ul class="strong-list">${weakRows}</ul>
        </div>
      </div>

      <section class="card mb-16">
        <div class="card-title">📝 Test History</div>
        <div class="topic-list">${histRows}</div>
      </section>

      <section class="card final-summary-card">
        <div class="card-title">⚡ Quick Revision Chain</div>
        <div class="chain">${chainHTML}</div>
        <div class="text-muted text-small mt-8">Variables → … → Fetch API — skim this to refresh ${LD.esc(p.name)} fast.</div>
      </section>`;
  }

  /* ============================================================
     SEARCH & FILTERS PAGE
     ============================================================ */
  function renderSearch() {
    const statusOpts = ['', ...Object.keys(LD.STATUS_META)].map(k => `<option value="${k}">${k ? LD.STATUS_META[k].icon + ' ' + LD.STATUS_META[k].label : 'Any Status'}</option>`).join('');
    const impOpts = ['', ...Object.keys(LD.IMPORTANCE_META)].map(k => `<option value="${k}">${k ? LD.IMPORTANCE_META[k].icon + ' ' + LD.IMPORTANCE_META[k].label : 'Any Importance'}</option>`).join('');
    const progOpts = `<option value="">All Programs</option>` + LD.state.programs.map(p => `<option value="${p.id}">${LD.esc(p.name)}</option>`).join('');

    return `
      <div class="page-header">
        <h1>Search & Filters</h1>
        <div class="sub">Find programs, topics and tests with a query or filter.</div>
      </div>

      <div class="card mb-16">
        <div class="filter-bar">
          <input type="text" id="sf-query" class="search-input" placeholder="Search programs, topics, tests…">
          <select id="sf-program">${progOpts}</select>
          <select id="sf-status">${statusOpts}</select>
          <select id="sf-importance">${impOpts}</select>
          <select id="sf-type">
            <option value="">All Results</option>
            <option value="topics">Topics only</option>
            <option value="programs">Programs only</option>
            <option value="tests">Tests only</option>
          </select>
        </div>
        <div class="flex-center" style="gap:14px;flex-wrap:wrap">
          <label class="sf-check"><input type="checkbox" id="sf-weak"> ⚠️ Weak only</label>
          <label class="sf-check"><input type="checkbox" id="sf-rev"> 🔁 Needs revision</label>
          <label class="sf-check"><input type="checkbox" id="sf-done"> ✅ Completed only</label>
          <label class="sf-check"><input type="checkbox" id="sf-remain"> 🚧 Remaining only</label>
        </div>
      </div>

      <div id="search-results"></div>`;
  }

  function applySearch() {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;
    const q = (document.getElementById('sf-query').value || '').toLowerCase().trim();
    const progId = document.getElementById('sf-program').value;
    const status = document.getElementById('sf-status').value;
    const importance = document.getElementById('sf-importance').value;
    const type = document.getElementById('sf-type').value;
    const onlyWeak = document.getElementById('sf-weak').checked;
    const onlyRev = document.getElementById('sf-rev').checked;
    const onlyDone = document.getElementById('sf-done').checked;
    const onlyRemain = document.getElementById('sf-remain').checked;

    const match = (text) => !q || String(text).toLowerCase().includes(q);

    /* --- Programs --- */
    let progHTML = '';
    if (type !== 'topics' && type !== 'tests') {
      const progRows = LD.state.programs
        .filter(p => (progId ? p.id === progId : true) && (match(p.name) || p.topics.some(t => match(t.title))))
        .map(p => {
          const pct = LD.completionPercent(p);
          const st = LD.programStatus(p);
          return `
            <div class="topic-row">
              <div class="topic-title">
                ${LD.esc(p.name)}
                <div class="topic-sub">${LD.countCompleted(p)}/${LD.countTopics(p)} topics • ${pct}%</div>
              </div>
              ${LD.programStatBadge(st)}
              <div class="flex-center" style="gap:6px">
                <button class="btn btn-sm btn-ghost" data-open-prog="${LD.esc(p.id)}">Open</button>
                <button class="btn btn-sm btn-primary" data-open-summary="${LD.esc(p.id)}">Summary</button>
              </div>
            </div>`;
        }).join('');
      progHTML = `
        <section class="card mb-16">
          <div class="card-title">🗂️ Programs (${progRows ? countRows(progRows) : 0})</div>
          <div class="topic-list">${progRows || '<div class="empty-state">No matching programs.</div>'}</div>
        </section>`;
    }

    /* --- Topics --- */
    let topicHTML = '';
    if (type !== 'programs' && type !== 'tests') {
      const rows = [];
      LD.state.programs.forEach(p => {
        if (progId && p.id !== progId) return;
        p.topics.forEach(tp => {
          if (q && !match(tp.title) && !match(p.name)) return;
          if (status && tp.status !== status) return;
          if (importance && tp.importance !== importance) return;
          if (onlyWeak && !(tp.revisionRequired || (tp.testTaken && !tp.passed))) return;
          if (onlyRev && !tp.revisionRequired) return;
          if (onlyDone && !LD.isTopicDone(tp)) return;
          if (onlyRemain && LD.isTopicDone(tp)) return;
          rows.push(`<div class="topic-row">
            <div class="topic-title">
              ${LD.esc(tp.title)}
              <div class="topic-sub">${LD.esc(p.name)} • ${p.topics.length ? '⭐' : ''}</div>
            </div>
            ${UI.impBadge(tp.importance)}
            ${UI.statusBadge(tp.status)}
            ${tp.testTaken ? (tp.passed ? '<span class="badge badge-green">' + tp.testScore + '% ✅</span>' : '<span class="badge badge-red">' + tp.testScore + '% 🔁</span>') : '<span class="badge badge-gray">Test: Not Taken</span>'}
            <div class="flex-center" style="gap:6px">
              <button class="btn btn-sm" data-progress-topic="${LD.esc(tp.id)}" data-prog="${LD.esc(p.id)}">${tp.status === S.NOT_STARTED ? 'Start' : 'Practice'}</button>
              <button class="btn btn-sm btn-primary" data-test-topic="${LD.esc(tp.id)}" data-prog="${LD.esc(p.id)}">📝 Test</button>
            </div>
          </div>`);
        });
      });
      topicHTML = `
        <section class="card mb-16">
          <div class="card-title">📚 Topics (${rows.length})</div>
          <div class="topic-list">${rows.join('') || '<div class="empty-state">No matching topics.</div>'}</div>
        </section>`;
    }

    /* --- Tests --- */
    let testHTML = '';
    if (type !== 'topics' && type !== 'programs') {
      const testRows = LD.state.testHistory
        .filter(h => (progId ? h.programId === progId : true) && (!q || match(h.topicTitle) || match(h.programName)))
        .slice()
        .reverse()
        .slice(0, 20)
        .map(h => `
          <div class="topic-row">
            <div class="topic-title">
              ${LD.esc(h.topicTitle)}
              <div class="topic-sub">${LD.esc(h.programName)} • ${formatDate(h.timestamp.slice(0,10))}</div>
            </div>
            <span class="badge ${h.passed ? 'badge-green' : 'badge-red'}">${h.score}/${h.total} • ${h.percentage}%</span>
            <button class="btn btn-sm btn-ghost" data-view-test="${h.id}">View</button>
          </div>`).join('');
      testHTML = `
        <section class="card">
          <div class="card-title">📝 Tests (${testRows ? countRows(testRows) : 0})</div>
          <div class="topic-list">${testRows || '<div class="empty-state">No matching tests.</div>'}</div>
        </section>`;
    }

    resultsEl.innerHTML = (progHTML + topicHTML + testHTML) || '<div class="empty-state">No results.</div>';
  }

  function countRows(html) {
    return (html.match(/topic-row/g) || []).length;
  }

  /* ============================================================
     ANALYTICS PAGE
     ============================================================ */
  function renderAnalytics() {
    const stats = LD.overallStats();
    const st = LD.studyStreak();
    const strong = LD.strongTopics(5);
    const weak = LD.weakTopics();

    const allTests = LD.state.testHistory.concat(LD.state.weeklyTests);
    const avgPct = allTests.length
      ? Math.round(allTests.reduce((a, t) => a + t.percentage, 0) / allTests.length) : null;

    const progData = LD.state.programs.map(p => ({ label: p.name, value: LD.completionPercent(p) }));
    const weakData = weak.slice(0, 6).map(w => ({ label: w.topic.title, value: w.topic.testScore || 0 }));
    const weakColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];

    // weekly progress (per week)
    const weeklyScores = LD.state.weeklyTests.slice().map(w => w.percentage);
    const weeklyLabels = LD.state.weeklyTests.slice().map(w => w.weekLabel);
    const weeklyCount = LD.state.settings.weeklyQuestions || 10;
    const weeklyPass = LD.state.settings.weeklyPassingScore || 70;

    // deadline performance per program
    const deadlinePerf = LD.state.programs.map(p => {
      const d = LD.deadlineStatus(p);
      return { name: p.name, status: d.label, onTrack: d.key === 'ontrack' || d.key === 'done' };
    });

    return `
      <div class="page-header">
        <h1>Analytics</h1>
        <div class="sub">Track your progress, test performance and study consistency.</div>
      </div>

      <div class="analytic-nums">
        <div class="card">
          <div class="stat-label text-muted">Overall Learning</div>
          <div class="stat-value" style="font-size:32px">${stats.overallPercent}%</div>
          <div class="progress mt-8"><div class="progress-fill" style="width:${stats.overallPercent}%"></div></div>
        </div>
        <div class="card">
          <div class="stat-label text-muted">Average Test Score</div>
          <div class="stat-value" style="font-size:32px">${avgPct != null ? avgPct + '%' : '—'}</div>
          <div class="text-muted text-small mt-8">${allTests.length} test(s) taken</div>
        </div>
        <div class="card">
          <div class="stat-label text-muted">Study Streak</div>
          <div class="stat-value" style="font-size:32px">🔥 ${st}</div>
          <div class="text-muted text-small mt-8">consecutive active day${st !== 1 ? 's' : ''}</div>
        </div>
        <div class="card">
          <div class="stat-label text-muted">Topic Tests Passed</div>
          <div class="stat-value" style="font-size:32px">${LD.state.testHistory.filter(t => t.passed).length}/${LD.state.testHistory.length}</div>
          <div class="text-muted text-small mt-8">Total topic tests</div>
        </div>
      </div>

      <div class="grid grid-2 mb-16">
        <div class="analytics-chart">
          <div class="card-title">Program-wise Progress (%)</div>
          <canvas id="chart-programs"></canvas>
        </div>
        <div class="analytics-chart">
          <div class="card-title">Weekly Test Performance (%)</div>
          ${weeklyScores.length
            ? `<canvas id="chart-weekly"></canvas><div class="text-muted text-small mt-8">Passing score: ${weeklyPass}%</div>`
            : '<div class="empty-state">No weekly tests yet.</div>'}
        </div>
      </div>

      <div class="grid grid-2 mb-16">
        <div class="card">
          <div class="card-title">💪 Strong Topics</div>
          <ul class="strong-list">
            ${strong.length ? strong.map(s => `
              <li><span>${LD.esc(s.topic.title)} <span class="text-muted text-small">(${LD.esc(s.program.name)})</span></span><span class="list-score" style="color:var(--green)">${s.score}%</span></li>`).join('')
            : '<li class="text-muted">No mastered topics yet.</li>'}
          </ul>
        </div>
        <div class="card">
          <div class="card-title">⚠️ Weak Topics</div>
          ${weak.length ? `
            <div class="mt-8">
              <canvas id="chart-weak" style="height:${Math.max(120, weak.length * 28)}px"></canvas>
            </div>`
            : '<div class="empty-state">No weak topics. 🎉</div>'}
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">🎯 Deadline Performance</div>
          <div class="topic-list">
            ${deadlinePerf.map(pd => `
              <div class="topic-row">
                <div class="topic-title">${LD.esc(pd.name)}</div>
                <span class="badge ${pd.onTrack ? 'badge-green' : 'badge-red'}">${LD.esc(pd.status)}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="analytics-chart">
          <div class="card-title">Overall Mastery Distribution</div>
          <canvas id="chart-donut"></canvas>
          <div id="donut-legend" class="mt-8"></div>
        </div>
      </div>
    `;
  }

  function drawAnalyticsCharts() {
    // program bar chart
    const pc = document.getElementById('chart-programs');
    if (pc) {
      const data = LD.state.programs.map(p => ({ label: p.name, value: LD.completionPercent(p) }));
      ChartLib.drawBarChart(pc, data.map(d => d.label), data.map(d => d.value), { valueLabels: true, round: true });
    }
    // weekly line chart
    const wc = document.getElementById('chart-weekly');
    if (wc) {
      const ws = LD.state.weeklyTests.slice();
      ChartLib.drawLineChart(wc, ws.map(w => w.weekLabel.replace('Week of ', '')), ws.map(w => w.percentage));
    }
    // weak hbar
    const wb = document.getElementById('chart-weak');
    if (wb) {
      const weak = LD.weakTopics().slice(0, 8);
      ChartLib.drawHBar(wb, weak.map(w => w.topic.title), weak.map(w => w.topic.testScore || 0), weakColors);
    }
    // donut
    const dc = document.getElementById('chart-donut');
    if (dc) {
      let nt = 0, le = 0, pr = 0, te = 0, ma = 0;
      LD.state.programs.forEach(p => p.topics.forEach(tp => {
        if (tp.status === S.NOT_STARTED) nt++;
        else if (tp.status === S.LEARNING) le++;
        else if (tp.status === S.PRACTICED) pr++;
        else if (tp.status === S.TESTED) te++;
        else ma++;
      }));
      const c1 = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366f1';
      const colors = {
        not_started: '#9ca3af',
        learning: '#f59e0b',
        practiced: '#3b82f6',
        tested: '#10b981',
        mastered: '#8b5cf6'
      };
      const segs = [
        { value: nt, color: colors.not_started },
        { value: le, color: colors.learning },
        { value: pr, color: colors.practiced },
        { value: te, color: colors.tested },
        { value: ma, color: colors.mastered }
      ].filter(s => s.value > 0);
      const totalTopics = LD.state.programs.reduce((a,p)=>a+p.topics.length,0);
      const labels = [
        [`${S.NOT_STARTED === 'not_started' ? 'Not Started' : 'Not Started'}: ${nt}`, ''],
        [`Learning: ${le}`, ''],
        [`Practiced: ${pr}`, ''],
        [`Tested: ${te}`, ''],
        [`Mastered: ${ma}`, '']
      ];
      ChartLib.drawDonut(dc, segs, { centerText: totalTopics.toString(), centerSub: 'topics' });
      const legend = document.getElementById('donut-legend');
      if (legend) {
        legend.innerHTML = ['🔴 Not Started','🟡 Learning','🔵 Practiced','🟢 Tested','🏆 Mastered']
          .map((l, i) => `<span class="badge ${['badge-gray','badge-yellow','badge-blue','badge-green','badge-purple'][i]}" style="margin:2px">${l}: ${[nt,le,pr,te,ma][i]}</span>`).join(' ');
      }
    }
  }

  /* ============================================================
     SETTINGS PAGE
     ============================================================ */
  function renderSettings() {
    const s = LD.state.settings;
    return `
      <div class="page-header">
        <h1>Settings</h1>
        <div class="sub">Adjust your dashboard defaults.</div>
      </div>

      <div class="grid grid-2">
        <section class="card">
          <div class="card-title">🧪 Test Settings</div>
          <div class="form-row">
            <label>Default Passing Score (%)</label>
            <input type="number" id="set-pass" value="${s.defaultPassingScore || 70}" min="0" max="100">
          </div>
          <div class="form-row">
            <label>Questions per Topic Test</label>
            <input type="number" id="set-q" value="${s.questionsPerTest || 5}" min="1" max="20">
          </div>
          <div class="form-row">
            <label>Weekly Test Passing Score (%)</label>
            <input type="number" id="set-wpass" value="${s.weeklyPassingScore || 70}" min="0" max="100">
          </div>
          <div class="form-row">
            <label>Weekly Test Questions</label>
            <input type="number" id="set-wq" value="${s.weeklyQuestions || 10}" min="1" max="30">
          </div>
        </section>

        <section class="card">
          <div class="card-title">🎯 Focus Settings</div>
          <div class="form-row">
            <label>Current Focus Program</label>
            <select id="set-focus">
              <option value="">— None —</option>
              ${LD.state.programs.map(p => `<option value="${LD.esc(p.id)}" ${s.currentFocus === p.id ? 'selected' : ''}>${LD.esc(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>Daily Goal (topics + tests per day)</label>
            <input type="number" id="set-goal" value="${s.dailyGoalTopics || 3}" min="1" max="20">
          </div>
        </section>
      </div>

      <div class="grid grid-2 mt-16">
        <section class="card">
          <div class="card-title">💾 Data</div>
          <p class="text-muted text-small mb-12">All data is stored in your browser (localStorage). You can export/import or reset.</p>
          <div class="flex-center" style="gap:8px;flex-wrap:wrap">
            <button class="btn" data-export>⬇️ Export Data</button>
            <button class="btn" data-import>⬆️ Import Data</button>
            <button class="btn btn-red" data-reset>🗑 Reset All Data</button>
          </div>
        </section>
        <section class="card">
          <div class="card-title">ℹ️ About</div>
          <p class="text-muted text-small mb-8">Personal Learning Dashboard</p>
          <p class="text-muted text-small">Track what you need to learn, test yourself, identify weak spots, and reach mastery — all while completing each program by its deadline.</p>
          <div class="mt-12" style="font-size:13px;line-height:1.8">
            <div>⭐ Must Learn</div>
            <div>🔹 Important</div>
            <div>⚪ Advanced / Optional</div>
            <div class="mt-8">🔴 Not Started → 🟡 Learning → 🔵 Practiced → 🟢 Tested → 🏆 Mastered</div>
          </div>
        </section>
      </div>`;
  }

  /* ============================================================
     INTERACTION HANDLERS (delegated, called after each render)
     ============================================================ */
  function bindActions(e) {
    const target = e.target.closest('button, [data-role]');
    if (!target) return;

    // Add program
      if (target.matches('[data-btn-add-program]')) {
        openAddProgram();
        return;
      }
      // Open program
      if (target.matches('[data-open-prog]')) {
        const id = target.dataset.openProg;
        navigate('programs', id);
        return;
      }
      // Back
      if (target.matches('[data-back-programs]')) {
        navigate('programs', null);
        return;
      }
      // Open final summary
      if (target.matches('[data-open-summary]')) {
        navigate('summaries', target.dataset.openSummary);
        return;
      }
      // Back to summaries
      if (target.matches('[data-back-summaries]')) {
        navigate('summaries', null);
        return;
      }
      // Edit program
      if (target.matches('[data-edit-prog]')) {
        openEditProgram(target.dataset.editProg);
        return;
      }
      // Delete program
      if (target.matches('[data-del-prog]')) {
        deleteProgram(target.dataset.delProg);
        return;
      }
      // Manage topics
      if (target.matches('[data-manage-topics]')) {
        openManageTopics(target.dataset.manageTopics);
        return;
      }
      // Progress topic
      if (target.matches('[data-progress-topic]')) {
        progressTopic(target.dataset.prog, target.dataset.progressTopic);
        return;
      }
      // Test topic
      if (target.matches('[data-test-topic]')) {
        startTopicTest(target.dataset.prog, target.dataset.testTopic);
        return;
      }
      // Retest
      if (target.matches('[data-retest-topic]')) {
        startTopicTest(target.dataset.prog, target.dataset.retestTopic || target.dataset.testTopic);
        return;
      }
      // Start weekly
      if (target.matches('[data-start-weekly]')) {
        startWeeklyTest();
        return;
      }
      // View weekly result
      if (target.matches('[data-view-weekly]')) {
        viewWeeklyResult(target.dataset.viewWeekly);
        return;
      }
      // View test result
      if (target.matches('[data-view-test]')) {
        viewTestResult(target.dataset.viewTest);
        return;
      }
    // Settings actions
    if (target.matches('[data-export]')) { exportData(); return; }
    if (target.matches('[data-import]')) { importData(); return; }
    if (target.matches('[data-reset]')) { resetData(); return; }
  }

  /* ---------- Add program ---------- */
  function openAddProgram() {
    const today = LD.todayISO();
    const target = LD.addDaysISO(today, 14);
    const html = `
      <div class="form-row">
        <label>Program Name</label>
        <input type="text" id="ap-name" placeholder="e.g. TypeScript">
      </div>
      <div class="grid grid-2" style="gap:12px">
        <div class="form-row">
          <label>Start Date</label>
          <input type="date" id="ap-start" value="${today}">
        </div>
        <div class="form-row">
          <label>Target Date</label>
          <input type="date" id="ap-target" value="${target}">
        </div>
      </div>
      <div class="form-row">
        <label>Difficulty</label>
        <select id="ap-diff">
          <option value="Beginner">Beginner</option>
          <option value="Intermediate" selected>Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>
      <div class="form-row">
        <label>Passing Score (%)</label>
        <input type="number" id="ap-pass" value="${LD.state.settings.defaultPassingScore || 70}" min="0" max="100">
      </div>
      <div class="form-row">
        <label>Topics (one per line)</label>
        <textarea id="ap-topics" rows="6" placeholder="Variables&#10;Functions&#10;Objects"></textarea>
      </div>`;

    const modal = openModal('New Learning Program', html, `
      <button class="btn" data-cancel>Cancel</button>
      <button class="btn btn-primary" id="ap-save">Create Program</button>`);

    modal.querySelector('#ap-save').addEventListener('click', () => {
      const name = modal.querySelector('#ap-name').value.trim();
      if (!name) { showToast('Please enter a program name.', 'error'); return; }
      const start = modal.querySelector('#ap-start').value;
      const targetDate = modal.querySelector('#ap-target').value;
      const diff = modal.querySelector('#ap-diff').value;
      const pass = parseInt(modal.querySelector('#ap-pass').value) || 70;
      const topicsRaw = modal.querySelector('#ap-topics').value.split('\n').map(s => s.trim()).filter(Boolean);

      if (!start || !targetDate) { showToast('Set start and target dates.', 'error'); return; }
      const startD = parseISO(start), targetD = parseISO(targetDate);
      if (targetD < startD) { showToast('Target date must be after start date.', 'error'); return; }

      let id = makeProgId(name);
      if (LD.state.programs.some(p => p.id === id)) {
        // make unique
        id = id + '_' + Date.now().toString(36);
      }

      const days = Math.max(1, Math.round((targetD - startD) / (1000*60*60*24)) + 1);
      const program = {
        id: id, name, difficulty: diff, startDate: start, targetDate: targetDate,
        days, passingScore: pass, createdAt: Date.now(),
        topics: topicsRaw.map((title, i) => ({
          id: makeTopicId(id, title), programId: id, title,
          importance: I.IMPORTANT, status: S.NOT_STARTED,
          testScore: null, testTaken: false, passed: false,
          revisionRequired: false, revisions: 0, completions: 0, order: i
        }))
      };
      LD.state.programs.push(program);
      LD.saveState();
      closeModal(modal);
      showToast('Program created!', 'success');
      navigate('programs', program.id);
    });
    modal.querySelector('[data-cancel]').addEventListener('click', () => closeModal(modal));
  }

  function makeProgId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'program';
  }
  function makeTopicId(progId, title) {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return progId + '_' + (base || 'topic');
  }

  /* ---------- Edit program ---------- */
  function openEditProgram(id) {
    const p = LD.state.programs.find(x => x.id === id);
    if (!p) return;
    const html = `
      <div class="form-row">
        <label>Program Name</label>
        <input type="text" id="ep-name" value="${LD.esc(p.name)}">
      </div>
      <div class="grid grid-2" style="gap:12px">
        <div class="form-row">
          <label>Start Date</label>
          <input type="date" id="ep-start" value="${p.startDate}">
        </div>
        <div class="form-row">
          <label>Target Date</label>
          <input type="date" id="ep-target" value="${p.targetDate}">
        </div>
      </div>
      <div class="form-row">
        <label>Difficulty</label>
        <select id="ep-diff">
          ${Object.values(LD.DIFFICULTY).map(d => `<option value="${d}" ${p.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <label>Passing Score (%)</label>
        <input type="number" id="ep-pass" value="${p.passingScore || 70}" min="0" max="100">
      </div>`;
    const modal = openModal('Edit Program', html, `
      <button class="btn" data-cancel>Cancel</button>
      <button class="btn btn-primary" id="ep-save">Save</button>`);
    modal.querySelector('#ep-save').addEventListener('click', () => {
      p.name = modal.querySelector('#ep-name').value.trim() || p.name;
      p.startDate = modal.querySelector('#ep-start').value || p.startDate;
      p.targetDate = modal.querySelector('#ep-target').value || p.targetDate;
      p.difficulty = modal.querySelector('#ep-diff').value;
      p.passingScore = parseInt(modal.querySelector('#ep-pass').value) || 70;
      LD.saveState();
      closeModal(modal); showToast('Program updated.', 'success'); render();
    });
    modal.querySelector('[data-cancel]').addEventListener('click', () => closeModal(modal));
  }

  /* ---------- Delete program ---------- */
  function deleteProgram(id) {
    const p = LD.state.programs.find(x => x.id === id);
    if (!p) return;
    const modal = openModal('Delete Program', `
      <p>Are you sure you want to delete <b>${LD.esc(p.name)}</b>? This removes all its topics and progress.</p>`,
      `<button class="btn" data-cancel>Cancel</button>
       <button class="btn btn-red" id="del-yes">Delete</button>`);
    modal.querySelector('#del-yes').addEventListener('click', () => {
      LD.state.programs = LD.state.programs.filter(x => x.id !== id);
      LD.saveState(); closeModal(modal); showToast('Program deleted.', 'info'); render();
    });
    modal.querySelector('[data-cancel]').addEventListener('click', () => closeModal(modal));
  }

  /* ---------- Manage topics ---------- */
  function openManageTopics(progId) {
    const p = LD.state.programs.find(x => x.id === progId);
    if (!p) return;
    let topics = [...p.topics].sort((a, b) => a.order - b.order);

    function buildList() {
      return topics.map((tp, i) => `
        <div class="manage-topic" data-idx="${i}">
          <span class="drag">⠿</span>
          <input type="text" value="${LD.esc(tp.title)}" data-f-title>
          <select data-f-imp>
            ${Object.keys(LD.IMPORTANCE_META).map(k => `<option value="${k}" ${tp.importance === k ? 'selected' : ''}>${LD.IMPORTANCE_META[k].icon} ${LD.IMPORTANCE_META[k].label}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-ghost" data-move-up="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-sm btn-ghost" data-move-down="${i}" ${i === topics.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-sm btn-red" data-remove-topic="${i}">✕</button>
        </div>`).join('');
    }

    function renderList(container) { container.querySelector('.manage-topics').innerHTML = buildList(); }

    const html = `
      <div class="form-row">
        <label>Add Topic</label>
        <div class="flex-center" style="gap:8px">
          <input type="text" id="mt-new" placeholder="New topic name" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text)">
          <select id="mt-new-imp" style="padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text)">
            ${Object.keys(LD.IMPORTANCE_META).map(k => `<option value="${k}">${LD.IMPORTANCE_META[k].icon} ${LD.IMPORTANCE_META[k].label}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="mt-add">Add</button>
        </div>
      </div>
      <div class="manage-topics">${buildList()}</div>`;

    const modal = openModal('Manage Topics — ' + p.name, html, `
      <button class="btn btn-primary" data-save>Save Changes</button>`);

    modal.querySelector('#mt-add').addEventListener('click', () => {
      const name = modal.querySelector('#mt-new').value.trim();
      if (!name) return;
      const imp = modal.querySelector('#mt-new-imp').value;
      topics.push({
        id: makeTopicId(p.id, name) + '_' + Math.random().toString(36).slice(2,5),
        programId: p.id, title: name, importance: imp, status: S.NOT_STARTED,
        testScore: null, testTaken: false, passed: false, revisionRequired: false,
        revisions: 0, completions: 0, order: topics.length
      });
      modal.querySelector('#mt-new').value = '';
      renderList(modal);
    });

    modal.addEventListener('click', (e) => {
      const up = e.target.closest('[data-move-up]');
      const down = e.target.closest('[data-move-down]');
      const rm = e.target.closest('[data-remove-topic]');
      if (up) {
        const i = parseInt(up.dataset.moveUp);
        if (i > 0) { [topics[i], topics[i-1]] = [topics[i-1], topics[i]]; renderList(modal); }
      } else if (down) {
        const i = parseInt(down.dataset.moveDown);
        if (i < topics.length - 1) { [topics[i], topics[i+1]] = [topics[i+1], topics[i]]; renderList(modal); }
      } else if (rm) {
        const i = parseInt(rm.dataset.removeTopic);
        topics.splice(i, 1);
        renderList(modal);
      }
    });

    modal.querySelector('[data-save]').addEventListener('click', () => {
      modal.querySelectorAll('.manage-topic').forEach((row, i) => {
        const title = row.querySelector('[data-f-title]').value.trim();
        const imp = row.querySelector('[data-f-imp]').value;
        if (topics[i]) {
          topics[i].title = title || topics[i].title;
          topics[i].importance = imp;
          topics[i].order = i;
        }
      });
      p.topics = topics;
      LD.saveState();
      closeModal(modal); showToast('Topics updated.', 'success'); render();
    });
  }

  /* ---------- Progress topic (Start / Practice) ---------- */
  function progressTopic(progId, topicId) {
    const p = LD.state.programs.find(x => x.id === progId);
    if (!p) return;
    const tp = p.topics.find(x => x.id === topicId);
    if (!tp) return;

    // Start: NOT_STARTED -> LEARNING
    if (tp.status === S.NOT_STARTED) {
      tp.status = S.LEARNING;
    }
    // Practice: LEARNING -> PRACTICED (and further)
    else {
      tp.completions = (tp.completions || 0) + 1;
      if (tp.status !== S.MASTERED) tp.status = S.PRACTICED;
    }
    LD.saveState();
    render();
    showToast(`Topic "${tp.title}" updated.`, 'success');
  }

  /* ---------- Topic test ---------- */
  function startTopicTest(progId, topicId) {
    const p = LD.state.programs.find(x => x.id === progId);
    if (!p) return;
    const tp = p.topics.find(x => x.id === topicId);
    if (!tp) return;

    const count = LD.state.settings.questionsPerTest || 5;
    const pass = p.passingScore || 70;
    const questions = window.buildTopicTest(p, tp, count);
    if (!questions.length) { showToast('No questions available for this topic.', 'error'); return; }

    renderTestModal({
      title: `${p.name} — ${tp.title} Test`,
      questions,
      passingScore: pass,
      onComplete: (results, score, total) => {
        const percentage = Math.round((score / total) * 100);
        const passed = percentage >= pass;
        // update topic
        tp.testTaken = true;
        tp.testScore = percentage;
        tp.passed = passed;
        tp.revisionRequired = !passed;
        if (passed) {
          tp.revisions = 0;
          // upgrade status
          if (tp.status === S.TESTED) tp.status = S.MASTERED;
          else tp.status = S.TESTED;
        } else {
          tp.revisions = (tp.revisions || 0) + 1;
          // set to practiced if not further
          if (tp.status === S.NOT_STARTED || tp.status === S.LEARNING) tp.status = S.PRACTICED;
        }
        // record history
        const testResult = {
          id: LD.uid(), programId: p.id, programName: p.name,
          topicId: tp.id, topicTitle: tp.title,
          timestamp: new Date().toISOString(),
          score, total, percentage, passed, passingScore: pass,
          results
        };
        LD.state.testHistory.push(testResult);
        // mark program completion date the first time all topics are done
        if (LD.countRemaining(p) === 0 && !p.completedOn) {
          p.completedOn = LD.todayISO();
        }
        LD.saveState();
        // show result
        showTopicResult(testResult, tp);
      }
    });
  }

  /* ---------- Weekly test ---------- */
  function startWeeklyTest() {
    // collect topics studied this week: those with completions or testTaken in the last 7 days
    const weekStart = LD.currentWeekStartISO();
    const nowISO = LD.todayISO();
    const studiedIds = new Set();
    LD.state.testHistory.filter(h => h.timestamp.slice(0,10) >= weekStart && h.timestamp.slice(0,10) <= nowISO).forEach(h => studiedIds.add(h.topicId));
    // also topics recently practiced
    LD.state.programs.forEach(p => p.topics.forEach(tp => {
      if (tp.status === S.TESTED || tp.status === S.MASTERED) studiedIds.add(tp.id);
    }));

    let topicIds = [...studiedIds];
    // fallback: if empty use all incomplete? use must topics from first few programs
    if (topicIds.length < 3) {
      const extra = [];
      LD.state.programs.forEach(p => p.topics.forEach(tp => {
        if (tp.importance === I.MUST && extra.length < 8 && !topicIds.includes(tp.id)) extra.push(tp.id);
      }));
      topicIds = topicIds.concat(extra);
    }

    if (topicIds.length < 3) {
      showToast('Not enough topics studied this week. Practice some topics first.', 'error');
      return;
    }

    const count = Math.min(LD.state.settings.weeklyQuestions || 10, Math.max(5, topicIds.length * 2));
    const pass = LD.state.settings.weeklyPassingScore || 70;
    const questions = window.buildWeeklyTest(LD.state.programs, topicIds, count);

    renderTestModal({
      title: 'Sunday Weekly Test',
      subtype: 'weekly',
      questions,
      passingScore: pass,
      onComplete: (results, score, total) => {
        const percentage = Math.round((score / total) * 100);
        const passed = percentage >= pass;
        const weekStart2 = LD.currentWeekStartISO();
        const result = {
          id: LD.uid(), weekStart: weekStart2,
          weekLabel: LD.weekLabelFor(weekStart2),
          timestamp: new Date().toISOString(),
          score, total, percentage, passed, passingScore: pass,
          topics: topicIds, results
        };
        LD.state.weeklyTests.push(result);
        LD.saveState();
        viewWeeklyResult(result.id, true);
      }
    });
  }

  /* ---------- Generic test modal ---------- */
  function renderTestModal({ title, questions, passingScore, onComplete, subtype }) {
    const modal = openModal(title, '', '');
    // build body
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="text-muted text-small mb-12">Passing score: ${passingScore}% • ${questions.length} questions</div>
      ${questions.map((q, qi) => `
        <div class="question-block" data-q="${qi}">
          <div class="q-text">${qi + 1}. ${LD.esc(q.q)}</div>
          <div class="options">
            ${q.options.map((opt, oi) => `
              <label class="option" data-opt="${oi}">
                <input type="radio" name="q${qi}" value="${oi}">
                <span>${LD.esc(opt)}</span>
              </label>`).join('')}
          </div>
        </div>`).join('')}
      <button class="btn btn-primary btn-block" id="test-submit">Submit Test</button>`;

    modal.querySelector('.modal-body').innerHTML = body.innerHTML;
    const modalBody = modal.querySelector('.modal');
    window.__activeTestQuestions = questions;

    modalBody.addEventListener('click', (e) => {
      const label = e.target.closest('label.option');
      if (label) {
        const block = label.closest('.question-block');
        const qi = parseInt(block.dataset.q);
        const oi = parseInt(label.dataset.opt);
        block.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        label.classList.add('selected');
        const radio = block.querySelector(`input[name="q${qi}"]`);
        if (radio) radio.checked = true;
        questions[qi].selected = oi;
      }
      if (e.target.closest('#test-submit')) {
        e.preventDefault();
        // validate
        const answered = questions.filter(q => q.selected != null).length;
        if (answered < questions.length) {
          showToast(`Answer all questions before submitting (${answered}/${questions.length} answered).`, 'error');
          return;
        }
        // grade
        let score = 0;
        const results = questions.map(q => {
          const correct = q.selected === q.answer;
          if (correct) score++;
          return { q, selected: q.selected, correct,
            userAnswer: q.options[q.selected], correctAnswer: q.options[q.answer] };
        });
        closeModal(modal);
        onComplete(results, score, questions.length);
      }
    });
  }

  /* ---------- Show topic test result ---------- */
  function showTopicResult(testResult, tp) {
    const passed = testResult.passed;
    const cls = passed ? 'green' : 'red';
    const modal = openModal(`${testResult.topicTitle} — Test Result`, '');
    modal.querySelector('.modal-body').innerHTML = buildResultHTML(testResult, cls, passed);
    modal.querySelector('.modal-body').addEventListener('click', (e) => {
      if (e.target.closest('[data-retake-now]')) {
        closeModal(modal);
        startTopicTest(testResult.programId, testResult.topicId);
      }
    });
  }

  function viewTestResult(id) {
    const r = LD.state.testHistory.find(h => h.id === id);
    if (!r) return;
    const modal = openModal(`${r.topicTitle} — Result`);
    modal.querySelector('.modal-body').innerHTML = buildResultHTML(r, r.passed ? 'green' : 'red', r.passed);
  }

  function viewWeeklyResult(id, openedResult) {
    const r = LD.state.weeklyTests.find(w => w.id === id);
    if (!r) return;
    const modal = openModal(`Weekly Test — ${r.weekLabel}`);
    modal.querySelector('.modal-body').innerHTML = buildResultHTML(r, r.passed ? 'green' : 'red', r.passed);
  }

  function buildResultHTML(r, cls, passed) {
    const wrong = r.results.filter(x => !x.correct);
    const right = r.results.filter(x => x.correct);
    return `
      <div class="result-score ${cls}">
        <div class="big">${r.score} / ${r.total}</div>
        <div class="percent">${r.percentage}%</div>
        <div class="mt-8">${passed ? '<span class="badge badge-green" style="font-size:14px">✅ Passed</span>' : '<span class="badge badge-red" style="font-size:14px">🔁 Needs Revision</span>'}</div>
      </div>
      <div class="grid grid-2 text-small mb-12 text-muted">
        <div>✅ Correct: <b style="color:var(--green)">${right.length}</b></div>
        <div>❌ Incorrect: <b style="color:var(--red)">${wrong.length}</b></div>
      </div>
      ${wrong.length ? `<h3 class="mb-8" style="font-size:15px">📖 Areas to Revise</h3>` : ''}
      ${wrong.map(x => `
        <div class="result-row">
          <div class="mark">❌</div>
          <div class="info">
            <div class="rq">${LD.esc(x.q.q)}</div>
            <div class="ra">Your answer: <b>${LD.esc(x.userAnswer)}</b></div>
            <div class="ra">Correct answer: <b style="color:var(--green)">${LD.esc(x.correctAnswer)}</b></div>
            ${x.q.explanation ? `<div class="ex">💡 ${LD.esc(x.q.explanation)}</div>` : ''}
          </div>
        </div>`).join('')}
      ${!wrong.length ? `<div class="text-muted text-small">Perfect! No revision needed.</div>` : ''}
      ${(!passed && r.programId) ? `<div class="mt-12"><button class="btn btn-primary btn-block" data-retake-now>↻ Revision → Retest</button></div>` : ''}`;
  }

  /* ---------- Export / Import / Reset ---------- */
  function exportData() {
    const data = JSON.stringify(LD.state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'learning-dashboard-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Data exported.', 'success');
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data.programs) throw new Error('bad format');
          LD.state = Object.assign({
            programs: [], testHistory: [], weeklyTests: [],
            settings: { weeklyPassingScore:70, defaultPassingScore:70, questionsPerTest:5, weeklyQuestions:10, currentFocus:null, dailyGoalTopics:3 }
          }, data);
          LD.saveState();
          showToast('Data imported.', 'success');
          render();
        } catch (e) {
          showToast('Invalid backup file.', 'error');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function resetData() {
    const modal = openModal('Reset All Data', `
      <p class="mb-8">This will erase all programs, progress and test history, and restore the sample data.</p>
      <p class="text-muted text-small">Export a backup first if you want to keep your data.</p>`,
      `<button class="btn" data-cancel>Cancel</button>
       <button class="btn btn-red" id="reset-yes">Reset Everything</button>`);
    modal.querySelector('#reset-yes').addEventListener('click', () => {
      LD.resetToSeed();
      closeModal(modal);
      currentProgId = null;
      showToast('All data reset to sample.', 'info');
      navigate('dashboard', null);
    });
    modal.querySelector('[data-cancel]').addEventListener('click', () => closeModal(modal));
  }

  /* ---------- Settings actions ---------- */
  function bindSettings() {
    const content = document.getElementById('content');
    // use change events on inputs within settings page - handled via delegation differently
    // skip; rely on a save button
  }

  /* ============================================================
     FORMAT
     ============================================================ */
  function formatDate(isoStr) {
    if (!isoStr) return '';
    const d = parseISO(isoStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function parseISO(v) {
    const d = new Date((v || new Date().toISOString().slice(0,10)) + 'T00:00:00');
    return d;
  }

  /* ============================================================
     SHELL TO RUN SETTINGS INPUT HANDLERS
     ============================================================ */
  function bindDynamic(page) {
    const content = document.getElementById('content');
    // Generic save for settings handled through change listeners in renderSettings flow
    if (page === 'settings') {
      content.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', (e) => {
          const id = e.target.id;
          const s = LD.state.settings;
          if (id === 'set-pass') s.defaultPassingScore = parseInt(e.target.value) || 70;
          if (id === 'set-q') s.questionsPerTest = Math.min(20, Math.max(1, parseInt(e.target.value) || 5));
          if (id === 'set-wpass') s.weeklyPassingScore = parseInt(e.target.value) || 70;
          if (id === 'set-wq') s.weeklyQuestions = Math.min(30, Math.max(1, parseInt(e.target.value) || 10));
          if (id === 'set-focus') s.currentFocus = e.target.value || null;
          if (id === 'set-goal') s.dailyGoalTopics = Math.min(20, Math.max(1, parseInt(e.target.value) || 3));
          LD.saveState();
        });
      });
    }
    if (page === 'search') {
      content.querySelectorAll('#sf-query, #sf-program, #sf-status, #sf-importance, #sf-type, #sf-weak, #sf-rev, #sf-done, #sf-remain').forEach(el => {
        el.addEventListener('input', applySearch);
        el.addEventListener('change', applySearch);
      });
      applySearch();
    }
  }

  /* ---------- Main render pipeline with action binding ---------- */
  let render = function () {
    const content = document.getElementById('content');
    let html = '';
    switch (currentPage) {
      case 'dashboard': html = renderDashboard(); break;
      case 'programs': html = renderPrograms(); break;
      case 'roadmap': html = renderRoadmap(); break;
      case 'tests': html = renderTests(); break;
      case 'weak': html = renderWeak(); break;
      case 'summaries': html = renderSummaries(); break;
      case 'search': html = renderSearch(); break;
      case 'analytics': html = renderAnalytics(); break;
      case 'settings': html = renderSettings(); break;
      default: html = renderDashboard();
    }
    content.innerHTML = html;

    // bind delegated global actions (once)
    bindEvents();
    bindDynamic(currentPage);

    // analytics charts
    if (currentPage === 'analytics') {
      drawAnalyticsCharts();
    }
  };

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    LD.loadState();
    setupSidebar();
    setupTheme();
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam) {
      currentPage = pageParam;
      currentProgId = params.get('prog') || null;
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  // debug hook used by automated testing
  window.__testNav = function (page, progId) { navigate(page, progId || null); };

  /* Auto-drive a real topic test through the UI for testing.
     progId: program id, topicIndex: index into topics. optScore: 1=showPass 0=showFail */
  window.__autoTest = function (progId, topicIndex, optScore = 1) {
    const p = LD.state.programs.find(x => x.id === progId);
    if (!p || !p.topics[topicIndex]) return { ok: false, msg: 'not found' };
    const tp = p.topics[topicIndex];
    navigate('programs', progId);
    startTopicTest(progId, tp.id);
    const modal = document.querySelector('.modal-overlay .modal');
    if (!modal) return { ok: false, msg: 'no modal' };
    const blocks = [...modal.querySelectorAll('.question-block')];
    const qs = window.__activeTestQuestions || [];
    blocks.forEach((b, bi) => {
      const opts = b.querySelectorAll('label.option');
      const correct = qs[bi] ? qs[bi].answer : 0;
      const desired = optScore === 1 ? correct : (correct + 1) % opts.length;
      opts[desired].click();
    });
    modal.querySelector('#test-submit').click();
    // after grading, result modal opens
    const resModal = document.querySelector('.modal-overlay .modal');
    const html = resModal ? resModal.innerHTML : '';
    return { ok: true, hasResult: html.includes('result-score'), passedBadge: html.includes('Passed'), reviseBadge: html.includes('Needs Revision') };
  };
})();
