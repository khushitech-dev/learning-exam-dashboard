'use strict';
/**
 * Final subject summary generation (shared by the final_summaries endpoint
 * and the async job worker in src/jobs.js).
 */
const { aiOpenai } = require('./ai');
const { systemPrompt } = require('./prompts');
const { wordCount, isSentinel } = require('./text');

async function generateFinalSummary(db, subjectId) {
  const subj = await db.query('SELECT name FROM subjects WHERE id = $1', [subjectId]);
  const subjectName = subj[0] ? String(subj[0].name) : '';
  if (!subj[0]) throw new Error('Subject not found.');

  const chapters = await db.query(`
    SELECT c.title, cc.easy_explanation, cc.exam_important_json, cc.key_terms_json, cc.revision_notes
    FROM chapters c
    JOIN chapter_content cc ON cc.chapter_id = c.id
    WHERE c.subject_id = $1 AND cc.summary_ready = 1
    ORDER BY c.order_index ASC`, [subjectId]);

  if (chapters.length === 0) {
    return { generated: false, content: '', word_count: 0, message: 'No chapter summaries generated yet. Generate chapter content first.' };
  }

  const statsRow = await db.query(`
    SELECT sp.completed_chapters, sp.overall_progress, sp.avg_score, s.total_chapters
    FROM subjects s LEFT JOIN subject_progress sp ON sp.subject_id = s.id WHERE s.id = $1`, [subjectId]);
  const stats = statsRow[0] || { completed_chapters: 0, overall_progress: 0, avg_score: 0, total_chapters: 0 };

  const weakRows = await db.query(`
    SELECT wt.topic_name, wt.status, c.title AS chapter_title
    FROM weak_topics wt JOIN chapters c ON c.id = wt.chapter_id
    WHERE wt.subject_id = $1 AND wt.status IN ('open','revising','retested_now')
    ORDER BY c.order_index ASC`, [subjectId]);

  const historyRows = await db.query(`
    SELECT score, total_questions, percentage, passed, test_type, timestamp
    FROM test_attempts WHERE subject_id = $1 ORDER BY timestamp DESC LIMIT 12`, [subjectId]);

  // Build the input blocks (mirrors the PHP assemble + mb_substr 48000).
  let input = '';
  for (const c of chapters) {
    input += '## ' + c.title + '\n\n' + String(c.easy_explanation || '') + '\n\n';
    if (c.revision_notes) {
      input += 'Quick revision notes for ' + c.title + ':\n' + c.revision_notes + '\n\n';
    }
  }
  input += '\n=== SUBJECT PERFORMANCE DATA ===\n';
  input += 'Units completed: ' + stats.completed_chapters + '/' + stats.total_chapters +
    ', overall progress ' + stats.overall_progress + '%, average test score ' + stats.avg_score + '%\n';
  if (weakRows.length) {
    input += 'Weak topics needing revision: ' + weakRows.map((w) => w.topic_name + ' (' + w.chapter_title + ') [' + w.status + ']').join(', ') + '\n';
  }
  if (historyRows.length) {
    const ts = historyRows.map((h) => {
      const t = String(h.test_type || '').toUpperCase();
      return h.percentage + '% ' + (h.passed ? 'PASS' : 'FAIL') + ' (' + h.score + '/' + h.total_questions + ') [' + t + '] ' + h.timestamp;
    });
    input += 'Test history (latest first): ' + ts.join(' | ') + '\n';
  }
  if (Array.from(input).length > 48000) input = Array.from(input).slice(0, 48000).join('');

  // Same user prompt as exam/api/final_summaries.php.
  const userMsg = 'Subject: ' + subjectName +
    '\n\nCombine the chapter summaries and performance data below into a COMPREHENSIVE exam-revision cheat sheet (about 2000-3000 words) with these sections:\n' +
    '1) Complete syllabus overview (what the whole subject covers, unit by unit — 3-4 sentences per unit)\n' +
    '2) Unit-wise revision (DETAILED recap of every unit in the summaries — 5-8 bullet points per unit with key formulas, definitions, and concepts)\n' +
    '3) The 20 most important definitions (with brief explanations, not just the term)\n' +
    '4) The 15 most important concepts / theory (with 2-3 sentence explanations each)\n' +
    '5) The 15 most-asked exam topics + exam-important items (with why each is important)\n' +
    '6) Quick revision notes (detailed one-liner from the provided revision notes — cover every major point)\n' +
    '7) Weak topics still open and why they need revision (with specific advice)\n' +
    '8) Test performance: average score, recent history and overall readiness\n' +
    '9) Final 10-minute emergency revision list (every must-know formula, definition, and concept — aim for 25-30 items)\n' +
    '10) Common exam mistakes to avoid\n\n' +
    'Return ONLY JSON: {"final_summary":"detailed markdown text with clear section headings and sub-headings"}\n\n' +
    'Base everything ONLY on the provided content. Never invent facts. If something is missing write: "Information not clearly available in the uploaded PDF"\n\n' +
    '<<<PDF_TEXT>>>\n' + input + '\n<<<END_PDF>>>';

  const parsed = await aiOpenai(db, [
    { role: 'system', content: systemPrompt() },
    { role: 'user', content: userMsg },
  ]);

  let content = String(parsed.final_summary || '');
  let canGenerate = true;

  if (content.trim() === '' || isSentinel(parsed)) {
    canGenerate = false;
    content = 'Information not clearly available in the uploaded PDF.';
  }

  if (canGenerate) {
    await db.query(`
      INSERT INTO final_summaries (subject_id, content, word_count)
      VALUES ($1, $2, $3)
      ON CONFLICT (subject_id) DO UPDATE SET content = EXCLUDED.content, word_count = EXCLUDED.word_count, generated_at = NOW()`,
      [subjectId, content, wordCount(content)]);
  }

  return { generated: canGenerate, content, word_count: wordCount(content) };
}

module.exports = { generateFinalSummary };