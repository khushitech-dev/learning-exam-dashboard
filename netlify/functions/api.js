'use strict';
const serverless = require('serverless-http');
const app = require('../../src/server');

// Netlify redirects give the function either the ORIGINAL request path
// (e.g. /api/settings.php) or the rewritten function URL
// (e.g. /.netlify/functions/api/settings.php). Normalize both, and also
// the exam app's relative api/... calls which resolve to /exam/api/...
function normalizePath(event) {
  if (!event.path) return;
  let p = event.path;
  const fnPrefix = '/.netlify/functions/api';
  if (p.startsWith(fnPrefix)) p = '/api' + (p.slice(fnPrefix.length) || '');
  if (p.startsWith('/exam/api/') && !p.startsWith('/api/')) p = p.slice('/exam'.length);
  if (p !== event.path) event.path = p;
}

exports.handler = (event, context) => {
  normalizePath(event);
  return serverless(app, { binary: ['application/pdf', 'image/*'] })(event, context);
};

module.exports = { handler: exports.handler };