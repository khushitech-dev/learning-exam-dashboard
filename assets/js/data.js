/* ============================================================
   PERSONAL LEARNING DASHBOARD - DATA LAYER
   State management, persistence, calculations, seed data
   ============================================================ */

const STORE_KEY = 'learningDashboard_v1';
const THEME_KEY = 'learningDashboard_theme';
const FOCUS_KEY = 'learningDashboard_focus';
const SETTINGS_KEY = 'learningDashboard_settings';

/* ---------- Importance ---------- */
const IMPORTANCE = {
  MUST: 'must',       // ⭐ Must Learn
  IMPORTANT: 'important', // 🔹 Important
  ADVANCED: 'advanced'    // ⚪ Advanced / Optional
};

const IMPORTANCE_META = {
  [IMPORTANCE.MUST]:      { label: 'Must Learn',   icon: '⭐', order: 0 },
  [IMPORTANCE.IMPORTANT]: { label: 'Important',    icon: '🔹', order: 1 },
  [IMPORTANCE.ADVANCED]:  { label: 'Advanced/Opt', icon: '⚪', order: 2 }
};

/* ---------- Topic Mastery Status ---------- */
const STATUS = {
  NOT_STARTED: 'not_started', // 🔴
  LEARNING:    'learning',    // 🟡
  PRACTICED:   'practiced',   // 🔵
  TESTED:      'tested',      // 🟢
  MASTERED:    'mastered'     // 🏆
};

const STATUS_META = {
  [STATUS.NOT_STARTED]: { label: 'Not Started', icon: '🔴', color: 'var(--red)',  order: 0 },
  [STATUS.LEARNING]:    { label: 'Learning',    icon: '🟡', color: 'var(--yellow)', order: 1 },
  [STATUS.PRACTICED]:   { label: 'Practiced',   icon: '🔵', color: 'var(--blue)',  order: 2 },
  [STATUS.TESTED]:      { label: 'Tested',      icon: '🟢', color: 'var(--green)', order: 3 },
  [STATUS.MASTERED]:    { label: 'Mastered',    icon: '🏆', color: 'var(--purple)', order: 4 }
};

/* ---------- Difficulty ---------- */
const DIFFICULTY = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
};

/* ---------- Program Status ---------- */
const PROG_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue'
};

/* ---------- Topic shape ----------
   {
     id,
     title,
     importance,
     status,          // STATUS.x
     testScore,       // null | number
     testTaken,       // bool
     passed,          // bool
     revisionRequired,// bool
     revisions,       // count
     completions,     // count how many times marked practiced
     programId,
     order
   }
*/

/* ---------- Test result shape ----------
   {
     id, programId, programName, topicId, topicTitle,
     timestamp, score, total, percentage, passed, passingScore,
     results: [ { q, selected, correct, userAnswer, correctAnswer, explanation } ]
   }
*/

/* ---------- Weekly test result shape ----------
   {
     id, weekStart, weekLabel, timestamp, score, total, percentage,
     passed, passingScore, topics: [topicId], results: [...]
   }
*/

/* ---------- App state ---------- */
let state = {
  programs: [],
  testHistory: [],
  weeklyTests: [],
  settings: {
    weeklyPassingScore: 70,
    defaultPassingScore: 70,
    questionsPerTest: 5,
    weeklyQuestions: 10,
    currentFocus: null, // programId
    dailyGoalTopics: 3
  }
};

/* ============================================================
   SEED DATA
   ============================================================ */

function seedPrograms() {
  const t = (p, title, importance) => ({
    id: p + '_' + title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
    programId: p,
    title,
    importance,
    status: STATUS.NOT_STARTED,
    testScore: null,
    testTaken: false,
    passed: false,
    revisionRequired: false,
    revisions: 0,
    completions: 0,
    order: 0
  });

  const mkTopics = (p, arr) => arr.map((x, i) => Object.assign(t(p, x[0], x[1]), { order: i }));

  const jsTopics = mkTopics('js', [
    ['Variables', IMPORTANCE.MUST],
    ['Data Types', IMPORTANCE.MUST],
    ['Operators', IMPORTANCE.MUST],
    ['Conditions', IMPORTANCE.MUST],
    ['Loops', IMPORTANCE.MUST],
    ['Functions', IMPORTANCE.MUST],
    ['Arrow Functions', IMPORTANCE.IMPORTANT],
    ['Arrays', IMPORTANCE.MUST],
    ['Objects', IMPORTANCE.MUST],
    ['Array Methods', IMPORTANCE.MUST],
    ['String Methods', IMPORTANCE.IMPORTANT],
    ['Scope', IMPORTANCE.IMPORTANT],
    ['Hoisting', IMPORTANCE.IMPORTANT],
    ['DOM', IMPORTANCE.MUST],
    ['Events', IMPORTANCE.MUST],
    ['ES6+', IMPORTANCE.IMPORTANT],
    ['Destructuring', IMPORTANCE.IMPORTANT],
    ['Spread / Rest', IMPORTANCE.IMPORTANT],
    ['Promises', IMPORTANCE.MUST],
    ['Async / Await', IMPORTANCE.MUST],
    ['Fetch API', IMPORTANCE.MUST],
    ['Error Handling', IMPORTANCE.IMPORTANT],
    ['Modules', IMPORTANCE.IMPORTANT],
    ['Local Storage', IMPORTANCE.IMPORTANT],
    ['JSON', IMPORTANCE.IMPORTANT]
  ]);

  const htmlTopics = mkTopics('html', [
    ['Structure & Tags', IMPORTANCE.MUST],
    ['Headings & Paragraphs', IMPORTANCE.MUST],
    ['Links & Images', IMPORTANCE.MUST],
    ['Lists', IMPORTANCE.IMPORTANT],
    ['Tables', IMPORTANCE.IMPORTANT],
    ['Forms', IMPORTANCE.MUST],
    ['Input Types', IMPORTANCE.MUST],
    ['Semantic HTML', IMPORTANCE.MUST],
    ['Media (Audio/Video)', IMPORTANCE.ADVANCED],
    ['Meta & SEO', IMPORTANCE.IMPORTANT],
    ['Accessibility', IMPORTANCE.IMPORTANT]
  ]);

  const cssTopics = mkTopics('css', [
    ['Selectors', IMPORTANCE.MUST],
    ['Colors & Backgrounds', IMPORTANCE.IMPORTANT],
    ['Typography', IMPORTANCE.IMPORTANT],
    ['Box Model', IMPORTANCE.MUST],
    ['Flexbox', IMPORTANCE.MUST],
    ['Grid', IMPORTANCE.MUST],
    ['Positioning', IMPORTANCE.MUST],
    ['Display & Visibility', IMPORTANCE.IMPORTANT],
    ['Responsive Design', IMPORTANCE.MUST],
    ['Media Queries', IMPORTANCE.MUST],
    ['Pseudo Classes', IMPORTANCE.IMPORTANT],
    ['Pseudo Elements', IMPORTANCE.IMPORTANT],
    ['Transitions', IMPORTANCE.IMPORTANT],
    ['Animations', IMPORTANCE.IMPORTANT],
    ['Variables (Custom Props)', IMPORTANCE.IMPORTANT],
    ['Units', IMPORTANCE.IMPORTANT],
    ['SASS/SCSS', IMPORTANCE.ADVANCED]
  ]);

  const reactTopics = mkTopics('react', [
    ['JSX', IMPORTANCE.MUST],
    ['Components', IMPORTANCE.MUST],
    ['Props', IMPORTANCE.MUST],
    ['State', IMPORTANCE.MUST],
    ['Events', IMPORTANCE.MUST],
    ['Conditional Rendering', IMPORTANCE.MUST],
    ['Lists & Keys', IMPORTANCE.MUST],
    ['Forms', IMPORTANCE.IMPORTANT],
    ['useState', IMPORTANCE.MUST],
    ['useEffect', IMPORTANCE.MUST],
    ['useRef', IMPORTANCE.IMPORTANT],
    ['useContext', IMPORTANCE.IMPORTANT],
    ['useReducer', IMPORTANCE.ADVANCED],
    ['Custom Hooks', IMPORTANCE.ADVANCED],
    ['Routing (React Router)', IMPORTANCE.IMPORTANT],
    ['Props Drilling', IMPORTANCE.IMPORTANT],
    ['Lifting State Up', IMPORTANCE.IMPORTANT],
    ['Lifecycle', IMPORTANCE.IMPORTANT]
  ]);

  const nodeTopics = mkTopics('node', [
    ['Install & Setup', IMPORTANCE.MUST],
    ['NPM', IMPORTANCE.MUST],
    ['Modules & Require', IMPORTANCE.MUST],
    ['Event Loop', IMPORTANCE.IMPORTANT],
    ['File System (fs)', IMPORTANCE.MUST],
    ['HTTP Module', IMPORTANCE.IMPORTANT],
    ['Express Basics', IMPORTANCE.MUST],
    ['Routing', IMPORTANCE.MUST],
    ['Middleware', IMPORTANCE.IMPORTANT],
    ['Environment Variables', IMPORTANCE.IMPORTANT],
    ['REST APIs', IMPORTANCE.MUST],
    ['JSON Handling', IMPORTANCE.IMPORTANT],
    ['Authentication', IMPORTANCE.IMPORTANT],
    ['Database (Mongo/MySQL)', IMPORTANCE.IMPORTANT],
    ['Error Handling', IMPORTANCE.IMPORTANT]
  ]);

  const gitTopics = mkTopics('git', [
    ['What is Git', IMPORTANCE.MUST],
    ['Setup & Config', IMPORTANCE.MUST],
    ['Git Init & Status', IMPORTANCE.MUST],
    ['Add & Commit', IMPORTANCE.MUST],
    ['Log & Checkout', IMPORTANCE.IMPORTANT],
    ['Branching', IMPORTANCE.MUST],
    ['Merging', IMPORTANCE.MUST],
    ['Conflicts', IMPORTANCE.IMPORTANT],
    ['Remote & Push/Pull', IMPORTANCE.MUST],
    ['Clone & Fork', IMPORTANCE.MUST],
    ['Pull Requests', IMPORTANCE.IMPORTANT],
    ['GitHub Issues', IMPORTANCE.IMPORTANT],
    ['Git Reset & Revert', IMPORTANCE.ADVANCED],
    ['Stashing', IMPORTANCE.ADVANCED],
    ['Rebase', IMPORTANCE.ADVANCED]
  ]);

  const dsaTopics = mkTopics('dsa', [
    ['Time Complexity', IMPORTANCE.MUST],
    ['Space Complexity', IMPORTANCE.MUST],
    ['Arrays', IMPORTANCE.MUST],
    ['Strings', IMPORTANCE.MUST],
    ['Linked Lists', IMPORTANCE.IMPORTANT],
    ['Stacks', IMPORTANCE.MUST],
    ['Queues', IMPORTANCE.MUST],
    ['Hash Tables', IMPORTANCE.MUST],
    ['Trees', IMPORTANCE.IMPORTANT],
    ['Binary Search Trees', IMPORTANCE.IMPORTANT],
    ['Heaps', IMPORTANCE.ADVANCED],
    ['Graphs', IMPORTANCE.ADVANCED],
    ['Sorting', IMPORTANCE.MUST],
    ['Searching', IMPORTANCE.MUST],
    ['Recursion', IMPORTANCE.MUST],
    ['Dynamic Programming', IMPORTANCE.ADVANCED],
    ['Greedy Algorithms', IMPORTANCE.ADVANCED],
    ['Two Pointers', IMPORTANCE.IMPORTANT],
    ['Sliding Window', IMPORTANCE.ADVANCED],
    ['Backtracking', IMPORTANCE.ADVANCED]
  ]);

  const sqlTopics = mkTopics('sql', [
    ['What is SQL', IMPORTANCE.MUST],
    ['Databases & Tables', IMPORTANCE.MUST],
    ['SELECT', IMPORTANCE.MUST],
    ['WHERE', IMPORTANCE.MUST],
    ['ORDER BY', IMPORTANCE.IMPORTANT],
    ['INSERT', IMPORTANCE.MUST],
    ['UPDATE', IMPORTANCE.MUST],
    ['DELETE', IMPORTANCE.MUST],
    ['JOINs', IMPORTANCE.MUST],
    ['Aggregate Functions', IMPORTANCE.MUST],
    ['GROUP BY / HAVING', IMPORTANCE.IMPORTANT],
    ['Subqueries', IMPORTANCE.IMPORTANT],
    ['Indexes', IMPORTANCE.IMPORTANT],
    ['Primary/Foreign Keys', IMPORTANCE.MUST],
    ['Normalization', IMPORTANCE.ADVANCED],
    ['Transactions', IMPORTANCE.IMPORTANT]
  ]);

  const nextTopics = mkTopics('next', [
    ['Install & Setup', IMPORTANCE.MUST],
    ['Pages & Routing', IMPORTANCE.MUST],
    ['File-Based Routing', IMPORTANCE.MUST],
    ['Components', IMPORTANCE.MUST],
    ['Styling (CSS Modules)', IMPORTANCE.IMPORTANT],
    ['Data Fetching (SSG/SSR)', IMPORTANCE.MUST],
    ['getStaticProps', IMPORTANCE.IMPORTANT],
    ['getServerSideProps', IMPORTANCE.IMPORTANT],
    ['API Routes', IMPORTANCE.IMPORTANT],
    ['Link & Navigation', IMPORTANCE.MUST],
    ['Images (next/image)', IMPORTANCE.IMPORTANT],
    ['Dynamic Routes', IMPORTANCE.IMPORTANT],
    ['Client/Server Components', IMPORTANCE.ADVANCED],
    ['App Router', IMPORTANCE.ADVANCED],
    ['Middleware', IMPORTANCE.ADVANCED],
    ['Deployment (Vercel)', IMPORTANCE.IMPORTANT]
  ]);

  const prog = (id, name, difficulty, startDate, targetDate, passingScore, topics) => {
    const start = new Date(startDate);
    const target = new Date(targetDate);
    const days = Math.max(1, Math.round((target - start) / (1000 * 60 * 60 * 24)) + 1);
    return {
      id, name, difficulty, startDate: iso(start), targetDate: iso(target),
      days, passingScore, topics,
      createdAt: Date.now()
    };
  };

  const iso = (d) => d.toISOString().slice(0, 10);

  return [
    prog('html', 'HTML', DIFFICULTY.BEGINNER, '2026-08-20', '2026-09-05', 70, htmlTopics),
    prog('css', 'CSS', DIFFICULTY.BEGINNER, '2026-08-22', '2026-09-10', 70, cssTopics),
    prog('js', 'JavaScript', DIFFICULTY.INTERMEDIATE, '2026-09-05', '2026-09-19', 70, jsTopics),
    prog('git', 'Git & GitHub', DIFFICULTY.BEGINNER, '2026-09-10', '2026-09-24', 70, gitTopics),
    prog('react', 'React', DIFFICULTY.INTERMEDIATE, '2026-09-20', '2026-10-10', 70, reactTopics),
    prog('node', 'Node.js', DIFFICULTY.INTERMEDIATE, '2026-10-01', '2026-10-25', 70, nodeTopics),
    prog('next', 'Next.js', DIFFICULTY.INTERMEDIATE, '2026-10-20', '2026-11-15', 70, nextTopics),
    prog('dsa', 'DSA', DIFFICULTY.ADVANCED, '2026-09-15', '2026-12-30', 70, dsaTopics),
    prog('sql', 'SQL', DIFFICULTY.INTERMEDIATE, '2026-10-15', '2026-11-05', 70, sqlTopics)
  ];
}

/* Seed some sample progress so dashboard isn't empty */
function seedProgress(programs) {
  const byId = {};
  programs.forEach(p => byId[p.id] = p);
  const prog = (id, n) => byId[id] && byId[id].topics.slice(0, n);

  const mark = (p, topics, doneList) => {
    if (!p) return;
    topics.forEach((tp, i) => {
      if (doneList.includes(tp.id)) {
        tp.status = STATUS.TESTED;
        tp.testTaken = true;
        tp.testScore = 70 + Math.floor(Math.random() * 25);
        tp.passed = true;
        tp.completions = 1;
      }
    });
  };

  mark(byId.html, byId.html && byId.html.topics, byId.html ? byId.html.topics.slice(0, 7).map(x => x.id) : []);
  mark(byId.css, byId.css && byId.css.topics, byId.css ? byId.css.topics.slice(0, 5).map(x => x.id) : []);
  mark(byId.js, byId.js && byId.js.topics, byId.js ? byId.js.topics.slice(0, 8).map(x => x.id) : []);
  mark(byId.react, byId.react && byId.react.topics, byId.react ? byId.react.topics.slice(0, 2).map(x => x.id) : []);
  mark(byId.dsa, byId.dsa && byId.dsa.topics, byId.dsa ? byId.dsa.topics.slice(0, 3).map(x => x.id) : []);
  mark(byId.git, byId.git && byId.git.topics, byId.git ? byId.git.topics.slice(0, 3).map(x => x.id) : []);

  // A few weekly tests for analytics
  return [
    { id: 'wk1', weekStart: '2026-08-24', weekLabel: 'Week of Aug 24', timestamp: '2026-08-30T10:00:00',
      score: 8, total: 10, percentage: 80, passed: true, passingScore: 70, topics: ['html_structure_&_tags','html_headings_&_paragraphs'], results: [] },
    { id: 'wk2', weekStart: '2026-08-31', weekLabel: 'Week of Aug 31', timestamp: '2026-09-06T10:00:00',
      score: 7, total: 10, percentage: 70, passed: true, passingScore: 70, topics: ['js_variables','js_data_types'], results: [] }
  ];
}

/* ============================================================
   PERSISTENCE
   ============================================================ */

/* Re-add any seed programs that are missing from saved state, so the
   dashboard never silently loses base programs. */
function restoreMissingSeedPrograms() {
  if (!Array.isArray(state.programs)) return;
  const haveIds = {};
  state.programs.forEach(p => haveIds[p.id] = true);
  seedPrograms().forEach(s => {
    if (!haveIds[s.id]) state.programs.push(s);
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      Object.assign(state, JSON.parse(raw));
      if (!state.settings) state.settings = {};
      restoreMissingSeedPrograms();
      saveState();
      return;
    }
  } catch (e) { /* fall through */ }
  const programs = seedPrograms();
  state.programs = programs;
  state.testHistory = [];
  state.weeklyTests = seedProgress(programs);
  state.settings = {
    weeklyPassingScore: 70,
    defaultPassingScore: 70,
    questionsPerTest: 5,
    weeklyQuestions: 10,
    currentFocus: 'js',
    dailyGoalTopics: 3
  };
  saveState();
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) { /* quota */ }
}

function resetToSeed() {
  localStorage.removeItem(STORE_KEY);
  loadState();
  saveState();
}

/* ============================================================
   HELPERS
   ============================================================ */

function uid() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(isoStr, n) {
  const d = new Date(isoStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return iso(d);
}

function iso(d) {
  return d.toISOString ? d.toISOString().slice(0, 10) : d;
}

function parseISO(v) {
  return new Date((v || todayISO()) + 'T00:00:00');
}

function daysBetween(aISO, bISO) {
  const a = parseISO(aISO), b = parseISO(bISO);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function diffDaysFromToday(isoStr) {
  return daysBetween(todayISO(), isoStr);
}

function daysFromStart(isoStr) {
  return Math.max(0, daysBetween(isoStr, todayISO()));
}

/* Current week (Mon-Sun) for weekly tests */
function currentWeekStartISO() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  return iso(monday);
}

function weekLabelFor(weekStartISO) {
  const d = parseISO(weekStartISO);
  const opts = { month: 'short', day: 'numeric' };
  return 'Week of ' + d.toLocaleDateString(undefined, opts);
}

function isTodaySunday() {
  return new Date().getDay() === 0;
}

/* ============================================================
   PROGRAM CALCULATIONS
   ============================================================ */

function completedTopics(p) {
  return p.topics.filter(tp => tp.status === STATUS.TESTED || tp.status === STATUS.MASTERED);
}

function isTopicDone(tp) {
  return tp.status === STATUS.TESTED || tp.status === STATUS.MASTERED;
}

function countTopics(p) { return p.topics.length; }
function countCompleted(p) { return completedTopics(p).length; }
function countRemaining(p) { return p.topics.length - countCompleted(p); }

function completionPercent(p) {
  return p.topics.length === 0 ? 0 : Math.round((countCompleted(p) / p.topics.length) * 100);
}

/* Average test percentage across passed tests for the program */
function programTestAverage(p) {
  const scores = p.topics.filter(tp => tp.testTaken && tp.testScore != null).map(tp => tp.testScore);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function remainingDays(p) {
  return diffDaysFromToday(p.targetDate);
}

function requiredTopicsPerDay(p) {
  const remain = countRemaining(p);
  const days = remainingDays(p);
  if (days <= 0) return remain > 0 ? remain : 0;
  return remain / days;
}

/* Deadline / schedule status */
function deadlineStatus(p) {
  const remain = countRemaining(p);
  const days = remainingDays(p);
  const done = countCompleted(p);

  const req = requiredTopicsPerDay(p);

  if (p.topics.length > 0 && done >= p.topics.length)
    return { key: 'done', label: 'Completed', icon: '✅', percent: 100, required: req, remaining: remain, days, done, expectedDone: done };
  if (days < 0 && remain > 0)
    return { key: 'overdue', label: 'Overdue', icon: '🔴', percent: 0, required: req, remaining: remain, days, done, expectedDone: done };

  // pace vs plan
  const totalDays = Math.max(1, daysBetween(p.startDate, p.targetDate));
  const elapsed = Math.min(totalDays, Math.max(0, daysFromStart(p.startDate)));
  const expectedRatio = totalDays === 0 ? 1 : elapsed / totalDays;
  const expectedDone = Math.round(p.topics.length * expectedRatio);
  const actualDone = done;

  let key, label, icon;
  if (days <= 0) {
    key = 'critical'; label = 'Last Day'; icon = '🔴';
  } else if (actualDone >= expectedDone) {
    key = 'ontrack', label = 'On Track', icon = '🟢';
  } else if (actualDone >= expectedDone - 2) {
    key = 'ahead_ish', label = 'Slightly Behind', icon = '🟠';
  } else {
    key = 'behind', label = 'Behind Schedule', icon = '🔴';
  }

  return { key, label, icon, required: req, remaining: remain, days, done, expectedDone };
}

function programStatus(p) {
  const done = countCompleted(p);
  const total = p.topics.length;
  if (total === 0) return PROG_STATUS.IN_PROGRESS;
  if (done >= total) return PROG_STATUS.COMPLETED;
  if (remainingDays(p) < 0) return PROG_STATUS.OVERDUE;
  if (done === 0 && daysFromStart(p.startDate) === 0) return PROG_STATUS.NOT_STARTED;
  return PROG_STATUS.IN_PROGRESS;
}

/* ============================================================
   WEAK TOPICS
   ============================================================ */

function weakTopics() {
  const list = [];
  state.programs.forEach(p => {
    p.topics.forEach(tp => {
      let weak = false;
      if (tp.testTaken && tp.testScore != null) {
        const pass = p.passingScore || 70;
        if (!tp.passed || tp.testScore < pass) weak = true;
      }
      if (tp.revisionRequired) weak = true;
      if (weak) {
        list.push({ topic: tp, program: p, score: tp.testScore });
      }
    });
  });
  list.sort((a, b) => (a.topic.testScore ?? 0) - (b.topic.testScore ?? 0));
  return list;
}

/* ============================================================
   STRONG TOPICS
   ============================================================ */

function strongTopics(limit = 3) {
  const list = [];
  state.programs.forEach(p => {
    p.topics.forEach(tp => {
      if (tp.testTaken && tp.testScore != null && tp.passed) {
        list.push({ topic: tp, program: p, score: tp.testScore });
      }
    });
  });
  list.sort((a, b) => (b.topic.testScore ?? 0) - (a.topic.testScore ?? 0));
  return list.slice(0, limit);
}

/* ============================================================
   FINAL SUMMARY
   Built on the fly from saved state so it is always available.
   ============================================================ */

function finalSummary(p) {
  const done = countCompleted(p);
  const total = p.topics.length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);
  const pass = p.passingScore || 70;

  const targetDays = p.days || Math.max(1, daysBetween(p.startDate, p.targetDate));
  const endISO = (p.completedOn && daysBetween(p.startDate, p.completedOn) >= 0) ? p.completedOn : todayISO();
  const actualDays = Math.max(1, daysBetween(p.startDate, endISO) + (p.completedOn ? 0 : 1));

  const tested = p.topics.filter(tp => tp.testTaken && tp.testScore != null);
  const avg = tested.length ? Math.round(tested.reduce((a, tp) => a + tp.testScore, 0) / tested.length) : null;

  const strong = tested
    .filter(tp => tp.passed)
    .sort((a, b) => b.testScore - a.testScore)
    .map(tp => ({ topic: tp, score: tp.testScore }));

  const needsRevision = p.topics.filter(tp => tp.revisionRequired || (tp.testTaken && !tp.passed));
  const weak = needsRevision
    .map(tp => ({ topic: tp, score: tp.testScore }))
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  const history = state.testHistory
    .filter(h => h.programId === p.id)
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  /* Concise revision chain: mastered/done topics in roadmap order */
  const chainTopics = p.topics
    .slice()
    .sort((a, b) => {
      const ia = IMPORTANCE_META[a.importance].order, ib = IMPORTANCE_META[b.importance].order;
      return ia - ib || a.order - b.order;
    })
    .filter(tp => isTopicDone(tp) || tp.importance === IMPORTANCE.MUST);

  const missingTests = p.topics.filter(tp => !(tp.passed === true && tp.testScore != null)).length;
  /* Unlock only when every required topic is completed AND every required test is passed */
  const isComplete = completion >= 100 && missingTests === 0;

  return {
    completion, done, total, targetDays, actualDays,
    avg, strong, weak, history, chainTopics,
    missingTests, remaining: countRemaining(p),
    isComplete
  };
}

/* ============================================================
   GLOBAL CALCULATIONS
   ============================================================ */

function overallStats() {
  let totalPrograms = state.programs.length;
  let completedPrograms = 0;
  let inProgress = 0;
  let upcomingDeadlines = 0;
  let totalTopics = 0, doneTopics = 0;
  let currentFocus = null;

  const now = new Date();
  const soon = new Date(); soon.setDate(soon.getDate() + 7);

  state.programs.forEach(p => {
    if (p.id === state.settings.currentFocus) currentFocus = p;
    totalTopics += p.topics.length;
    doneTopics += countCompleted(p);
    const st = programStatus(p);
    if (st === PROG_STATUS.COMPLETED) completedPrograms++;
    else if (st === PROG_STATUS.IN_PROGRESS || st === PROG_STATUS.NOT_STARTED) inProgress++;
    const rd = remainingDays(p);
    if (rd >= 0 && rd <= 7 && countRemaining(p) > 0) upcomingDeadlines++;
  });

  const overallPercent = totalTopics === 0 ? 0 : Math.round((doneTopics / totalTopics) * 100);

  // if no focus set, pick first in-progress program
  if (!currentFocus) {
    currentFocus = state.programs.find(p => programStatus(p) === PROG_STATUS.IN_PROGRESS && countRemaining(p) > 0)
      || state.programs[0] || null;
  }

  return {
    totalPrograms, completedPrograms, inProgress, upcomingDeadlines,
    totalTopics, doneTopics, remainingTopics: totalTopics - doneTopics,
    overallPercent, currentFocus
  };
}

/* Study streak: consecutive days with any activity (test history + weekly) */
function studyStreak() {
  const days = new Set();
  state.testHistory.forEach(r => days.add(r.timestamp.slice(0, 10)));
  state.weeklyTests.forEach(r => days.add(r.timestamp.slice(0, 10)));
  const dates = [...days].sort().reverse();
  if (!dates.length) return 0;
  let streak = 0;
  let cursor = new Date();
  // include today even if nothing yet? Standard streak counts consecutive days with activity
  while (true) {
    const key = iso(cursor);
    if (days.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // if today has no activity yet but yesterday did, still allow (today is in progress)
      if (streak === 0) { cursor.setDate(cursor.getDate() - 1); continue; }
      break;
    }
    if (streak > 1000) break;
  }
  return streak;
}

/* ============================================================
   MASTERY UPDATE LOGIC
   - Topic not fully complete until test satisfies requirement
   ============================================================ */

function updateTopicMastery(tp, passingScore) {
  const pass = passingScore || 70;
  if (!tp.testTaken || tp.testScore == null) {
    // only set based on practice/completions if no test
    tp.revisionRequired = false;
    return;
  }
  if (tp.testScore < pass) {
    tp.passed = false;
    tp.revisionRequired = true;
    if (tp.status !== STATUS.MASTERED && tp.status !== STATUS.TESTED) {
      // keep status reflecting progress
    }
  } else {
    tp.passed = true;
    tp.revisionRequired = false;
  }
}

/* ============================================================
   EXPORT
   ============================================================ */

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

window.LD = {
  state, saveState, resetToSeed,
  IMPORTANCE, IMPORTANCE_META, STATUS, STATUS_META, DIFFICULTY, PROG_STATUS,
  uid, todayISO, addDaysISO, daysBetween, diffDaysFromToday,
  currentWeekStartISO, weekLabelFor, isTodaySunday,
  completedTopics, isTopicDone, countTopics, countCompleted, countRemaining,
  completionPercent, programTestAverage, remainingDays, requiredTopicsPerDay,
  deadlineStatus, programStatus, weakTopics, strongTopics,
  overallStats, studyStreak, updateTopicMastery, finalSummary,
  esc,
  loadState
};
