'use strict';
/**
 * Chapters endpoint (port of exam/api/chapters.php).
 */
const express = require('express');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { recomputeProgress } = require('../progress');
const { createJob } = require('../jobs');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const singleId = parseInt(req.query.id || '0', 10);
  if (singleId > 0) {
    const rows = await db.query(`
      SELECT c.id, c.title, c.subject_id, c.order_index, c.status, c.summary_viewed, s.name AS subject_name
      FROM chapters c JOIN subjects s ON s.id = c.subject_id WHERE c.id = $1`, [singleId]);
    if (!rows[0]) return fail(res, 404, 'Chapter not found.');
    return ok(res, rows[0]);
  }

  const subjectId = parseInt(req.query.subject_id || '0', 10);
  if (subjectId <= 0) return fail(res, 400, 'subject_id is required.');

  const subjRows = await db.query(`
    SELECT s.id, s.name, s.pdf_original_name, s.pdf_path, s.status, s.total_chapters, s.page_count, s.created_at,
           (SELECT COUNT(*)::int FROM subject_documents sd WHERE sd.subject_id = s.id) AS doc_count,
           COALESCE(sp.completed_chapters, 0) AS completed_chapters,
           COALESCE(sp.overall_progress, 0) AS overall_progress,
           COALESCE(sp.avg_score, 0) AS avg_score,
           (SELECT COALESCE(SUM(CASE WHEN left(COALESCE(c.topics_json,''),1) = '[' THEN json_array_length(c.topics_json::json) ELSE 0 END),0)::int FROM chapters c WHERE c.subject_id = s.id) AS total_topics,
           (SELECT COUNT(*)::int FROM weak_topics w WHERE w.subject_id = s.id AND w.status IN ('open','revising')) AS open_weak_topics,
           (SELECT COUNT(*)::int FROM test_attempts t WHERE t.subject_id = s.id AND t.test_type = 'subject') AS mock_attempts,
           (SELECT COUNT(*)::int FROM chapters c WHERE c.subject_id = s.id AND c.status = 'needs_revision') AS revision_required_units,
           (SELECT COUNT(DISTINCT c.id)::int FROM chapters c JOIN chapter_content cc ON cc.chapter_id = c.id
              WHERE c.subject_id = s.id AND cc.exam_important_json IS NOT NULL AND cc.exam_important_json NOT IN ('', '[]')) AS exam_important_units,
           (SELECT COUNT(*)::int FROM questions q JOIN chapters c ON c.id = q.chapter_id WHERE c.subject_id = s.id) AS total_questions
    FROM subjects s
    LEFT JOIN subject_progress sp ON sp.subject_id = s.id
    WHERE s.id = $1`, [subjectId]);

  const subject = subjRows[0];
  if (!subject) return fail(res, 404, 'Subject not found.');

  const chapters = await db.query(`
    SELECT c.id, c.title, c.order_index, c.start_page, c.end_page, c.status, c.summary_viewed, c.progress,
           c.org_label, c.unit_type, c.unit_no, c.content_level, c.topics_json,
           cc.content_ready, cc.summary_ready,
           (SELECT COUNT(*)::int FROM questions q WHERE q.chapter_id = c.id) AS questions_count,
           (SELECT COALESCE(ROUND(MAX(percentage),2),0)::float FROM test_attempts t WHERE t.chapter_id = c.id) AS best_score,
           (SELECT COUNT(*)::int FROM test_attempts t WHERE t.chapter_id = c.id) AS attempts
    FROM chapters c
    LEFT JOIN chapter_content cc ON cc.chapter_id = c.id
    WHERE c.subject_id = $1
    ORDER BY c.order_index ASC`, [subjectId]);

  const wt = await db.query(`
    SELECT chapter_id, COUNT(*)::int AS n FROM weak_topics
    WHERE subject_id = $1 AND status IN ('open','revising')
    GROUP BY chapter_id`, [subjectId]);
  const weakMap = {};
  for (const row of wt) weakMap[row.chapter_id] = row.n;

  for (const ch of chapters) ch.open_weak_topics = weakMap[ch.id] || 0;

  ok(res, { subject, chapters: chapters.map((c) => {
    c.questions_count = Number(c.questions_count || 0);
    c.attempts = Number(c.attempts || 0);
    c.best_score = Number(c.best_score || 0);
    return c;
  }) });
}));

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
router.post('/', wrap(async (req, res) => {
  verifyCsrf(req);
  const body = req.body || {};
  const action = body.action || '';

  if (action === 'set_status') {
    const id = parseInt(body.id || '0', 10);
    const status = String(body.status || '');
    const allowed = ['not_started', 'studying', 'test_pending', 'needs_revision', 'completed'];
    if (id <= 0 || !allowed.includes(status)) return fail(res, 400, 'Invalid status update.');
    await db.query('UPDATE chapters SET status = $1 WHERE id = $2', [status, id]);
    const row = await db.query('SELECT subject_id FROM chapters WHERE id = $1', [id]);
    const subjectId = Number(row[0] ? row[0].subject_id : 0);
    if (subjectId > 0) await recomputeProgress(db, subjectId);
    return ok(res, { id, status });
  }

  if (action === 'mark_viewed') {
    const id = parseInt(body.id || '0', 10);
    if (id <= 0) return fail(res, 400, 'Chapter id required.');
    const viewed = body.viewed ? 1 : 0;
    await db.query('UPDATE chapters SET summary_viewed = $1 WHERE id = $2', [viewed, id]);
    const row = await db.query('SELECT status FROM chapters WHERE id = $1', [id]);
    const current = row[0] ? row[0].status : '';
    if (viewed && current === 'not_started') {
      await db.query("UPDATE chapters SET status = 'studying' WHERE id = $1", [id]);
    }
    return ok(res, { id, summary_viewed: !!viewed });
  }

  if (action === 'regenerate') {
    const id = parseInt(body.id || '0', 10);
    if (id <= 0) return fail(res, 400, 'Chapter id required.');

    const chRows = await db.query('SELECT id FROM chapters WHERE id = $1', [id]);
    if (!chRows[0]) return fail(res, 404, 'Chapter not found.');

    // Regeneration (delete + full AI regen) runs as an async background job.
    const job = await createJob('chapter_content', id, { chapter_id: id, force: true });

    return ok(res, {
      id,
      regenerated: true,
      job_id: Number(job.id),
      status: job.status,
    });
  }

  return fail(res, 400, 'Unknown action.');
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;