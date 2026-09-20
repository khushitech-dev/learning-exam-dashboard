/* ============================================================
   EXAM STUDY DASHBOARD - Settings
   Theme, data management (export backup).
   ============================================================ */
(function () {
  'use strict';
  const EXAM = window.EXAM = window.EXAM || {};
  const settings = EXAM.settings = {};

  settings.render = function (content, ui) {
    const cur = document.documentElement.getAttribute('data-theme');
    content.innerHTML = `
      <div class="exam-page-header">
        <h1 class="exam-h1">⚙️ Settings</h1>
        <div class="exam-subtitle">Exam Study Dashboard preferences.</div>
      </div>

      <div class="exam-card exam-mb-16">
        <h2 class="exam-h2">🎨 Appearance</h2>
        <div class="exam-flex exam-gap-sm">
          <label class="exam-test-option" style="margin:0;flex:1">
            <input type="radio" name="exam-theme" value="light" ${cur !== 'dark' ? 'checked' : ''} style="margin-right:8px"> ☀️ Light
          </label>
          <label class="exam-test-option" style="margin:0;flex:1">
            <input type="radio" name="exam-theme" value="dark" ${cur === 'dark' ? 'checked' : ''} style="margin-right:8px"> 🌙 Dark
          </label>
        </div>
      </div>

      <div class="exam-card exam-mb-16">
        <h2 class="exam-h2">🤖 AI Generation</h2>
        <p class="exam-muted exam-mb-16">Choose your AI provider. Several good free options exist (Google Gemini, Groq, OpenRouter) — they use the same OpenAI-style API, so the app works with any of them. The API key is stored securely on the server (database) and is never sent to the browser.</p>

        <div class="exam-mb-8" id="exam-settings-ai-status"></div>

        <label class="exam-muted" style="font-size:12px">AI Provider</label>
        <select id="exam-settings-ai-provider" class="exam-select" style="max-width:560px">
          <option value="openai">OpenAI — paid (needs billing credits)</option>
          <option value="gemini">Google Gemini — FREE</option>
          <option value="groq">Groq — FREE (very fast)</option>
          <option value="ollama">Ollama — LOCAL & FREE (no key, no limit)</option>
          <option value="openrouter">OpenRouter — FREE options available</option>
          <option value="custom">Custom (OpenAI-compatible)</option>
        </select>

        <div class="exam-flex exam-gap-sm" style="margin-top:8px;max-width:560px">
          <input class="exam-input" id="exam-settings-ai-base" placeholder="Base URL, e.g. https://api.openai.com/v1" style="flex:2" autocomplete="off">
          <input class="exam-input" id="exam-settings-ai-model" placeholder="Model, e.g. gpt-4o-mini" style="flex:1" autocomplete="off">
        </div>
        <div class="exam-mt-8 exam-muted" style="font-size:12px" id="exam-settings-ai-hint"></div>
        <div class="exam-mt-8">
          <button class="exam-btn" data-setting="ai-provider">💾 Save Provider</button>
        </div>

        <div class="exam-mt-16">
          <label class="exam-muted" style="font-size:12px">API Key</label>
          <div class="exam-flex exam-gap-sm" style="max-width:560px">
            <input type="password" id="exam-settings-ai-key" class="exam-input" style="flex:1" placeholder="Paste your API key" autocomplete="off">
            <button class="exam-btn exam-btn-primary" data-setting="ai-save">💾 Save Key</button>
            <button class="exam-btn exam-btn-danger" data-setting="ai-clear">🧹 Clear Key</button>
          </div>
        </div>
        <div class="exam-mt-8 exam-muted" style="font-size:12px" id="exam-settings-ai-result"></div>
      </div>

      <div class="exam-card exam-mb-16">
        <h2 class="exam-h2">💾 Data Management</h2>
        <p class="exam-muted exam-mb-16">Export a JSON backup of all subjects, chapters, content, tests and results. Data lives in the MySQL database (exam_dashboard).</p>
        <button class="exam-btn exam-btn-primary" data-setting="export">⬇️ Export Backup (JSON)</button>
      </div>

      <div class="exam-card exam-mb-16">
        <h2 class="exam-h2">ℹ️ About</h2>
        <div class="exam-muted">
          <b>Exam Study / PDF Study Dashboard</b><br>
          Upload a subject PDF → AI builds easy-language summaries, definitions, important points, questions & answers → take chapter tests → find and fix weak topics → complete the chapter. PHP + MySQL backend with OpenAI content generation.
          <br><br>
          ⚠️ <b>PDF rule:</b> all content is generated from your uploaded PDF only. If something is not in the PDF, it is marked as "Information not clearly available in the uploaded PDF".
        </div>
      </div>`;

    content.querySelectorAll('input[name="exam-theme"]').forEach((r) => {
      r.addEventListener('change', () => {
        document.documentElement.setAttribute('data-theme', r.value);
        localStorage.setItem('examDashboard_theme', r.value);
        const icon = document.getElementById('exam-theme-icon');
        const label = document.getElementById('exam-theme-label');
        if (icon) icon.textContent = r.value === 'dark' ? '☀️' : '🌙';
        if (label) label.textContent = r.value === 'dark' ? 'Light Mode' : 'Dark Mode';
      });
    });

    content.querySelector('[data-setting="export"]').addEventListener('click', async () => {
      const btn = document.querySelector('[data-setting="export"]');
      btn.disabled = true; btn.textContent = '⏳ Building backup…';
      try {
        const data = await ui.api('api/search.php?action=all');
        const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exam-study-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        ui.toast('Backup exported.', 'success');
      } catch (e) {
        ui.toast(e.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '⬇️ Export Backup (JSON)';
      }
    });

    // ---------- AI Generation ----------
    const statusEl = content.querySelector('#exam-settings-ai-status');
    const resultEl = content.querySelector('#exam-settings-ai-result');
    const hintEl = content.querySelector('#exam-settings-ai-hint');
    const keyInput = content.querySelector('#exam-settings-ai-key');
    const providerSel = content.querySelector('#exam-settings-ai-provider');
    const baseInput = content.querySelector('#exam-settings-ai-base');
    const modelInput = content.querySelector('#exam-settings-ai-model');

    const AI_PRESETS = {
      openai: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', hint: 'OpenAI is paid — you must add billing credits on their site before it works.' },
      gemini: { base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.6-flash', hint: 'FREE. Key at https://aistudio.google.com/apikey (Google account needed). NOTE: free tier is limited to ~20 requests per day (5 per minute). Ek chapter roz generate karne ke liye kaafi hai. Quota midnight (Pacific) pe reset hoti hai.' },
      groq: { base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', hint: 'FREE. Get a key at https://console.groq.com/keys. Very fast; free tier has per-minute request limits.' },
      ollama: { base: 'http://localhost:11434/v1', model: 'qwen2.5:3b', hint: '100% LOCAL & FREE — no API key, no limit. Matlab-to use karo: local AI aapke computer pe hi chalta hai. Note: Ollama app ko ON rakhna hai.' },
      openrouter: { base: 'https://openrouter.ai/api/v1', model: 'moonshotai/kimi-k2-0711:free', hint: 'FREE key at https://openrouter.ai/keys. Use a model with ":free" in its name to avoid charges.' },
      custom: { base: '', model: '', hint: 'Any endpoint that speaks the OpenAI chat/completions API (e.g. a local server or your own key service).' },
    };

    function applyPreset(provider) {
      const p = AI_PRESETS[provider] || AI_PRESETS.custom;
      baseInput.value = p.base;
      modelInput.value = p.model;
      hintEl.textContent = p.hint || '';
    }

    providerSel.addEventListener('change', () => applyPreset(providerSel.value));

    async function refreshAiStatus() {
      try {
        const st = await ui.api('api/settings.php');
        providerSel.value = st.provider && Array.from(providerSel.options).some((o) => o.value === st.provider) ? st.provider : 'custom';
        baseInput.placeholder = 'Base URL, e.g. https://api.openai.com/v1';
        if (st.base_url) baseInput.value = st.base_url;
        if (st.openai_model) modelInput.value = st.openai_model;
        hintEl.textContent = (AI_PRESETS[st.provider] && AI_PRESETS[st.provider].hint) || AI_PRESETS.custom.hint;
        const keyBadge = st.openai_key_set ? '<span class="exam-badge exam-badge-green">✓ Key set</span>' : '<span class="exam-badge exam-badge-red">✗ No key</span>';
        const src = st.source === 'environment' ? '<b>OPENAI_API_KEY env var</b>' : st.openai_key_set ? '<b>saved in the database</b>' : '<b>not set</b>';
        statusEl.innerHTML = `${keyBadge} <span class="exam-muted">Provider: <b>${ui.esc(st.provider || 'openai')}</b> · Model: <b>${ui.esc(st.openai_model || '')}</b> · Key source: ${src}</span>`;
        keyInput.value = '';
        resultEl.textContent = '';
      } catch (e) {
        statusEl.textContent = 'Could not load AI settings: ' + e.message;
      }
    }

    content.querySelector('[data-setting="ai-provider"]').addEventListener('click', async () => {
      const btn = content.querySelector('[data-setting="ai-provider"]');
      const provider = providerSel.value;
      const base = baseInput.value.trim().replace(/\/+$/, '');
      const model = modelInput.value.trim();
      btn.disabled = true; btn.textContent = '💾 Saving…';
      try {
        await ui.api('api/settings.php', { method: 'POST', body: { action: 'save_provider', provider, base_url: base, model } });
        ui.toast('AI provider saved.', 'success');
        refreshAiStatus();
      } catch (e) {
        resultEl.textContent = e.message;
        ui.toast(e.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '💾 Save Provider';
      }
    });

    content.querySelector('[data-setting="ai-save"]').addEventListener('click', async () => {
      const btn = content.querySelector('[data-setting="ai-save"]');
      const key = keyInput.value.trim();
      if (!key) { resultEl.textContent = 'Paste your API key first.'; return; }
      btn.disabled = true; btn.textContent = '💾 Saving…';
      try {
        const res = await ui.api('api/settings.php', { method: 'POST', body: { action: 'save_key', key }, raw: true });
        if (typeof window !== 'undefined' && res.error) throw new Error(res.error.message);
        const d = res.data;
        resultEl.textContent = d.key_message || (d.key_valid ? 'Key saved and verified.' : 'Key saved (not yet verified).');
        ui.toast(d.key_valid ? 'API key saved ✓' : 'Key saved, but the provider rejected it.', d.key_valid ? 'success' : 'warning');
        refreshAiStatus();
      } catch (e) {
        resultEl.textContent = e.message;
        ui.toast(e.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '💾 Save Key';
      }
    });

    content.querySelector('[data-setting="ai-clear"]').addEventListener('click', async () => {
      const btn = content.querySelector('[data-setting="ai-clear"]');
      btn.disabled = true; btn.textContent = '🧹 Clearing…';
      try {
        await ui.api('api/settings.php', { method: 'POST', body: { action: 'clear_key' } });
        ui.toast('API key removed from the database.', 'success');
        refreshAiStatus();
      } catch (e) {
        resultEl.textContent = e.message;
        ui.toast(e.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '🧹 Clear Key';
      }
    });

    refreshAiStatus();
  };
})();