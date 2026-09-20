'use strict';
/**
 * Results & weak topics endpoint (port of exam/api/results.php).
 */
const express = require('express');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { jsonDecode } = require('../util');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const chapterId = parseInt(req.query.chapter_id || '0', 10);
  const subjectId = parseInt(req.query.subject_id || '0', 10);
  const all = !!(req.query.all && req.query.all !== '0');

  if (all) {
    const rows = await db.query(`
      SELECT wt.id, wt.topic_name, wt.why_weak, wt.revision_notes, wt.retested, wt.retest_score, wt.status,
             ch.title AS chapter_title, s.name AS subject_name, ch.id AS chapter_id, s.id AS subject_id
      FROM weak_topics wt
      JOIN chapters ch ON ch.id = wt.chapter_id
      JOIN subjects s ON s.id = wt.subject_id
      WHERE wt.status = 'open' OR wt.status = 'revising'
      ORDER BY wt.updated_at DESC`);
    return ok(res, rows);
  }

  if (subjectId > 0 && chapterId <= 0) {
    const rows = await db.query(`
      SELECT wt.id, wt.topic_name, wt.why_weak, wt.revision_notes, wt.retested, wt.retest_score, wt.status,
             ch.title AS chapter_title, ch.id AS chapter_id
      FROM weak_topics wt JOIN chapters ch ON ch.id = wt.chapter_id
      WHERE wt.subject_id = $1 AND wt.status IN ('open','revising')
      ORDER BY wt.updated_at DESC`, [subjectId]);
    return ok(res, rows);
  }

  if (chapterId > 0) {
    let subject = 0;
    if (subjectId <= 0) {
      const sid = await db.query('SELECT subject_id FROM chapters WHERE id = $1', [chapterId]);
      subject = Number(sid[0] ? sid[0].subject_id : 0);
    } else {
      subject = subjectId;
    }

    const attemptRows = await db.query(`
      SELECT id, score, total_questions, percentage, passed, passing_score, test_type, timestamp
      FROM test_attempts WHERE chapter_id = $1 ORDER BY timestamp DESC`, [chapterId]);

    const weakRows = await db.query(`
      SELECT wt.id, wt.topic_name, wt.why_weak, wt.revision_notes, wt.retested, wt.retest_score, wt.status
      FROM weak_topics wt WHERE wt.chapter_id = $1 AND wt.status IN ('open','revising')
      ORDER BY wt.updated_at DESC`, [chapterId]);

    let reviewDetail = [];
    if (attemptRows.length > 0) {
      const det = await db.query('SELECT answers_json FROM test_attempts WHERE id = $1', [attemptRows[0].id]);
      reviewDetail = jsonDecode(det[0] ? det[0].answers_json : '[]', []) || [];
    }

    const detail = await db.query('SELECT answers_json FROM test_attempts WHERE chapter_id = $1 ORDER BY timestamp DESC', [chapterId]);
    const topicStats = {};
    for (const d of detail) {
      const items = jsonDecode(d.answers_json || '[]', []) || [];
      for (const item of items) {
        const t = item.topic || 'General';
        if (!topicStats[t]) topicStats[t] = { correct: 0, total: 0 };
        topicStats[t].total++;
        if (item.is_correct) topicStats[t].correct++;
      }
    }

    ok(res, {
      subject_id: subject,
      attempts: attemptRows,
      attempt_review: reviewDetail,
      chapter_id: chapterId,
      weak_topics: weakRows,
      topic_performance: topicStats,
    });
    return;
  }

  return fail(res, 400, 'Provide chapter_id or subject_id or all=1.');
}));

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
router.post('/', wrap(async (req, res) => {
  verifyCsrf(req);
  const body = req.body || {};
  const action = body.action || '';

  if (action === 'update_weak') {
    const id = parseInt(body.id || '0', 10);
    if (id <= 0) return fail(res, 400, 'Weak topic id required.');
    const sets = [];
    const params = [];
    if (body.revision_notes !== undefined) {
      sets.push('revision_notes = $' + (params.length + 1));
      params.push(String(body.revision_notes).trim());
    }
    if (body.status !== undefined) {
      const allowed = ['open', 'revising', 'retested_now', 'resolved'];
      if (allowed.includes(body.status)) {
        sets.push('status = $' + (params.length + 1));
        params.push(body.status);
      }
    }
    if (sets.length) {
      params.push(id);
      await db.query('UPDATE weak_topics SET ' + sets.join(', ') + ' WHERE id = $' + params.length, params);
    }
    return ok(res, { id });
  }

  if (action === 'resolve') {
    const id = parseInt(body.id || '0', 10);
    if (id <= 0) return fail(res, 400, 'Weak topic id required.');
    await db.query("UPDATE weak_topics SET status = 'resolved', retested = 1 WHERE id = $1", [id]);
    return ok(res, { id, status: 'resolved' });
  }

  if (action === 'status_all') {
    const status = String(body.status || 'resolved');
    const subjectId = parseInt(body.subject_id || '0', 10);
    const allowed = ['open', 'revising', 'retested_now', 'resolved'];
    if (!allowed.includes(status)) return fail(res, 400, 'Invalid status.');
    if (subjectId > 0) {
      await db.query(`UPDATE weak_topics SET status = $1 WHERE subject_id = $2 AND status IN ('open','revising')`, [status, subjectId]);
    }
    return ok(res, { subject_id: subjectId, status });
  }

  return fail(res, 400, 'Unknown action.');
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;