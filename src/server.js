'use strict';
/**
 * Exam Study Dashboard — Node.js server.
 * Serves the Express API at /api/<name>.php (same URLs as the original PHP app)
 * and the static frontend (../exam by default, index.html).
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const { corsMiddleware, errorHandler } = require('./endpoints/common');

const app = express();

const PORT = parseInt(process.env.PORT || '4000', 10);

// ---------------------------------------------------------------------------
// API — same routes as the PHP endpoints (frontend calls api/<name>.php)
// ---------------------------------------------------------------------------
app.use('/api', corsMiddleware);
app.use('/api', express.json({ limit: '2mb' }));

app.use('/api/csrf.php', require('./endpoints/csrf'));
app.use('/api/upload.php', require('./endpoints/upload'));
app.use('/api/tests.php', require('./endpoints/tests'));
app.use('/api/subjects.php', require('./endpoints/subjects'));
app.use('/api/chapters.php', require('./endpoints/chapters'));
app.use('/api/summaries.php', require('./endpoints/summaries'));
app.use('/api/jobs.php', require('./endpoints/jobs'));
app.use('/api/questions.php', require('./endpoints/questions'));
app.use('/api/settings.php', require('./endpoints/settings'));
app.use('/api/results.php', require('./endpoints/results'));
app.use('/api/search.php', require('./endpoints/search'));
app.use('/api/final_summaries.php', require('./endpoints/final_summaries'));
app.use('/api/pdf.php', require('./endpoints/pdf'));

// Never serve PHP sources as static files.
app.use((req, res, next) => {
  if (/\.php(?:\?|$)/i.test(req.path)) return res.status(404).end('Not found.');
  next();
});

// ---------------------------------------------------------------------------
// Static frontend (index.html preferred over index.php)
// ---------------------------------------------------------------------------
const staticDir = path.resolve(process.cwd(), process.env.STATIC_DIR || '');
const defaultStaticDir = path.resolve(__dirname, '..', '..', 'exam');
const resolvedStaticDir = process.env.STATIC_DIR ? staticDir : defaultStaticDir;

app.use('/', express.static(resolvedStaticDir, { index: 'index.html' }));

// Explicitly serve index.html at the root when no index.html file listing is requested.
app.get('/', (req, res) => {
  const idx = path.join(resolvedStaticDir, 'index.html');
  if (fs.existsSync(idx)) return res.sendFile(idx);
  res.status(404).send('Frontend not found. Set STATIC_DIR to the exam frontend folder.');
});

// Health check (Render requires a listening HTTP port).
app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).json({ success: false, data: null, error: { code: 404, message: 'Not found.' } }));

app.use(errorHandler);

// Export the Express app so it can be embedded in a serverless function
// (Netlify). Only bind a port when this file is run directly.
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('[ExamDashboard] listening on http://localhost:' + PORT);
    console.log('[ExamDashboard] static frontend: ' + resolvedStaticDir);
  });
}