'use strict';
/**
 * Summaries & chapter content endpoint (port of exam/api/summaries.php).
 */
const express = require('express');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { jsonDecode } = require('../util');
const { createJob } = require('../jobs');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET — chapter meta + content row (and backing documents)
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const chapterId = parseInt(req.query.chapter_id || '0', 10);
  if (chapterId <= 0) return fail(res, 400, 'chapter_id is required.');

  const rows = await db.query(`
    SELECT c.id, c.title, c.subject_id, c.status, c.summary_viewed,
           c.org_label, c.unit_type, c.unit_no, c.content_level, c.topics_json,
           cc.easy_explanation, cc.definitions_json, cc.important_points_json,
           cc.key_terms_json, cc.exam_important_json, cc.examples_json, cc.theory_json, cc.revision_notes,
           cc.simple_explanation, cc.memory_tricks_json, cc.exam_answers_json, cc.differences_json,
           cc.content_ready, cc.summary_ready, cc.last_generated_at,
           (SELECT COUNT(*)::int FROM questions q WHERE q.chapter_id = c.id) AS questions_count,
           (SELECT COUNT(*)::int FROM study_topics st WHERE st.chapter_id = c.id) AS study_topics_count,
           s.name AS subject_name
    FROM chapters c
    LEFT JOIN chapter_content cc ON cc.chapter_id = c.id
    JOIN subjects s ON s.id = c.subject_id
    WHERE c.id = $1`, [chapterId]);

  const row = rows[0];
  if (!row) return fail(res, 404, 'Chapter not found.');

  row.topics = jsonDecode(row.topics_json || '[]', []) || [];

  const documents = await db.query(`
    SELECT id, doc_type, original_name, page_count, status FROM subject_documents
    WHERE subject_id = $1 AND status = 'ready' ORDER BY id ASC`, [row.subject_id]);

  ok(res, {
    chapter: row,
    documents,
    has_summary: !!(row.easy_explanation && row.easy_explanation !== ''),
    has_content: !!(row.definitions_json && row.definitions_json !== '[]') || !!(row.important_points_json && row.important_points_json !== '[]'),
    summary_ready: !!row.summary_ready,
    content_ready: !!row.content_ready,
    syllabus_only: row.content_level === 'syllabus',
  });
}));

// ---------------------------------------------------------------------------
// POST — generate chapter content (long-running AI flow)
// ---------------------------------------------------------------------------
router.post('/', wrap(async (req, res) => {
  verifyCsrf(req);
  const body = req.body || {};
  const chapterId = parseInt(body.chapter_id || '0', 10);
  const force = !!body.force;

  if (chapterId <= 0) return fail(res, 400, 'chapter_id is required.');

  const chRows = await db.query('SELECT id FROM chapters WHERE id = $1', [chapterId]);
  if (!chRows[0]) return fail(res, 404, 'Chapter not found.');

  // Long-running AI work runs as an async job (Netlify background function or
  // local in-process worker) so the request returns before Netlify's 26s limit.
  const job = await createJob('chapter_content', chapterId, {
    chapter_id: chapterId,
    force: !!force,
    scope: String(body.scope || 'all'),
  });

  return ok(res, {
    job_id: Number(job.id),
    job_type: job.job_type,
    status: job.status,
  });
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;