'use strict';
/**
 * PDF stream proxy (port of exam/api/pdf.php).
 * Serves uploaded PDFs from Supabase Storage (with a local-disk dev fallback).
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const subjectId = parseInt(req.query.subject_id || '0', 10);
    const chapterId = parseInt(req.query.chapter_id || '0', 10);

    if (subjectId <= 0 && chapterId <= 0) {
      return res.status(400).send('Missing subject_id or chapter_id.');
    }

    let path;
    if (chapterId > 0) {
      const rows = await db.query('SELECT s.pdf_path FROM chapters c JOIN subjects s ON s.id = c.subject_id WHERE c.id = $1', [chapterId]);
      path = rows[0] ? rows[0].pdf_path : null;
    } else {
      const rows = await db.query('SELECT pdf_path FROM subjects WHERE id = $1', [subjectId]);
      path = rows[0] ? rows[0].pdf_path : null;
    }

    if (!path) return res.status(404).send('PDF not found.');

    let buffer;
    if (db.storage.available) {
      try {
        buffer = await db.storage.download(path);
      } catch (e) {
        if (e.code === 404) return res.status(404).send('PDF file missing on server.');
        throw e;
      }
    } else {
      // Local dev fallback: mirror files live under <cwd>/uploads/<subject_X>/...
      const fs = require('fs');
      const pathMod = require('path');
      const abs = pathMod.resolve(process.cwd(), path);
      if (!fs.existsSync(abs)) return res.status(404).send('PDF file missing on server.');
      buffer = fs.readFileSync(abs);
    }

    const filename = path.split('/').pop() || 'document.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.all('/', (req, res) => res.status(405).send('Method not allowed.'));

module.exports = router;