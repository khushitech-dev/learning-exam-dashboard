'use strict';
/**
 * Final subject summary endpoint (port of exam/api/final_summaries.php).
 * Generation now runs as an asynchronous background job because a single
 * large AI call can outlive Netlify's 26s foreground function limit.
 */
const express = require('express');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { createJob } = require('../jobs');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const subjectId = parseInt(req.query.subject_id || '0', 10);
  if (subjectId <= 0) return fail(res, 400, 'subject_id is required.');

  const rows = await db.query(`
    SELECT fs.content, fs.word_count, fs.generated_at,
           s.name AS subject_name,
           (SELECT COUNT(*)::int FROM chapters c WHERE c.subject_id = s.id) AS total_chapters,
           (SELECT COUNT(*)::int FROM chapters c WHERE c.subject_id = s.id AND c.status = 'completed') AS completed_chapters,
           COALESCE(sp.avg_score,0) AS avg_score
    FROM final_summaries fs
    JOIN subjects s ON s.id = fs.subject_id
    LEFT JOIN subject_progress sp ON sp.subject_id = s.id
    WHERE fs.subject_id = $1`, [subjectId]);

  if (rows[0]) return ok(res, { generated: true, summary: rows[0] });
  ok(res, { generated: false });
}));

// ---------------------------------------------------------------------------
// POST — enqueue a final-summary generation job
// ---------------------------------------------------------------------------
router.post('/', wrap(async (req, res) => {
  verifyCsrf(req);
  const body = req.body || {};
  const subjectId = parseInt(body.subject_id || '0', 10);
  if (subjectId <= 0) return fail(res, 400, 'subject_id is required.');

  const subj = await db.query('SELECT id FROM subjects WHERE id = $1', [subjectId]);
  if (!subj[0]) return fail(res, 404, 'Subject not found.');

  const job = await createJob('final_summary', null, { subject_id: subjectId });

  ok(res, {
    job_id: Number(job.id),
    job_type: job.job_type,
    status: job.status,
  });
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;