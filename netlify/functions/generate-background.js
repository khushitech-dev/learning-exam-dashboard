'use strict';
/**
 * Netlify background function.
 *
 * File name ends with "-background" so Netlify runs it as a background function:
 * it responds 202 immediately and can keep working for up to 15 minutes
 * (instead of the 26s synchronous-function limit that caused HTTP 504s).
 *
 * How a generation starts:
 *   1. Client POSTs /api/summaries.php (etc.) -> an ai_jobs row is created and
 *      { job_id } is returned. This returns in milliseconds, so no 504.
 *   2. The client (and, on Netlify, the server too) POSTs to this function with
 *      { job_id }. The job is claimed atomically (queued -> running), so two
 *      redundant triggers never run it twice.
 *   3. The client polls GET /api/jobs.php?id=... until the job is done/failed.
 *
 * Authentication: accepts the app's HMAC CSRF token (same scheme as the API,
 * verified with the shared EXAM_CSRF_SECRET) or the server-only x-jobs-token.
 */
const crypto = require('crypto');
const { runJob } = require('../../src/jobs');

function parseBody(event) {
  let raw = event && event.body;
  if (raw && event.isBase64Encoded) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }
  let body = {};
  if (raw) {
    try { body = JSON.parse(raw); } catch (e) { /* ignore */ }
  }
  return body || {};
}

function validCsrf(token, secret) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [sig, ver, ts] = parts;
  if (ver !== 'v1') return false;
  const expected = crypto.createHmac('sha256', secret).update('v1.' + ts).digest('base64url');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const age = Date.now() - Number(ts);
  return !Number.isNaN(age) && age >= 0 && age <= 24 * 60 * 60 * 1000;
}

exports.handler = async (event) => {
  const secret = process.env.EXAM_CSRF_SECRET || '';
  const headers = event.headers || {};
  const serverToken = headers['x-jobs-token'] || headers['X-Jobs-Token'] || '';
  const clientToken = headers['x-csrf-token'] || headers['X-CSRF-Token'] || '';

  const serverOk = !secret ? true : (serverToken === secret);
  const clientOk = validCsrf(clientToken, secret);
  if (!serverOk && !clientOk) {
    return { statusCode: 403, body: 'forbidden' };
  }

  const body = parseBody(event);
  const jobId = Number(body.job_id || 0);
  if (!jobId || !Number.isInteger(jobId) || jobId <= 0) {
    return { statusCode: 400, body: 'job_id is required' };
  }

  try {
    await runJob(jobId);
  } catch (e) {
    console.error('[Jobs] background run failed:', e && e.message ? e.message : e);
  }

  return { statusCode: 202, body: 'accepted' };
};

module.exports = { handler: exports.handler };