'use strict';
/**
 * Search endpoint (port of exam/api/search.php).
 * Uses ILIKE (case-insensitive) to mirror MySQL's default case-insensitive LIKE.
 */
const express = require('express');
const db = require('../db');
const { ok, fail, wrap } = require('./common');
const { jsonDecode } = require('../util');

const router = express.Router();

function contains(hay, needle) {
  return String(hay || '').toLowerCase().indexOf(String(needle || '').toLowerCase()) !== -1;
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
router.get('/', wrap(async (req, res) => {
  const action = req.query.action || '';

  if (action === 'all') {
    const subjects = await db.query('SELECT id, name FROM subjects ORDER BY name');
    const index = [];

    for (const s of subjects) {
      const idx = { subject_id: Number(s.id), subject_name: s.name, chapters: [] };
      const chaps = await db.query(`
        SELECT c.id, c.title, cc.easy_explanation, cc.definitions_json, cc.important_points_json,
               cc.key_terms_json, cc.exam_important_json
        FROM chapters c
        LEFT JOIN chapter_content cc ON cc.chapter_id = c.id
        WHERE c.subject_id = $1 ORDER BY c.order_index ASC`, [s.id]);

      for (const c of chaps) {
        const defs = jsonDecode(c.definitions_json || '[]', []) || [];
        const points = jsonDecode(c.important_points_json || '[]', []) || [];
        const terms = jsonDecode(c.key_terms_json || '[]', []) || [];
        const examImp = jsonDecode(c.exam_important_json || '[]', []) || [];

        const qRows = await db.query('SELECT id, question_text, correct_answer FROM questions WHERE chapter_id = $1', [c.id]);
        const questions = qRows.map((q) => ({
          id: Number(q.id), question_text: q.question_text, answer: q.correct_answer,
        }));

        idx.chapters.push({
          id: Number(c.id),
          title: c.title,
          summary: c.easy_explanation || '',
          definitions: defs,
          important_points: points,
          key_terms: terms,
          exam_important: examImp,
          questions,
        });
      }
      index.push(idx);
    }

    ok(res, index);
    return;
  }

  const q = String(req.query.q || '').trim();
  const subjectId = parseInt(req.query.subject_id || '0', 10);

  if (q === '') return ok(res, []);

  const like = '%' + q + '%';
  const results = { chapters: [], definitions: [], terms: [], points: [], questions: [] };

  // Chapters by title
  let sql = `SELECT c.id, c.title, c.subject_id, s.name AS subject_name, c.status
             FROM chapters c JOIN subjects s ON s.id = c.subject_id WHERE c.title ILIKE $1`;
  const params = [like];
  if (subjectId > 0) {
    sql += ' AND c.subject_id = $' + (params.length + 1);
    params.push(subjectId);
  }
  sql += ' ORDER BY c.order_index LIMIT 20';
  results.chapters = await db.query(sql, params);

  // Definitions / terms / points / exam-important from chapter_content JSON
  let contentSql = `SELECT c.id AS chapter_id, c.title AS chapter_title, c.subject_id, s.name AS subject_name,
                           cc.easy_explanation, cc.definitions_json, cc.important_points_json,
                           cc.key_terms_json, cc.exam_important_json
                    FROM chapters c
                    JOIN subjects s ON s.id = c.subject_id
                    LEFT JOIN chapter_content cc ON cc.chapter_id = c.id`;
  if (subjectId > 0) contentSql += ' WHERE c.subject_id = ' + subjectId;
  const rows = await db.query(contentSql);

  const qLower = q.toLowerCase();
  for (const r of rows) {
    const defs = jsonDecode(r.definitions_json || '[]', []) || [];
    const points = jsonDecode(r.important_points_json || '[]', []) || [];
    const terms = jsonDecode(r.key_terms_json || '[]', []) || [];
    const examImp = jsonDecode(r.exam_important_json || '[]', []) || [];

    for (const d of defs) {
      const term = String(d.term || '');
      const def = String(d.definition || '');
      if (contains(term, qLower) || contains(def, qLower)) {
        results.definitions.push({
          term, definition: def,
          chapter_id: Number(r.chapter_id), chapter_title: r.chapter_title,
          subject_id: Number(r.subject_id), subject_name: r.subject_name,
        });
      }
    }
    for (const t of terms) {
      const term = String(t.term || '');
      const ctx = String(t.context || '');
      if (contains(term, qLower) || contains(ctx, qLower)) {
        results.terms.push({
          term, context: ctx,
          chapter_id: Number(r.chapter_id), chapter_title: r.chapter_title,
          subject_id: Number(r.subject_id), subject_name: r.subject_name,
        });
      }
    }
    for (const p of points) {
      const point = String(p.point || '');
      if (contains(point, qLower)) {
        results.points.push({
          point, reason: String(p.reason || ''),
          chapter_id: Number(r.chapter_id), chapter_title: r.chapter_title,
          subject_id: Number(r.subject_id), subject_name: r.subject_name,
        });
      }
    }
    for (const e of examImp) {
      const item = String(e.item || '');
      if (contains(item, qLower)) {
        results.points.push({
          point: item, reason: String(e.why || 'Exam-important') + ' (Exam important)',
          chapter_id: Number(r.chapter_id), chapter_title: r.chapter_title,
          subject_id: Number(r.subject_id), subject_name: r.subject_name,
        });
      }
    }
  }

  // Questions + answers
  let qSql = `SELECT q.id, q.question_text, q.correct_answer, q.topic, c.id AS chapter_id, c.title AS chapter_title,
                     s.id AS subject_id, s.name AS subject_name
              FROM questions q
              JOIN chapters c ON c.id = q.chapter_id
              JOIN subjects s ON s.id = c.subject_id
              WHERE q.question_text ILIKE $1 OR q.correct_answer ILIKE $1`;
  const qParams = [like];
  if (subjectId > 0) {
    qSql += ' AND c.subject_id = $' + (qParams.length + 1);
    qParams.push(subjectId);
  }
  qSql += ' LIMIT 20';
  results.questions = await db.query(qSql, qParams);

  ok(res, results);
}));

router.all('/', (req, res) => fail(res, 405, 'Method not allowed.'));

module.exports = router;