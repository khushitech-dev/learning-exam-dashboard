'use strict';
/**
 * Questions endpoint (port of exam/api/questions.php).
 */
const express = require('express');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { jsonDecode } = require('../util');
const { createJob } = require('../jobs');

const router = express.Router();

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const chapterId = parseInt(req.query.chapter_id || '0', 10);
  if (chapterId <= 0) return fail(res, 400, 'chapter_id is required.');

  const mode = req.query.mode || 'study';

  if (mode === 'study') {
    const types = String(req.query.types || '');
    let sql = 'SELECT q.id, q.question_text, q.question_type, q.options_json, q.correct_answer, q.explanation, q.topic FROM questions q WHERE q.chapter_id = $1';
    const params = [chapterId];
    if (types !== '' && types !== 'all') {
      const typeArr = types.split(',').map((t) => String(t).trim()).filter((t) => t !== '');
      if (typeArr.length) {
        sql += ' AND q.question_type = ANY($' + (params.length + 1) + ')';
        params.push(typeArr);
      }
    }
    sql += ' ORDER BY q.id ASC';
    const rows = await db.query(sql, params);
    const questions = rows.map((q) => {
      const options = jsonDecode(q.options_json || '[]', []) || [];
      const c = { ...q, options };
      delete c.options_json;
      return c;
    });
    return ok(res, questions);
  }

  if (mode === 'test') {
    const type = String(req.query.type || 'mcq');
    const count = Math.min(50, Math.max(1, parseInt(req.query.count || '10', 10)));
    let sql = 'SELECT q.id, q.question_text, q.question_type, q.options_json, q.correct_answer, q.topic FROM questions q WHERE q.chapter_id = $1';
    const params = [chapterId];
    if (type !== 'all') {
      sql += ' AND q.question_type = $2';
      params.push(type);
    }
    sql += ' ORDER BY RANDOM() LIMIT ' + count;
    const rows = await db.query(sql, params);

    const clean = rows.map((q) => {
      let options = jsonDecode(q.options_json || '[]', []) || [];
      if (q.question_type === 'mcq' && options.length > 0) options = shuffle(options);
      return {
        id: Number(q.id),
        question_text: q.question_text,
        question_type: q.question_type,
        options,
        topic: q.topic,
        // correct_answer intentionally NOT included
      };
    });
    return ok(res, clean);
  }

  return fail(res, 400, 'Invalid mode.');
}));

// ---------------------------------------------------------------------------
// POST — generate questions via AI
// ---------------------------------------------------------------------------
router.post('/', wrap(async (req, res) => {
  verifyCsrf(req);
  const body = req.body || {};
  const chapterId = parseInt(body.chapter_id || '0', 10);
  const force = !!body.force;
  let types = Array.isArray(body.types) ? body.types : ['mcq'];
  let countPerType = parseInt(body.count_per_type || '5', 10);

  if (chapterId <= 0) return fail(res, 400, 'chapter_id is required.');
  if (!Array.isArray(types)) types = ['mcq'];
  countPerType = Math.min(15, Math.max(2, countPerType));

  if (!force) {
    const cnt = await db.query('SELECT COUNT(*)::int AS c FROM questions WHERE chapter_id = $1', [chapterId]);
    const existing = cnt[0].c;
    if (existing >= 10) {
      return ok(res, { generated: 0, existing, message: 'Questions already generated.' });
    }
  } else {
    await db.query('DELETE FROM questions WHERE chapter_id = $1', [chapterId]);
  }

  const chRows = await db.query('SELECT id FROM chapters WHERE id = $1', [chapterId]);
  if (!chRows[0]) return fail(res, 404, 'Chapter not found.');

  // Question generation runs as an async background job.
  const job = await createJob('questions', chapterId, {
    chapter_id: chapterId,
    types,
    count_per_type: countPerType,
  });

  ok(res, { job_id: Number(job.id), status: job.status, generated: 0 });
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;