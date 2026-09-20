'use strict';
/**
 * Jobs endpoint — status polling for asynchronous AI generation jobs.
 * The client starts a job via summaries.php / chapters.php / questions.php
 * and polls this endpoint until status is done/failed.
 */
const express = require('express');
const db = require('../db');
const { ok, fail, wrap } = require('./common');
const { getJob } = require('../jobs');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET — job status
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const id = parseInt(req.query.id || '0', 10);
  if (id <= 0) return fail(res, 400, 'job id is required.');

  const job = await getJob(id);
  if (!job) return fail(res, 404, 'Job not found.');

  ok(res, job);
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;