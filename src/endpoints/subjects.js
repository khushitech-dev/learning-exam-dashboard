'use strict';
/**
 * Subjects endpoint (port of exam/api/subjects.php).
 */
const express = require('express');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { recomputeProgress } = require('../progress');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const action = req.query.action || '';

  if (action === 'dashboard') return dashboard(res);

  const id = parseInt(req.query.id || '0', 10);
  if (id > 0) {
    const rows = await db.query(`
      SELECT s.*,
             COALESCE(sp.completed_chapters,0) AS completed_chapters,
             COALESCE(sp.avg_score,0) AS avg_score,
             COALESCE(sp.overall_progress,0) AS overall_progress
      FROM subjects s
      LEFT JOIN subject_progress sp ON sp.subject_id = s.id
      WHERE s.id = $1`, [id]);
    if (!rows[0]) return fail(res, 404, 'Subject not found.');
    return ok(res, rows[0]);
  }

  const subjects = await db.query(`
    SELECT s.id, s.name, s.pdf_original_name, s.pdf_path, s.total_chapters,
           s.status, s.file_size, s.page_count, s.created_at, s.doc_count,
           COALESCE(sp.completed_chapters,0) AS completed_chapters,
           COALESCE(sp.avg_score,0) AS avg_score,
           COALESCE(sp.overall_progress,0) AS overall_progress,
           (SELECT COUNT(*)::int FROM chapters c WHERE c.subject_id = s.id) AS chapter_count
    FROM subjects s
    LEFT JOIN subject_progress sp ON sp.subject_id = s.id
    ORDER BY s.created_at DESC`);
  ok(res, subjects);
}));

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
router.post('/', wrap(async (req, res) => {
  verifyCsrf(req);
  const body = req.body || {};
  const action = body.action || '';

  if (action === 'rename') {
    const id = parseInt(body.id || '0', 10);
    const name = String(body.name || '').trim();
    if (id <= 0 || name === '') return fail(res, 400, 'Subject id and name are required.');
    await db.query('UPDATE subjects SET name = $1 WHERE id = $2', [name, id]);
    return ok(res, { id, name });
  }

  if (action === 'delete') {
    const id = parseInt(body.id || '0', 10);
    if (id <= 0) return fail(res, 400, 'Subject id is required.');

    const rows = await db.query('SELECT pdf_path FROM subjects WHERE id = $1', [id]);
    const subject = rows[0];
    if (!subject) return fail(res, 404, 'Subject not found.');

    // Delete stored PDF folder (Supabase Storage), ignoring missing paths.
    try {
      const prefix = 'uploads/subject_' + id;
      const items = await db.storage.list(prefix);
      const paths = items.map((i) => i.path);
      if (paths.length) await db.storage.remove(paths);
    } catch (e) {
      // bucket not configured — fall through to local dev mirror cleanup below
    }

    // Local dev mirror (written when Supabase Storage is unavailable).
    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.resolve(process.cwd(), 'uploads', 'subject_' + id);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) { /* ignore */ }

    await db.query('DELETE FROM subjects WHERE id = $1', [id]);
    return ok(res, { id });
  }

  if (action === 'recompute_progress') {
    const id = parseInt(body.id || '0', 10);
    if (id <= 0) return fail(res, 400, 'Subject id is required.');
    await recomputeProgress(db, id);
    return ok(res, { id });
  }

  return fail(res, 400, 'Unknown action.');
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

// ---------------------------------------------------------------------------
// exam_dashboard port
// ---------------------------------------------------------------------------
async function dashboard(res) {
  const totalsRow = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM subjects) AS subjects,
      (SELECT COUNT(*)::int FROM subjects WHERE status IN ('ready','needs_detection')) AS ready_subjects,
      (SELECT COUNT(*)::int FROM subjects WHERE status = 'processing') AS processing,
      (SELECT COUNT(*)::int FROM chapters) AS total_chapters,
      (SELECT COUNT(*)::int FROM chapters WHERE status = 'completed') AS completed_chapters,
      (SELECT COUNT(*)::int FROM weak_topics WHERE status IN ('open','revising')) AS open_weak_topics,
      (SELECT COUNT(*)::int FROM test_attempts) AS tests_taken,
      (SELECT COALESCE(ROUND(AVG(percentage),2),0)::float FROM test_attempts) AS avg_score_all`);
  const totals = {
    subjects: Number(totalsRow[0].subjects),
    ready_subjects: Number(totalsRow[0].ready_subjects),
    processing: Number(totalsRow[0].processing),
    total_chapters: Number(totalsRow[0].total_chapters),
    completed_chapters: Number(totalsRow[0].completed_chapters),
    open_weak_topics: Number(totalsRow[0].open_weak_topics),
    tests_taken: Number(totalsRow[0].tests_taken),
    avg_score_all: Number(totalsRow[0].avg_score_all),
  };

  const statusRows = await db.query('SELECT status, COUNT(*)::int AS n FROM chapters GROUP BY status');
  totals.status_counts = {};
  for (const r of statusRows) totals.status_counts[r.status] = r.n;

  const recent = await db.query(`
    SELECT ta.id, ta.score, ta.total_questions, ta.percentage, ta.passed, ta.test_type, ta.timestamp,
           ch.title AS chapter_title, s.name AS subject_name
    FROM test_attempts ta
    JOIN chapters ch ON ch.id = ta.chapter_id
    JOIN subjects s ON s.id = ta.subject_id
    ORDER BY ta.timestamp DESC LIMIT 8`);

  const subjects = await db.query(`
    SELECT s.id, s.name, s.status, s.created_at,
           COALESCE(sp.completed_chapters,0) AS completed_chapters,
           COALESCE(sp.total_chapters, (SELECT COUNT(*)::int FROM chapters c WHERE c.subject_id = s.id)) AS total_chapters,
           COALESCE(sp.overall_progress,0) AS overall_progress,
           COALESCE(sp.avg_score,0) AS avg_score
    FROM subjects s
    LEFT JOIN subject_progress sp ON sp.subject_id = s.id
    ORDER BY s.created_at DESC LIMIT 12`);

  ok(res, { totals, recent_attempts: recent, subjects });
}

module.exports = router;