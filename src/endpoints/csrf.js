'use strict';
/**
 * CSRF token endpoint (NEW — the PHP version embedded the token in a meta tag).
 * GET /api/csrf.php -> { success, data: { token } }
 * The stateless HMAC token is fetched lazily by the frontend for POST requests.
 */
const express = require('express');
const { ok, fail, makeCsrfToken } = require('./common');

const router = express.Router();

router.get('/', (req, res) => {
  ok(res, { token: makeCsrfToken() });
});

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;