'use strict';
const crypto = require('crypto');

// ---------- JSON ----------
// Port of PHP json_encode with JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES.
function jsonEncode(value) {
  return JSON.stringify(value === undefined ? null : value).replace(/\//g, '\\u002f');
}
// json_decode($s, true) — also tolerates model output left in a JS string.
function jsonDecode(s, fallback) {
  if (s === null || s === undefined) return fallback;
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); }
  catch (e) { return fallback; }
}

// Robust JSON extraction like exam_ai_try_decode (code fences / stray prose).
function aiTryDecode(s) {
  if (typeof s !== 'string') s = String(s === null || s === undefined ? '' : s);
  s = s.trim();
  if (s === '') return null;
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v) || (v !== null && typeof v === 'object')) return v;
  } catch (e) { /* continue */ }
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) {
    try {
      const v = JSON.parse(fence[1].trim());
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) return v;
    } catch (e) { /* continue */ }
  }
  for (const open of ['{', '[']) {
    const close = open === '{' ? '}' : ']';
    const start = s.indexOf(open);
    const end = s.lastIndexOf(close);
    if (start !== -1 && end > start) {
      try {
        const v = JSON.parse(s.slice(start, end + 1));
        if (Array.isArray(v) || (v !== null && typeof v === 'object')) return v;
      } catch (e) { /* continue */ }
    }
  }
  return null;
}

// ---------- Strings ----------
function normalize(s) {
  s = String(s === null || s === undefined ? '' : s).toLowerCase().trim();
  s = s.replace(/[^\p{L}\p{N}\s]+/gu, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function randomHex(len = 8) {
  return crypto.randomBytes(len).toString('hex');
}

// ---------- Logging (never logs secrets) ----------
function log(stage, message, context = {}) {
  const safe = { stage, msg: message };
  for (const [k, v] of Object.entries(context || {})) {
    if (/key|token|secret|password|authorization/i.test(k)) {
      safe[k] = '***REDACTED***';
      continue;
    }
    safe[k] = typeof v === 'string' ? v.slice(0, 200) : v;
  }
  console.error('[ExamDashboard] ' + JSON.stringify(safe));
}

module.exports = { jsonEncode, jsonDecode, aiTryDecode, normalize, randomHex, log };