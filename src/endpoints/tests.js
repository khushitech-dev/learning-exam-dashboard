'use strict';
/**
 * Tests endpoint (port of exam/api/tests.php).
 * Pending attempts are stored in the `attempt_sessions` Supabase table
 * (replaces the PHP $_SESSION store, survives serverless cold starts).
 */
const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { jsonEncode, jsonDecode } = require('../util');
const { updateChapterStatus } = require('../progress');

const router = express.Router();

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function storeAttempt(token, payload) {
  await db.query(`
    INSERT INTO attempt_sessions (attempt_token, payload, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '24 hours')
    ON CONFLICT (attempt_token) DO UPDATE SET payload = $2, expires_at = NOW() + INTERVAL '24 hours'`,
    [token, JSON.stringify(payload)]
  );
}

async function loadAttempt(token) {
  const rows = await db.query('SELECT payload FROM attempt_sessions WHERE attempt_token = $1 AND expires_at > NOW()', [token]);
  if (!rows[0]) return null;
  return jsonDecode(rows[0].payload, null);
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const testType = req.query.test_type || 'full';
  const type = ['full', 'retest', 'subject'].includes(testType) ? testType : 'full';

  if (type === 'subject') {
    const subjectId = parseInt(req.query.subject_id || '0', 10);
    if (subjectId <= 0) return fail(res, 400, 'subject_id is required for a subject mock test.');

    const anchor = await db.query('SELECT id FROM chapters WHERE subject_id = $1 ORDER BY order_index ASC LIMIT 1', [subjectId]);
    if (!anchor[0]) return fail(res, 400, 'Subject has no chapters to test.');
    const anchorId = Number(anchor[0].id);

    const questionsPerTest = 0;
    const passingScore = 60.0;

    const questions = await buildSubjectTestSet(subjectId, { mcq: 7, definition: 3, concept: 2, short_answer: 2, long_answer: 1 }, 15);
    if (questions.length < 4) {
      return ok(res, {
        attempt_token: null, test_type: 'subject', questions: [],
        test_config: { passingScore, questionsPerTest },
        message: 'Not enough questions across the whole subject yet. Generate Questions for each unit first.',
      });
    }

    const safe = questions.map((q) => {
      const options = jsonDecode(q.options_json || '[]', []);
      if (q.question_type === 'mcq' && options.length === 4) shuffle(options);
      return { id: Number(q.id), question_text: q.question_text, question_type: q.question_type, options, topic: q.topic };
    });

    const payload = {
      subject_id: subjectId,
      chapter_id: anchorId,
      test_type: 'subject',
      questions: questions.map((q) => ({
        id: Number(q.id),
        question_text: q.question_text || '',
        correct_answer: q.correct_answer,
        question_type: q.question_type,
        topic: q.topic,
        chapter_id: Number(q.q_chapter),
      })),
    };

    const attemptToken = crypto.randomBytes(24).toString('hex');
    await storeAttempt(attemptToken, payload);

    return ok(res, {
      attempt_token: attemptToken,
      test_type: 'subject',
      test_config: { passingScore, questionsPerTest },
      questions: safe,
      total_questions: safe.length,
    });
  }

  const chapterId = parseInt(req.query.chapter_id || '0', 10);
  if (chapterId <= 0) return fail(res, 400, 'chapter_id is required.');

  const tc = await db.query('SELECT * FROM test_config WHERE chapter_id = $1', [chapterId]);
  const testConfig = tc[0];
  const passingScore = testConfig ? Number(testConfig.passing_score) : 60.0;
  let questionsPerTest = 0;
  let questions = [];

  if (type === 'full') {
    questionsPerTest = testConfig ? Number(testConfig.questions_per_test) : 10;
    const counts = {
      mcq: Math.max(2, Math.round(questionsPerTest * 0.5)),
      definition: 2, concept: 2, short_answer: 2, long_answer: 1,
    };
    let total = counts.mcq + counts.definition + counts.concept + counts.short_answer;
    if (total > questionsPerTest) counts.mcq -= (total - questionsPerTest);
    if (counts.mcq < 1) counts.mcq = 1;
    questions = await buildChapterTestSet(chapterId, counts, questionsPerTest);
    if (questions.length < 2) {
      return ok(res, {
        attempt_token: null, test_type: type, questions: [],
        test_config: { passingScore, questionsPerTest },
        message: 'Not enough questions generated yet. Generate Questions first.',
      });
    }
  } else {
    // retest
    const weakTopicIds = String(req.query.weak_topic_ids || '');
    const weakArr = weakTopicIds !== '' ? weakTopicIds.split(',').map((s) => parseInt(s, 10)).filter((n) => n > 0) : [];
    questionsPerTest = 0;
    if (weakArr.length) {
      const wt = await db.query(
        `SELECT topic_name FROM weak_topics WHERE id = ANY($1) AND chapter_id = $2`, [weakArr, chapterId]
      );
      const topics = wt.map((r) => r.topic_name).filter((t) => t !== null);
      if (topics.length) {
        questions = await db.query(
          `SELECT q.id, q.question_text, q.question_type, q.options_json, q.correct_answer, q.topic
           FROM questions q WHERE q.chapter_id = $1 AND q.topic = ANY($2)
           ORDER BY RANDOM() LIMIT 8`,
          [chapterId, topics]
        );
      }
    }
    const min = type === 'retest' ? 1 : 2;
    if (questions.length < min) {
      return ok(res, {
        attempt_token: null, test_type: type, questions: [],
        test_config: { passingScore, questionsPerTest },
        message: 'Not enough questions for these weak topics yet.',
      });
    }
  }

  const safe = questions.map((q) => {
    const options = jsonDecode(q.options_json || '[]', []);
    if (q.question_type === 'mcq' && options.length === 4) shuffle(options);
    return { id: Number(q.id), question_text: q.question_text, question_type: q.question_type, options, topic: q.topic };
  });

  const payload = {
    chapter_id: chapterId,
    test_type: type,
    weak_topic_ids: type === 'retest' ? weakArr || [] : [],
    questions: questions.map((q) => ({
      id: Number(q.id),
      question_text: q.question_text || '',
      correct_answer: q.correct_answer,
      question_type: q.question_type,
      topic: q.topic,
    })),
  };

  const attemptToken = crypto.randomBytes(24).toString('hex');
  await storeAttempt(attemptToken, payload);

  return ok(res, {
    attempt_token: attemptToken,
    test_type: type,
    test_config: { passingScore, questionsPerTest },
    questions: safe,
    total_questions: safe.length,
  });
}));

// ---------------------------------------------------------------------------
// POST (score)
// ---------------------------------------------------------------------------
router.post('/', wrap(async (req, res) => {
  verifyCsrf(req);
  const body = req.body || {};
  const attemptToken = String(body.attempt_token || '');
  const answers = Array.isArray(body.answers) ? body.answers : [];

  if (attemptToken === '') return fail(res, 400, 'Invalid or expired test session.');

  const pending = await loadAttempt(attemptToken);
  if (!pending) return fail(res, 400, 'Invalid or expired test session.');

  const chapterId = Number(pending.chapter_id);
  const testType = pending.test_type || 'full';
  const isSubject = testType === 'subject';

  let score = 0;
  const total = (pending.questions || []).length;
  const detail = [];
  const wrongTopics = new Map();

  for (const sq of pending.questions || []) {
    const qId = Number(sq.id);
    const correct = sq.correct_answer;
    let chosen = null;
    for (const a of answers) {
      if (a && Number(a.question_id) === qId) {
        chosen = a.chosen !== undefined && a.chosen !== null ? String(a.chosen).trim() : null;
        break;
      }
    }
    const isCorrect = chosen !== null && chosen === String(correct);
    if (isCorrect) score++;

    const qInfo = await db.query('SELECT explanation, topic FROM questions WHERE id = $1', [qId]);
    const qi = qInfo[0] || {};

    detail.push({
      question_id: qId,
      text: sq.question_text || '',
      type: sq.question_type || '',
      chosen,
      correct,
      is_correct: isCorrect,
      explanation: qi.explanation || '',
      topic: qi.topic || sq.topic || 'General',
    });

    if (!isCorrect) {
      const topic = qi.topic || sq.topic || 'General';
      const qChapter = Number(sq.chapter_id) > 0 ? Number(sq.chapter_id) : chapterId;
      const key = qChapter + '|' + topic;
      if (!wrongTopics.has(key)) wrongTopics.set(key, { topic, chapter_id: qChapter, count: 0 });
      wrongTopics.get(key).count++;
    }
  }

  const percentage = total > 0 ? Math.round((score / total) * 10000) / 100 : 0;

  const tc = await db.query('SELECT * FROM test_config WHERE chapter_id = $1', [chapterId]);
  const testConfig = tc[0];
  const passingScore = testConfig ? Number(testConfig.passing_score) : 60.0;
  const passed = percentage >= passingScore;

  let subjectId = Number(pending.subject_id || 0);
  if (subjectId <= 0) {
    const sid = await db.query('SELECT subject_id FROM chapters WHERE id = $1', [chapterId]);
    subjectId = Number(sid[0] ? sid[0].subject_id : 0);
  }

  const weakJson = jsonEncode([...wrongTopics.values()].map((w) => ({ topic: w.topic, wrong_count: w.count })));

  const attempt = await db.query(`
    INSERT INTO test_attempts (chapter_id, subject_id, score, total_questions, percentage, passed, passing_score, answers_json, weak_topics_json, test_type)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id`,
    [chapterId, subjectId, score, total, percentage, passed ? 1 : 0, passingScore, jsonEncode(detail), weakJson, testType]
  );
  const attemptId = Number(attempt[0].id);

  const upserted = [];
  for (const w of wrongTopics.values()) {
    const { topic, chapter_id: qChapter, count } = w;
    const existing = await db.query('SELECT id, why_weak FROM weak_topics WHERE subject_id = $1 AND chapter_id = $2 AND topic_name = $3',
      [subjectId, qChapter, topic]);
    if (existing[0]) {
      upserted.push({ id: Number(existing[0].id), topic_name: topic, why_weak: existing[0].why_weak, status: 'open', retested: 0 });
      await db.query('UPDATE weak_topics SET status = $1, retested = 0 WHERE id = $2', ['open', existing[0].id]);
    } else {
      const created = await db.query(`
        INSERT INTO weak_topics (subject_id, chapter_id, topic_name, why_weak, status)
        VALUES ($1,$2,$3,$4,'open') RETURNING id`,
        [subjectId, qChapter, topic, 'Answers on "' + topic + '" were incorrect in ' + count + ' tested attempt(s). Revise this topic.']
      );
      upserted.push({ id: Number(created[0].id), topic_name: topic, why_weak: null, status: 'open', retested: 0 });
    }
  }

  if (testType === 'retest' && Array.isArray(pending.weak_topic_ids) && pending.weak_topic_ids.length) {
    for (const wtId of pending.weak_topic_ids) {
      await db.query(`UPDATE weak_topics SET retested = 1, retest_score = $1,
                      status = CASE WHEN $2 = 1 THEN 'resolved' ELSE 'retested_now' END WHERE id = $3`,
        [percentage, passed ? 1 : 0, wtId]);
    }
  }

  if (!isSubject) {
    await updateChapterStatus(db, chapterId, subjectId, passed, percentage);
  }

  await db.query('DELETE FROM attempt_sessions WHERE attempt_token = $1', [attemptToken]);

  return ok(res, {
    attempt_id: attemptId,
    chapter_id: chapterId,
    subject_id: subjectId,
    score,
    total_questions: total,
    percentage,
    passed,
    passing_score: passingScore,
    test_type: testType,
    review: detail,
    weak_topics: upserted,
  });
}));

// ---------------------------------------------------------------------------
// Pool builders (port of exam_build_*_test_set)
// ---------------------------------------------------------------------------
async function buildChapterTestSet(chapterId, counts, maxTotal) {
  const pool = await db.query(
    'SELECT id, question_text, question_type, options_json, correct_answer, topic FROM questions WHERE chapter_id = $1',
    [chapterId]
  );
  return buildTestSetFromPool(pool, counts, maxTotal);
}

async function buildSubjectTestSet(subjectId, counts, maxTotal) {
  const pool = await db.query(
    `SELECT q.id, q.question_text, q.question_type, q.options_json, q.correct_answer, q.topic,
            c.id AS q_chapter
     FROM questions q JOIN chapters c ON c.id = q.chapter_id
     WHERE c.subject_id = $1`, [subjectId]
  );
  return buildTestSetFromPool(pool, counts, maxTotal);
}

function buildTestSetFromPool(pool, counts, maxTotal) {
  const byType = {};
  for (const q of pool) {
    if (!byType[q.question_type]) byType[q.question_type] = [];
    byType[q.question_type].push(q);
  }

  const order = ['mcq', 'definition', 'concept', 'long_answer', 'short_answer', 'true_false'];
  const selected = [];
  const seen = new Set();

  for (const type of order) {
    const n = counts[type] || 0;
    const bucket = shuffle(byType[type] || []);
    const take = bucket.slice(0, n);
    for (const q of take) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      selected.push(q);
    }
  }

  const remaining = shuffle(pool.filter((q) => !seen.has(q.id)));
  for (const q of remaining) {
    if (selected.length >= maxTotal) break;
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    selected.push(q);
  }

  return selected.slice(0, maxTotal);
}

module.exports = router;