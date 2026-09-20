'use strict';
/**
 * Asynchronous AI job runner.
 *
 * Long-running AI generations (chapter summary/content/questions) used to run
 * synchronously inside the request handler, which exceeded Netlify's 26s
 * foreground function limit and produced HTTP 504 Gateway Timeout responses.
 *
 * Instead we now enqueue a row in `ai_jobs` and hand the work over to a
 * worker that is not bounded by the request timeout:
 *   - On Netlify  -> a background function (netlify/functions/generate-background.js).
 *   - Everywhere else (local dev) -> this same module run in-process, fire and forget.
 *
 * The client polls GET /api/jobs.php?id=... until the job is done/failed.
 */
const db = require('./db');

// ---------------------------------------------------------------------------
// Create a job and trigger the worker.
// ---------------------------------------------------------------------------
// IMPORTANT: the request handler MUST return quickly (Netlify kills sync
// functions at 26s). We never block on the background trigger here; the job
// is claimed atomically by whichever worker reaches it first, so a redundant
// trigger (server-side + browser) is harmless.
async function createJob(jobType, chapterId, payload = {}) {
  const rows = await db.query(
    `INSERT INTO ai_jobs (job_type, chapter_id, payload) VALUES ($1, $2, $3) RETURNING *`,
    [jobType, chapterId || null, JSON.stringify(payload || {})]
  );
  const job = rows[0];
  triggerWorker(job);
  return job;
}

function backgroundWorkerUrl() {
  // Explicit override (e.g. JOBS_BACKGROUND_URL=https://your-site.netlify.app)
  if (process.env.JOBS_BACKGROUND_URL) return String(process.env.JOBS_BACKGROUND_URL).replace(/\/$/, '');
  // Local Netlify CLI functions: no live background worker, run in-process.
  if (process.env.NETLIFY_LOCAL === 'true') return '';
  // Netlify injects URL / DEPLOY_URL in the function runtime (custom domains too).
  for (const key of ['URL', 'DEPLOY_URL']) {
    const base = process.env[key];
    if (base && /^https?:\/\//i.test(base)) {
      return base.replace(/\/$/, '') + '/.netlify/functions/generate-background';
    }
  }
  return '';
}

async function markFailed(jobId, message) {
  try {
    await db.query("UPDATE ai_jobs SET status = 'failed', error = $1, finished_at = NOW() WHERE id = $2", [String(message || 'Job failed.'), jobId]);
  } catch (e) { /* best effort */ }
}

function triggerWorker(job) {
  const bgUrl = backgroundWorkerUrl();
  const jobId = Number(job.id);

  if (bgUrl) {
    // Netlify: fire-and-forget a POST to the background function. The browser
    // also triggers it (ui.startJob), and the job claim is atomic, so the
    // first worker to arrive does the work and the other bails out.
    fetch(bgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-jobs-token': process.env.EXAM_CSRF_SECRET || '',
      },
      body: JSON.stringify({ job_id: jobId }),
    }).catch(() => {});
  } else {
    // Local / non-Netlify: run the worker in the same process, fire and forget
    // (the Node server keeps running after the response is sent).
    runJob(jobId).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Worker — actually performs the AI work for a job.
// ---------------------------------------------------------------------------
async function runJob(jobId) {
  // Atomically claim the job so two redundant triggers never run it twice:
  // only the worker that flips 'queued' -> 'running' proceeds.
  const claimed = await db.query(
    "UPDATE ai_jobs SET status = 'running', started_at = NOW() WHERE id = $1 AND status = 'queued' RETURNING *",
    [jobId]
  );
  const job = claimed[0];
  if (!job) return;

  let result = null;
  let error = null;
  try {
    const payload = (typeof job.payload === 'string') ? safeJson(job.payload) : (job.payload || {});
    const chapterId = Math.max(1, Number(payload.chapter_id || job.chapter_id || 0));

    if (job.job_type === 'chapter_content') {
      const { generateChapterContent } = require('./ai-generate');
      const r = await generateChapterContent(db, chapterId, !!payload.force);
      result = {
        questions_generated: r.questions_generated,
        study_topics_generated: r.study_topics_generated,
      };
    } else if (job.job_type === 'questions') {
      const { generateChapterQuestions } = require('./ai-generate');
      const types = Array.isArray(payload.types) && payload.types.length ? payload.types : ['mcq'];
      const count = Math.min(15, Math.max(2, Number(payload.count_per_type) || 5));
      const generated = await generateChapterQuestions(db, chapterId, types, count);
      result = { generated };
    } else if (job.job_type === 'final_summary') {
      const { generateFinalSummary } = require('./final-summary');
      const subjectId = Math.max(1, Number(payload.subject_id || job.chapter_id || 0));
      const r = await generateFinalSummary(db, subjectId);
      result = { generated: r.generated, word_count: r.word_count, message: r.message || '' };
    } else {
      throw new Error('Unknown job type: ' + job.job_type);
    }

    await db.query(
      "UPDATE ai_jobs SET status = 'done', result = $1, finished_at = NOW() WHERE id = $2",
      [JSON.stringify(result), jobId]
    );
  } catch (e) {
    error = String((e && e.message) ? e.message : e);
    await db.query(
      "UPDATE ai_jobs SET status = 'failed', error = $1, finished_at = NOW() WHERE id = $2",
      [error, jobId]
    );
  }
}

function safeJson(s) {
  try { return JSON.parse(s); } catch (e) { return {}; }
}

async function getJob(id) {
  const rows = await db.query(
    'SELECT id, job_type, chapter_id, status, error, result, created_at, started_at, finished_at FROM ai_jobs WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

module.exports = { createJob, runJob, getJob };