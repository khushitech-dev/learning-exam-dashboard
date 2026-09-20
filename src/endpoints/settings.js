'use strict';
/**
 * Settings endpoint (port of exam/api/settings.php).
 */
const express = require('express');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { aiConfig, aiCheckKey, resetAiConfig } = require('../ai');

const router = express.Router();

async function upsertSetting(key, value) {
  await db.query(`
    INSERT INTO app_settings (setting_key, setting_value) VALUES ($1, $2)
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
    [key, value]);
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const cfg = await aiConfig(db);
  const keySet = cfg.key !== '';
  const source = process.env.OPENAI_API_KEY ? 'environment' : (keySet ? 'database' : 'none');
  ok(res, {
    openai_key_set: keySet,
    provider: cfg.provider,
    base_url: cfg.base_url,
    openai_model: cfg.model,
    big_model: cfg.big_model,
    source,
  });
}));

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
router.post('/', wrap(async (req, res) => {
  verifyCsrf(req);
  const body = req.body || {};
  const action = body.action || '';

  if (action === 'save_provider') {
    const allowed = ['openai', 'gemini', 'groq', 'openrouter', 'ollama', 'custom'];
    const provider = String(body.provider || 'openai').toLowerCase().trim();
    if (!allowed.includes(provider)) return fail(res, 400, 'Unknown provider.');
    const base = String(body.base_url || '').trim();
    if (base !== '' && !/^https?:\/\//i.test(base)) {
      return fail(res, 400, 'Base URL must start with http(s)://.');
    }
    const model = String(body.model || '').trim();
    if (provider !== 'custom' && (base === '' || model === '')) {
      return fail(res, 400, 'Provider needs a base URL and a model name.');
    }
    const bigModel = String(body.big_model || model).trim();

    await upsertSetting('ai_provider', provider);
    await upsertSetting('ai_base_url', base);
    await upsertSetting('ai_model', model);
    await upsertSetting('ai_big_model', bigModel);
    resetAiConfig();
    ok(res, { provider });
    return;
  }

  if (action === 'save_key') {
    const key = String(body.key || '').trim();
    if (key === '') return fail(res, 400, 'API key cannot be empty.');
    await upsertSetting('openai_api_key', key);
    resetAiConfig();
    const check = await aiCheckKey(db, key);
    ok(res, { openai_key_set: true, key_valid: check.ok, key_message: check.message });
    return;
  }

  if (action === 'clear_key') {
    await db.query("DELETE FROM app_settings WHERE setting_key = 'openai_api_key'");
    resetAiConfig();
    ok(res, { openai_key_set: false });
    return;
  }

  return fail(res, 400, 'Unknown action.');
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;