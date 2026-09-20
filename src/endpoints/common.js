'use strict';
/**
 * Shared endpoint helpers: exam_json envelope, CORS, CSRF (HMAC-signed tokens),
 * body parsing. Mirrors exam/api/config.php.
 */
const crypto = require('crypto');
const { DomainException } = require('../ai');

const SECRET = process.env.EXAM_CSRF_SECRET || 'dev-insecure-secret-change-me';

// ---------------- response envelope ----------------
function examJson(res, success, data = null, error = null, status = 200) {
  const payload = { success, data, error };
  return res.status(status).json(payload);
}
function ok(res, data) { return examJson(res, true, data, null, 200); }
function fail(res, code, message) { return examJson(res, false, null, { code, message }, code === 0 ? 500 : code); }

// ---------------- CORS ----------------
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

// ---------------- CSRF (stateless HMAC) ----------------
function signToken(ts) {
  const payload = 'v1.' + ts;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return sig + '.' + payload;
}
function makeCsrfToken() {
  return signToken(String(Date.now()));
}
function verifyCsrf(req) {
  const provided = req.headers['x-csrf-token'];
  if (!provided || typeof provided !== 'string') {
    throw new DomainException('Invalid CSRF token.', 403);
  }
  const parts = provided.split('.');
  if (parts.length !== 3) throw new DomainException('Invalid CSRF token.', 403);
  const [sig, ver, ts] = parts;
  if (ver !== 'v1') throw new DomainException('Invalid CSRF token.', 403);
  const expected = crypto.createHmac('sha256', SECRET).update('v1.' + ts).digest('base64url');
  // Node crypto timingSafeEqual requires equal-length buffers
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(sig));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new DomainException('Invalid CSRF token.', 403);
  }
  const age = Date.now() - Number(ts);
  if (Number.isNaN(age) || age < 0 || age > 24 * 60 * 60 * 1000) {
    throw new DomainException('CSRF token expired. Reload the page.', 403);
  }
  return true;
}

// ---------------- error mapper ----------------
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof DomainException) {
    return fail(res, err.status || 500, err.message);
  }
  console.error('[ExamDashboard] Unhandled error:', err);
  const code = err.code === 404 ? 404 : err.code === 400 ? 400 : err.status === 404 ? 404 : 500;
  return fail(res, code, err.message || 'Internal server error.');
}

// Async wrapper
function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { examJson, ok, fail, corsMiddleware, makeCsrfToken, verifyCsrf, errorHandler, wrap };