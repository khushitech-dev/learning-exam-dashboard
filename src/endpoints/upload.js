'use strict';
/**
 * PDF upload + chapter detection endpoint (port of exam/api/upload.php).
 */
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const db = require('../db');
const { ok, fail, verifyCsrf, wrap } = require('./common');
const { extractPdf } = require('../extract');
const { recomputeProgress } = require('../progress');
const {
  normalize, jsonDecode, log,
} = require('../util');
const {
  parseHeading, guessDocType, ucfirst,
  detectTopics, detectSyllabusTopics, detectLineTopics,
  detectTableUnits, linePageNumbers,
} = require('../text');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ---------------------------------------------------------------------------
// POST upload.php
// ---------------------------------------------------------------------------
router.post('/', upload.single('pdf'), wrap(async (req, res) => {
  verifyCsrf(req);
  const file = req.file;
  if (!file) return fail(res, 400, 'No file uploaded.');

  const subjectId = parseInt(req.body.subject_id || '0', 10);
  const existingSubject = subjectId > 0;
  const docTypeRaw = String(req.body.doc_type || 'auto').toLowerCase().trim();
  let subjectName = String(req.body.name || '').trim();

  let subject;
  if (existingSubject) {
    const rows = await db.query('SELECT id, name FROM subjects WHERE id = $1', [subjectId]);
    if (!rows[0]) return fail(res, 404, 'Subject not found.');
    subject = rows[0];
    subjectName = subject.name;
  } else {
    if (subjectName === '') {
      subjectName = (file.originalname || '').replace(/\.pdf$/i, '') || 'Untitled Subject';
    }
    const r = await db.query(`
      INSERT INTO subjects (name, pdf_filename, pdf_original_name, pdf_path, file_size, status)
      VALUES ($1, 'pending', $2, '', $3, 'processing')
      RETURNING id`, [subjectName, file.originalname, file.size]);
    subject = r[0];
  }

  const sid = Number(subject.id);

  // Store PDF to Supabase Storage
  const hex = crypto.randomBytes(16).toString('hex');
  const relPath = 'uploads/subject_' + sid + '/' + hex + '.pdf';
  const storedName = relPath.split('/').pop();

  if (db.storage.available) {
    await db.storage.upload(relPath, file.buffer, file.mimetype || 'application/pdf');
  } else {
    // LOCAL fallback for development: keep a mirror copy on disk too.
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, '..', '..', '..', 'uploads', 'subject_' + sid);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, storedName), file.buffer);
  }

  if (!existingSubject) {
    await db.query('UPDATE subjects SET pdf_filename = $1, pdf_path = $2 WHERE id = $3', [storedName, relPath, sid]);
  }

  // Extract text
  const extracted = await extractPdf(file.buffer);
  const fullText = String(extracted.full || '').trim();
  const pageCount = extracted.pages.length;

  await db.query('UPDATE subjects SET page_count = $1 WHERE id = $2', [pageCount || null, sid]);

  // Document kind detection
  let docType = (docTypeRaw !== '' && docTypeRaw !== 'auto') ? docTypeRaw : guessDocType(fullText, file.originalname);
  if (!['syllabus', 'textbook', 'notes', 'general'].includes(docType)) docType = 'general';

  const docInsert = await db.query(`
    INSERT INTO subject_documents (subject_id, doc_type, stored_filename, original_name, rel_path, file_size, page_count, full_text, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ready')
    RETURNING id`,
    [sid, docType, storedName, file.originalname, relPath, file.size, pageCount || null, fullText]
  );
  const docId = Number(docInsert[0].id);

  await db.query(`UPDATE subjects SET doc_count = (SELECT COUNT(*) FROM subject_documents WHERE subject_id = $1) WHERE id = $2`, [sid, sid]);

  if (fullText.length < 50) {
    await db.query('UPDATE subject_documents SET status = $1 WHERE id = $2', ['failed', docId]);
    if (!existingSubject) {
      await db.query('UPDATE subjects SET status = $1 WHERE id = $2', ['failed', sid]);
    }
    return ok(res, {
      subject_id: sid,
      subject_name: subjectName,
      doc_id: docId,
      doc_type: docType,
      status: 'failed',
      message: 'Could not extract readable text from this PDF. It may be a scanned/image-only document.',
    });
  }

  // Detect chapters
  const result = await detectChapters(fullText, pageCount ? extracted.pages : [], sid, db, docType, docId, existingSubject);

  log('upload_complete', 'Upload finished', {
    subject_id: sid, doc_type: docType, page_count: pageCount,
    text_length: fullText.length, chapter_count: result.chapter_count,
    added: result.added, matched: result.matched,
  });

  const statusAfter = result.chapter_count > 0 ? 'ready' : 'needs_detection';
  await db.query('UPDATE subjects SET status = $1, total_chapters = $2, pdf_original_name = $3 WHERE id = $4',
    [statusAfter, result.chapter_count, file.originalname, sid]);

  await recomputeProgress(db, sid);

  return ok(res, {
    subject_id: sid,
    subject_name: subjectName,
    doc_id: docId,
    doc_type: docType,
    status: statusAfter,
    chapter_count: result.chapter_count,
    added: result.added,
    matched: result.matched,
    page_count: pageCount,
    chapters: result.chapters,
    message: result.added > 0
      ? (existingSubject ? 'Detected new chapters and merged with source ' + file.originalname + '.' : 'Chapters detected successfully.')
      : 'All chapters already exist for this subject.',
  });
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

// ---------------------------------------------------------------------------
// Chapter detection (port of exam_detect_chapters)
// ---------------------------------------------------------------------------
async function detectChapters(fullText, pages, subjectId, db, docType, docId, existingSubject) {
  const headings = [];
  const lines = fullText.split(/\r?\n/);
  let currentPage = 1;

  lines.forEach((line, lineNo) => {
    const pm = String(line).trim().match(/^--- Page (\d+) ---$/i);
    if (pm) { currentPage = parseInt(pm[1], 10); return; }
    const trimmed = String(line).trim();
    if (trimmed === '' || trimmed.length > 160) return;

    const h = parseHeading(trimmed);
    if (h === null) return;

    if (/\.{3,}\s*\d+\s*$/.test(trimmed)) return;
    if (/^\s*\d+\s*$/.test(trimmed)) return;

    let title = h.title;
    if (title === '') title = trimmed;
    title = ucfirst(title.replace(/\s+/g, ' ').trim());

    headings.push({ id: null, raw: trimmed, title, type: h.type, no: h.no, page: currentPage, order: lineNo });
  });

  const seen = new Set();
  const final = [];
  for (const h of headings) {
    const key = normalize(h.title);
    if (seen.has(key)) continue;
    seen.add(key);
    final.push(h);
  }

  // Syllabus table fallback
  if (final.length === 0) {
    const units = detectTableUnits(lines);
    const pageAt = linePageNumbers(lines);
    const seenTypeNo = new Set();
    for (const u of units) {
      const key = normalize(u.title);
      if (seen.has(key)) continue;
      const tnKey = u.type + ':' + String(u.num || '').toLowerCase();
      const from = (u.i || 0) + 2;
      const to = Math.min(lines.length, from + 40);
      const region = lines.slice(from, Math.max(0, to - from) > 0 ? from + (to - from) : from).join('\n').replace(/^--- Page \d+ ---$/img, '');
      const uTopics = detectSyllabusTopics(region, 4);
      if (seenTypeNo.has(tnKey) && uTopics.length < 2) continue;
      seenTypeNo.add(tnKey);
      seen.add(key);
      final.push({
        id: null,
        raw: String(lines[u.i]).trim(),
        title: u.title,
        type: 'unit',
        no: String(u.num),
        page: pageAt[u.i] || 1,
        order: (u.i || 0) + 1,
      });
    }
  }

  // Topic detection per heading
  for (let i = 0; i < final.length; i++) {
    const fh = final[i];
    fh.endLine = final[i + 1] ? final[i + 1].order : lines.length;
    const from = fh.order + 1;
    const to = Math.min(lines.length, fh.endLine);
    const region = lines.slice(from, to).join('\n').replace(/^--- Page \d+ ---$/img, '');
    fh.topics = docType === 'syllabus'
      ? detectSyllabusTopics(region, 25)
      : detectTopics(region, 25);
    if (!fh.topics.length && region.trim() !== '') {
      fh.topics = detectLineTopics(region, 25);
    }
  }

  if (!existingSubject) {
    return await insertChapters(db, subjectId, final, docType);
  }

  return await mergeChapters(db, subjectId, final, docType);
}

async function insertChapters(db, subjectId, headings, docType) {
  const result = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const topicsJson = JSON.stringify(h.topics || []);
    const r = await db.query(`
      INSERT INTO chapters (subject_id, title, order_index, start_page, org_label, unit_type, unit_no, topics_json, content_level)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id`,
      [subjectId, h.title, i + 1, h.page, h.raw, h.type, h.no, topicsJson, docType === 'syllabus' ? 'syllabus' : 'detailed']
    );
    result.push({ id: Number(r[0].id), title: h.title, page: h.page, type: h.type, no: h.no, matched: false });
  }
  return { chapters: result, chapter_count: result.length, added: result.length, matched: 0 };
}

async function mergeChapters(db, subjectId, headings, docType) {
  const rows = await db.query('SELECT id, title, unit_type, unit_no, topics_json, content_level FROM chapters WHERE subject_id = $1', [subjectId]);
  const byNorm = {};
  const byTypeNo = {};
  for (const ch of rows) {
    byNorm[normalize(ch.title)] = ch;
    if (ch.unit_no) byTypeNo[ch.unit_type + ':' + String(ch.unit_no).toLowerCase()] = ch;
  }

  const maxRows = await db.query('SELECT COALESCE(MAX(order_index),0)::int AS m FROM chapters WHERE subject_id = $1', [subjectId]);
  let maxOrder = maxRows[0].m;

  let added = 0, matched = 0;
  const created = [];

  for (const h of headings) {
    const key = normalize(h.title);
    const matchedCh = byNorm[key] || byTypeNo[h.type + ':' + String(h.no || '').toLowerCase()] || null;

    if (matchedCh) {
      if (docType !== 'syllabus' && matchedCh.content_level === 'syllabus') {
        await db.query('UPDATE chapters SET content_level = $1 WHERE id = $2', ['detailed', matchedCh.id]);
      }
      await mergeTopics(db, Number(matchedCh.id), matchedCh.topics_json, h);
      matched++;
      created.push({ id: Number(matchedCh.id), title: h.title, page: h.page, matched: true });
      continue;
    }

    const topicsJson = JSON.stringify(h.topics || []);
    const r = await db.query(`
      INSERT INTO chapters (subject_id, title, order_index, start_page, org_label, unit_type, unit_no, topics_json, content_level)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id`,
      [subjectId, h.title, ++maxOrder, h.page, h.raw, h.type, h.no, topicsJson, docType === 'syllabus' ? 'syllabus' : 'detailed']
    );
    created.push({ id: Number(r[0].id), title: h.title, page: h.page, matched: false });
    added++;
  }

  const cnt = await db.query('SELECT COUNT(*)::int AS c FROM chapters WHERE subject_id = $1', [subjectId]);

  return { chapters: created, chapter_count: cnt[0].c, added, matched };
}

async function mergeTopics(db, chapterId, existingJson, h) {
  const existing = jsonDecode(existingJson, []);
  const newTopics = h.topics || [];
  const set = {};
  for (const t of existing) set[normalize(t)] = true;
  const merged = existing.slice();
  for (const t of newTopics) {
    const k = normalize(t);
    if (k === '' || set[k]) continue;
    set[k] = true;
    merged.push(t);
  }
  merged.slice(0, 40);
  await db.query('UPDATE chapters SET topics_json = $1 WHERE id = $2', [JSON.stringify(merged.slice(0, 40)), chapterId]);
}

module.exports = router;