'use strict';
/**
 * AI provider layer ported from exam/api/config.php
 * (exam_ai_config, exam_ai_post, exam_ai_post_with_retry, exam_openai)
 */
const { aiTryDecode, log } = require('./util');

class DomainException extends Error {
  constructor(message, code = 500) {
    super(message);
    this.status = code;
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ---------------- config ----------------
let _aiConfig = null;
let _aiConfigAt = 0;
const AI_CONFIG_TTL_MS = 60000;
async function aiConfig(db) {
  const now = Date.now();
  if (_aiConfig && now - _aiConfigAt < AI_CONFIG_TTL_MS) return _aiConfig;
  const cfg = {
    provider: 'openai',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    big_model: 'gpt-4o',
    key: process.env.OPENAI_API_KEY ? String(process.env.OPENAI_API_KEY).trim() : '',
  };

  if (process.env.OPENAI_API_BASE) cfg.base_url = String(process.env.OPENAI_API_BASE).replace(/\/$/, '');

  try {
    const rows = await db.query('SELECT setting_key, setting_value FROM app_settings');
    const map = {};
    for (const r of rows) map[r.setting_key] = String(r.setting_value || '');
    if (map.openai_api_key && map.openai_api_key.trim()) cfg.key = map.openai_api_key.trim();
    if (map.ai_provider && map.ai_provider.trim()) cfg.provider = map.ai_provider.trim();
    if (map.ai_base_url && map.ai_base_url.trim()) cfg.base_url = map.ai_base_url.trim().replace(/\/$/, '');
    if (map.ai_model && map.ai_model.trim()) cfg.model = map.ai_model.trim();
    if (map.ai_big_model && map.ai_big_model.trim()) cfg.big_model = map.ai_big_model.trim();
  } catch (e) { /* table missing or unreachable -> defaults */ }

  // Env vars always win
  if (process.env.OPENAI_API_BASE) cfg.base_url = String(process.env.OPENAI_API_BASE).replace(/\/$/, '');
  if (process.env.OPENAI_API_KEY) cfg.key = String(process.env.OPENAI_API_KEY).trim();

  _aiConfig = cfg;
  _aiConfigAt = now;
  return cfg;
}

// ---------------- transports ----------------
function isLocalAi(baseUrl) {
  return /localhost/.test(baseUrl) || /127\.0\.0\.1/.test(baseUrl);
}

async function aiPostOllama(baseUrl, payload, timeoutMs) {
  const ollamaPayload = {
    model: payload.model || 'qwen2.5:3b',
    messages: payload.messages || [],
    stream: false,
    options: { temperature: payload.temperature != null ? payload.temperature : 0.7 },
  };
  if (payload.max_tokens != null) ollamaPayload.options.num_predict = payload.max_tokens;
  if (payload.response_format && typeof payload.response_format === 'object') ollamaPayload.format = 'json';
  if (payload.top_p != null) ollamaPayload.options.top_p = payload.top_p;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(baseUrl.replace(/\/$/, '') + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaPayload),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return { http: 0, body: '', error: 'Ollama: ' + (err.name === 'AbortError' ? 'request timed out' : err.message) };
  } finally {
    clearTimeout(timer);
  }

  const body = await response.text();
  let decoded;
  try { decoded = JSON.parse(body); } catch (e) { decoded = {}; }

  if (decoded && decoded.message) {
    const openai = {
      choices: [{ message: { role: decoded.message.role || 'assistant', content: decoded.message.content || '' }, finish_reason: decoded.done ? 'stop' : 'length' }],
    };
    return { http: 200, body: JSON.stringify(openai), error: null };
  }
  if (decoded && decoded.error) {
    return { http: response.status, body, error: 'Ollama: ' + decoded.error };
  }
  return { http: response.status, body, error: 'Ollama: unexpected response format' };
}

async function aiPostGeminiNative(key, payload, timeoutMs, model) {
  const messages = payload.messages || [];
  const contents = [];
  for (const msg of messages) {
    const role = (msg.role || 'user') === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: msg.content || '' }] });
  }
  const geminiPayload = {
    contents,
    generationConfig: { temperature: payload.temperature != null ? payload.temperature : 0.3 },
  };
  if (payload.max_tokens != null) geminiPayload.generationConfig.maxOutputTokens = payload.max_tokens;
  if (payload.response_format && typeof payload.response_format === 'object' && payload.response_format.type === 'json_object') {
    geminiPayload.generationConfig.responseMimeType = 'application/json';
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
  const headers = { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(geminiPayload),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return { http: 0, body: '', error: 'Gemini: ' + (err.name === 'AbortError' ? 'request timed out' : err.message) };
  } finally {
    clearTimeout(timer);
  }
  const body = await response.text();
  let decoded;
  try { decoded = JSON.parse(body); } catch (e) { decoded = {}; }

  if (decoded && decoded.candidates && decoded.candidates[0] && decoded.candidates[0].content &&
      decoded.candidates[0].content.parts && decoded.candidates[0].content.parts[0] &&
      decoded.candidates[0].content.parts[0].text != null) {
    const openai = {
      choices: [{ message: { role: 'assistant', content: decoded.candidates[0].content.parts[0].text }, finish_reason: 'stop' }],
    };
    return { http: 200, body: JSON.stringify(openai), error: null };
  }
  if (decoded && decoded.error) {
    return { http: response.status, body, error: 'Gemini: ' + (decoded.error.message || decoded.error.code || 'unknown error') };
  }
  return { http: response.status, body, error: 'Gemini: unexpected response format' };
}

// Gentle pacing between consecutive AI calls so free-tier rate limits are not hit.
// - Local (Ollama): 1s
// - Fast OpenAI-compatible providers (Groq/OpenRouter free): 2s
// - Gemini free tier (support ok, ~20 req/min rolling): 4s
// Override anytime with AI_PACING_SECONDS (e.g. 0 to disable waiting).
const _state = { lastCallAt: 0 };
function pacingSeconds(cfg, baseUrl) {
  if (isLocalAi(baseUrl)) return 1.0;
  const fromEnv = Number(process.env.AI_PACING_SECONDS);
  if (Number.isFinite(fromEnv) && fromEnv >= 0) return fromEnv;
  const provider = String(cfg.provider || '').toLowerCase();
  if (provider === 'groq' || provider === 'openrouter') return 2.0;
  return 4.0;
}
async function pace(baseUrl, space) {
  const now = Date.now();
  if (_state.lastCallAt > 0) {
    const gap = space * 1000 - (now - _state.lastCallAt);
    if (gap > 0) await sleep(gap);
  }
  _state.lastCallAt = Date.now();
}

async function aiPost(baseUrl, key, payload, timeout = 180) {
  const cfg = await _currentCfgForPost();
  const local = isLocalAi(baseUrl);
  const isOllama = local && (baseUrl.indexOf('11434') !== -1 || (cfg.provider || '').toLowerCase().indexOf('ollama') !== -1);

  if (isOllama) {
    baseUrl = baseUrl.replace(/\/v1(\/(openai|chat\/completions))?$/i, '').replace(/\/$/, '');
  }

  // Timeout: remote = 120s, local = 180s
  if (timeout === 180) timeout = local ? 180 : 120;
  const timeoutMs = timeout * 1000;

  await pace(baseUrl, pacingSeconds(cfg, baseUrl));

  if (isOllama) return aiPostOllama(baseUrl, payload, timeoutMs);

  const isGemini = (cfg.provider || '').toLowerCase().indexOf('gemini') !== -1 ||
    baseUrl.indexOf('generativelanguage.googleapis.com') !== -1;

  // AQ. auth token doesn't work with OpenAI-compatible endpoint -> native Gemini API
  if (isGemini && !local && key.indexOf('AIza') !== 0) {
    return aiPostGeminiNative(key, payload, timeoutMs, payload.model || 'gemini-3.6-flash');
  }

  const headers = { 'Content-Type': 'application/json' };
  headers[isGemini && !local ? 'x-goog-api-key' : 'Authorization'] = isGemini && !local ? key : 'Bearer ' + key;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return { http: 0, body: '', error: err.name === 'AbortError' ? 'Request timed out' : err.message };
  } finally {
    clearTimeout(timer);
  }
  const body = await response.text();
  let decoded = null;
  try { decoded = JSON.parse(body); } catch (e) { /* not json */ }

  let errMsg = null;
  if (decoded && decoded.error) {
    errMsg = typeof decoded.error === 'string' ? decoded.error : (decoded.error.message || decoded.error.code || null);
  }
  if (errMsg === null && response.status !== 200) {
    errMsg = body.slice(0, 500);
  }
  return { http: response.status, body, error: errMsg };
}

let _postCfgRef = null;
async function _currentCfgForPost() {
  // aiPost needs provider name; read config without forcing it in caller stack too deeply.
  if (_postCfgRef) return _postCfgRef;
  return { provider: _aiConfig ? _aiConfig.provider : 'openai' };
}
// set the config reference used by aiPost for provider detection
function pulseCfg(cfg) { _postCfgRef = cfg; _aiConfig = cfg; _aiConfigAt = Date.now(); }
// drop the cached config so the next aiConfig(db) re-reads app_settings
function resetAiConfig() { _aiConfig = null; _aiConfigAt = 0; }

// ---------------- retry helper ----------------
function aiRetrySeconds(errorText) {
  const m = String(errorText || '').match(/retry\s+in\s+(\d+(?:\.\d+)?)\s*s/i);
  return m ? parseFloat(m[1]) + 1.5 : 0;
}

async function aiPostWithRetry(baseUrl, key, payload, maxAttempts = 3) {
  let attempt = 0;
  let reformatted = false;
  while (true) {
    attempt++;
    let r = await aiPost(baseUrl, key, payload);

    if (!reformatted && r.http === 400 && r.error && /response_format/.test(r.error)) {
      reformatted = true;
      delete payload.response_format;
      continue;
    }
    if (r.http === 200) return r;

    const isTimeout = r.http === 0 && r.error && /timed out/i.test(r.error);
    const transient = [408, 429, 503].includes(r.http) || (r.http === 0 && r.error);
    const body = String(r.body || '');
    const busy = /high demand|experiencing.*demand|overloaded|too busy|currently busy/i.test(body + ' ' + String(r.error || ''));
    const throttled = /free_tier_requests|quota exceeded|requests per day for model/i.test(body);
    const effectiveMax = (busy || throttled) ? Math.max(maxAttempts, 5) : maxAttempts;
    if (!transient || attempt >= effectiveMax) return r;

    if (r.http === 429) {
      if (/PerDayPerProjectPerModel/i.test(body) || (/GenerateRequests/i.test(body) && /day/i.test(body))) {
        return r;
      }
      const serverWait = aiRetrySeconds(r.error || body);
      if (/free_tier_requests|quota exceeded|requests per day for model/i.test(body)) {
        // Free-tier per-minute throttle (rolling window). The server tells us
        // exactly when it resets ("Please retry in Xs"). Honor it so the
        // background worker (15-min limit) rides it out without user action.
        const cap = 90;
        const wait = Math.min(Math.max(serverWait, 20), cap);
        await sleep(Math.ceil(wait) * 1000);
        continue;
      }
      let wait = serverWait;
      if (wait <= 0) wait = busy ? 25.0 : 15.0;
      wait = Math.max(wait, busy ? 20.0 : 12.0);
      await sleep(Math.ceil(wait) * 1000);
      continue;
    }

    const wait = (r.http === 0 && r.error) ? 6 : (r.http === 503 ? (busy ? 20 : 8) : 5);
    await sleep(wait * 1000);
  }
}

// ---------------- main AI call ----------------
// OpenRouter free models are served from a shared pool and throttle frequently.
// Fall through the chain so one saturated model doesn't block generation.
const OPENROUTER_FREE_FALLBACK = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'z-ai/glm-5.2:free',
  'qwen/qwen3.8-27b:free',
  'nex-agi/nex-n2.5-mini:free',
  'google/gemma-4-31b-it:free',
];

async function aiOpenai(db, messages, model = '', maxTokens = 0) {
  const cfg = await aiConfig(db);
  _postCfgRef = cfg;

  const local = isLocalAi(cfg.base_url) || cfg.provider === 'ollama';
  if ((!cfg.key || !cfg.key.trim()) && !local) {
    throw new DomainException('AI API key is not configured. Add it via Settings ➝ AI Generation (or set the OPENAI_API_KEY environment variable).', 500);
  }

  if (!model) model = cfg.model;
  const maxTok = maxTokens || 16384;

  const candidates = [model];
  if ((cfg.provider || '').toLowerCase() === 'openrouter') {
    candidates.push(...OPENROUTER_FREE_FALLBACK);
  }
  const tried = new Set();

  let jsonAttempts = 3;
  let lastReason = '';
  let lastHttp = 0;

  for (const candidate of candidates) {
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    const retryBudget = candidate === model ? 3 : 2;

    log('ai_request', 'Sending AI request', { provider: cfg.provider, base_url: cfg.base_url, model: candidate, msg_count: messages.length });

    const payload = {
      model: candidate,
      messages,
      temperature: 0.3,
      max_tokens: maxTok,
      response_format: { type: 'json_object' },
    };

    while (true) {
      const r = await aiPostWithRetry(cfg.base_url, cfg.key, payload, retryBudget);
      if (r.http !== 200) {
        lastHttp = r.http;
        lastReason = r.error || ('AI request failed (HTTP ' + r.http + ').');
        if (r.http === 429 && (cfg.provider || '').toLowerCase().indexOf('gemini') !== -1) {
          const body429 = String(r.body || '');
          if (/PerDayPerProjectPerModel|per day per project|requests per day for model/i.test(body429)) {
            lastReason = 'Aapki Gemini free tier ki DAILY quota khatam ho gayi hai. Yeh midnight ko reset hoti hai - kal try karo. Ya phir ek naya free Gemini API key banao (Google AI Studio se) aur Settings mein update karo.';
          } else if (/free_tier_requests|quota exceeded/i.test(body429)) {
            lastReason = 'Gemini free tier filhal busy hai (per-minute request limit). Background worker wait karke khud retry kar raha hai - thodi der mein job complete ho jayegi.';
          }
        }
        log('ai_error', 'AI request failed', { http: r.http, provider: cfg.provider, model: candidate, error: lastReason });
        break;
      }

      const decoded = JSON.parse(r.body || '{}');
      const content = String((decoded.choices && decoded.choices[0] && decoded.choices[0].message && decoded.choices[0].message.content) || '').trim();
      // A model returning ~nothing (or a give-up sentinel) is as useless as an error:
      // hop to the next candidate instead of storing blank content.
      if (content.length < 20 || (content.length < 300 && /not clearly available/i.test(content))) {
        log('ai_error', 'AI candidate gave up / empty output', { http: r.http, model: candidate, content_length: content.length });
        lastReason = lastReason || ('AI returned empty/unclear output (' + candidate + ').');
        break;
      }
      const parsed = aiTryDecode(content);
      if (Array.isArray(parsed) || (parsed !== null && typeof parsed === 'object')) {
        log('ai_success', 'AI response parsed successfully', { content_length: content.length, model: candidate, parsed_keys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : '(array)' });
        return parsed;
      }
      jsonAttempts--;
      if (jsonAttempts <= 0) {
        log('ai_error', 'AI invalid JSON deciding fallback', { model: candidate, content_length: content.length });
        lastReason = 'AI returned invalid JSON (' + candidate + ').';
        break;
      }
      await sleep(3000);
    }
  }

  throw new DomainException(lastReason || ('AI request failed (HTTP ' + lastHttp + ').'), 502);
}

// ---------------- key verification ----------------
async function aiCheckKey(db, key) {
  const cfg = await aiConfig(db);
  if (!String(key || '').trim()) {
    return { ok: false, message: 'API key is empty.' };
  }
  const payload = {
    model: cfg.model,
    messages: [{ role: 'user', content: 'Reply with ONLY the JSON object {"ok":true} and nothing else.' }],
    temperature: 0,
    max_tokens: 8,
  };
  const r = await aiPost(cfg.base_url, cfg.key || key, payload, 20);
  if (r.http === 0 && r.error) {
    return { ok: true, message: 'Stored. (Verification skipped: ' + r.error + ')' };
  }
  if (r.http === 200) return { ok: true, message: 'API key is valid.' };
  if ([408, 429, 503].includes(r.http)) {
    return { ok: true, message: 'Stored. (Provider busy: ' + r.error + ')' };
  }
  return { ok: false, message: 'Key stored, but the API provider rejected it: ' + (r.error || ('Error verifying key (HTTP ' + r.http + ').')) };
}

module.exports = { DomainException, aiConfig, aiOpenai, aiPost, aiPostWithRetry, aiCheckKey, aiRetrySeconds, pulseCfg, resetAiConfig };