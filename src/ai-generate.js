'use strict';
/**
 * Shared AI Content Generation library ported from exam/api/ai_generate.php.
 * Used by summaries / chapters(regenerate) / questions endpoints.
 */
const { DomainException, aiOpenai } = require('./ai');
const { jsonEncode, jsonDecode, log } = require('./util');
const {
  aiToString, splitText, normalizeExamImportant, isSentinel, SENTINEL,
  collectChapterText,
} = require('./text');
const {
  systemPrompt, topicSystemPrompt, aiGeneratedLabel,
  summaryUserPrompt, summaryConsolidatePrompt, contentUserPrompt,
  syllabusStudyUserPrompt, questionBatchUserPrompt,
} = require('./prompts');

const CONTENT_COLS = [
  'easy_explanation', 'simple_explanation', 'definitions_json', 'important_points_json',
  'key_terms_json', 'exam_important_json', 'examples_json', 'theory_json', 'revision_notes',
  'memory_tricks_json', 'exam_answers_json', 'differences_json',
];

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
async function generateSummary(db, rawText, chapter, subjectName, syllabusOnly = false) {
  const chunks = splitText(rawText, 6000);
  const chunkSummaries = [];

  const modeNote = syllabusOnly
    ? 'This text is a SYLLABUS/OUTLINE for the subject. Summarize ONLY the syllabus coverage and the units/topics it lists. Do NOT write detailed theory, definitions or explanations that are not present in the text.'
    : 'Write a detailed, exam-ready chapter summary.';

  for (const chunk of chunks) {
    const parsed = await aiOpenai(db, [
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: summaryUserPrompt(chapter.title, subjectName, modeNote, chunk) },
    ]);
    chunkSummaries.push(parsed);
  }

  if (chunkSummaries.length === 1) return chunkSummaries[0];

  const combined = chunkSummaries.map((cs) => (cs.summary || '') + '\n\n').join('');
  return await aiOpenai(db, [
    { role: 'system', content: systemPrompt() },
    { role: 'user', content: summaryConsolidatePrompt(combined) },
  ]);
}

// ---------------------------------------------------------------------------
// STUDY CONTENT (definitions, points, terms, exam-important, examples, theory, revision)
// ---------------------------------------------------------------------------
async function generateContent(db, rawText, chapter, subjectName) {
  const chunks = splitText(rawText, 6000);
  const merged = {
    definitions: [], important_points: [], key_terms: [], exam_important: [], examples: [],
    theory: '', revision_notes: '',
  };
  const seenDefs = new Set();
  const seenPoints = new Set();

  for (const chunk of chunks) {
    const parsed = await aiOpenai(db, [
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: contentUserPrompt(chapter.title, subjectName, chunk) },
    ]);

    for (const key of ['definitions', 'important_points', 'key_terms', 'exam_important', 'examples']) {
      const items = Array.isArray(parsed[key]) ? parsed[key] : [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        if (key === 'definitions') {
          const term = String(item.term || '').trim().toLowerCase();
          if (term === '' || seenDefs.has(term)) continue;
          seenDefs.add(term);
        }
        if (key === 'important_points') {
          const point = String(item.point || '').trim();
          const pk = point.toLowerCase();
          if (point === '' || seenPoints.has(pk)) continue;
          seenPoints.add(pk);
        }
        merged[key].push(item);
      }
    }
    const chunkTheory = String(parsed.theory || '').trim();
    if (chunkTheory !== '' && chunkTheory.indexOf('Information not clearly available') === -1) {
      merged.theory += (merged.theory !== '' ? '\n\n' : '') + chunkTheory;
    }
    const chunkRev = String(parsed.revision_notes || '').trim();
    if (chunkRev !== '' && chunkRev.indexOf('Information not clearly available') === -1) {
      merged.revision_notes += (merged.revision_notes !== '' ? '\n' : '') + chunkRev;
    }
  }

  merged.definitions = merged.definitions.slice(0, 20);
  merged.important_points = merged.important_points.slice(0, 25);
  merged.key_terms = merged.key_terms.slice(0, 20);
  merged.exam_important = normalizeExamImportant(merged.exam_important.slice(0, 12));
  merged.examples = merged.examples.slice(0, 8);
  merged.revision_notes = merged.revision_notes.trim();

  return merged;
}

// ---------------------------------------------------------------------------
// SYLLABUS-ONLY CHAPTER STUDY (per-topic in study_topics + questions)
// ---------------------------------------------------------------------------
async function generateSyllabusStudy(db, chapter, topics, subjectName) {
  const label = aiGeneratedLabel();

  const merged = { definitions: [], important_points: [], key_terms: [], exam_important: [], examples: [] };
  const summaryParts = [], theoryParts = [], revisionParts = [], simpleParts = [], memoryParts = [], answerParts = [], diffParts = [];
  let questionsInserted = 0;
  const seenDef = new Set(), seenPoint = new Set();

  async function insertTopicRow(topic, cols) {
    const topicQuery = await db.query('SELECT COALESCE(MAX(topic_no),0)+1 AS n FROM study_topics WHERE chapter_id = $1', [chapter.id]);
    const nextNo = Number(topicQuery[0].n);
    await db.query(`
      INSERT INTO study_topics (subject_id, chapter_id, topic, topic_no, summary, simple_explanation,
        definitions_json, theory, important_points_json, key_terms_json, exam_important_json,
        examples_json, revision_notes, memory_trick, exam_answers_json, differences_json,
        important_questions_json, question_answers_json, ai_generated, generated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,1,NOW())
      ON CONFLICT (chapter_id, topic) DO UPDATE SET
        subject_id = EXCLUDED.subject_id,
        summary = EXCLUDED.summary,
        simple_explanation = EXCLUDED.simple_explanation,
        definitions_json = EXCLUDED.definitions_json,
        theory = EXCLUDED.theory,
        important_points_json = EXCLUDED.important_points_json,
        key_terms_json = EXCLUDED.key_terms_json,
        exam_important_json = EXCLUDED.exam_important_json,
        examples_json = EXCLUDED.examples_json,
        revision_notes = EXCLUDED.revision_notes,
        memory_trick = EXCLUDED.memory_trick,
        exam_answers_json = EXCLUDED.exam_answers_json,
        differences_json = EXCLUDED.differences_json,
        important_questions_json = EXCLUDED.important_questions_json,
        question_answers_json = EXCLUDED.question_answers_json,
        ai_generated = 1,
        generated_at = NOW()`,
      [chapter.subject_id, chapter.id, topic, nextNo].concat(cols)
    );
  }

  function processTopic(topic, parsed) {
    const defs = Array.isArray(parsed.definitions) ? parsed.definitions : [];
    const points = Array.isArray(parsed.important_points) ? parsed.important_points : [];
    const terms = Array.isArray(parsed.key_terms) ? parsed.key_terms : [];
    const examImp = normalizeExamImportant(Array.isArray(parsed.exam_important) ? parsed.exam_important : []);
    const examples = Array.isArray(parsed.examples) ? parsed.examples : [];
    const qs = Array.isArray(parsed.questions) ? parsed.questions : [];

    const simple = aiToString(parsed.simple_explanation || '');
    const memory = aiToString(parsed.memory_trick || '');
    const examAnswers = Array.isArray(parsed.exam_answers)
      ? parsed.exam_answers.filter((a) => a && typeof a === 'object' && String(a.answer || '').trim() !== '')
      : [];
    const diffs = Array.isArray(parsed.differences)
      ? parsed.differences.filter((d) => d && typeof d === 'object' && String(d.a || '').trim() !== '')
      : [];

    for (const d of defs) {
      const term = String((d && d.term) || '').trim().toLowerCase();
      if (term === '' || seenDef.has(term)) continue;
      seenDef.add(term);
      merged.definitions.push(d);
    }
    for (const p of points) {
      const pt = String((p && p.point) || '').trim();
      const pk = pt.toLowerCase();
      if (pt === '' || seenPoint.has(pk)) continue;
      seenPoint.add(pk);
      merged.important_points.push(p);
    }
    for (const [mk, items] of Object.entries({ key_terms: terms, exam_important: examImp, examples })) {
      for (const it of items) if (it && typeof it === 'object') merged[mk].push(it);
    }

    const summary = aiToString(parsed.summary || '');
    const theory = aiToString(parsed.theory || '');
    const revision = aiToString(parsed.revision_notes || '');
    if (summary !== '') summaryParts.push('## ' + topic + '\n' + summary);
    if (theory !== '') theoryParts.push('## ' + topic + '\n' + theory);
    if (revision !== '') revisionParts.push('## ' + topic + '\n' + revision);
    if (simple !== '') simpleParts.push('## ' + topic + '\n' + simple);
    if (memory !== '') memoryParts.push({ topic, trick: memory });
    if (examAnswers.length) answerParts.push({ topic, answers: examAnswers });
    if (diffs.length) diffParts.push({ topic, differences: diffs });

    return {
      topic, summary, simple, theory, revision, memory,
      defs, points, terms, examImp, examples, examAnswers, diffs, qs,
    };
  }

  async function persistTopic(topic, row) {
    await insertTopicRow(topic, [
      row.summary, row.simple,
      jsonEncode(row.defs), row.theory,
      jsonEncode(row.points), jsonEncode(row.terms), jsonEncode(row.examImp), jsonEncode(row.examples),
      row.revision, row.memory, jsonEncode(row.examAnswers), jsonEncode(row.diffs),
      jsonEncode(row.qs), jsonEncode(row.qs),
    ]);

    for (const q of row.qs) {
      if (!q || typeof q !== 'object') continue;
      const text = String(q.question_text || '').trim();
      const answer = String(q.correct_answer || '').trim();
      if (text === '' || answer === '') continue;
      const type = ['mcq', 'definition', 'concept', 'short_answer', 'true_false', 'long_answer'].includes(q.type) ? q.type : 'short_answer';
      let options = [];
      if (type === 'mcq') {
        options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
        if (options.length !== 4 || !options.includes(answer)) continue;
      }
      const res = await db.insertIgnore(
        `INSERT INTO questions (chapter_id, question_type, question_text, options_json, correct_answer, explanation, topic)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (chapter_id, question_text) DO NOTHING`,
        [chapter.id, type, text, type === 'mcq' ? jsonEncode(options) : '[]', answer, String(q.explanation || '').trim(), topic]
      );
      if (res.rowCount > 0) questionsInserted++;
    }
  }

  const topicList = topics.map((t) => String(t).trim()).filter((t) => t !== '');
  const batchSize = 4;

  for (let bi = 0; bi < topicList.length; bi += batchSize) {
    const batch = topicList.slice(bi, bi + batchSize);
    const numbered = batch.map((t, i) => (i + 1) + '. ' + t).join('\n');
    const parsed = await aiOpenai(db, [
      { role: 'system', content: topicSystemPrompt() },
      { role: 'user', content: syllabusStudyUserPrompt(subjectName, chapter.title, numbered) },
    ]);

    let results = Array.isArray(parsed.results) ? parsed.results : [];
    if (!Array.isArray(results)) results = [];

    for (let i = 0; i < batch.length; i++) {
      const topic = batch[i];
      let match = null;
      for (const r of results) {
        if (r && typeof r === 'object' && String(r.topic || '').trim() === topic) { match = r; break; }
      }
      if (!match) {
        for (const r of results) {
          if (r && typeof r === 'object' && String(r.topic || '').trim().toLowerCase() === topic.toLowerCase()) { match = r; break; }
        }
      }
      if (!match) {
        const normTopic = topic.toLowerCase();
        for (const r of results) {
          if (!r || typeof r !== 'object') continue;
          const normR = String(r.topic || '').trim().toLowerCase();
          if (normR !== '' && (normR.indexOf(normTopic) !== -1 || normTopic.indexOf(normR) !== -1)) { match = r; break; }
        }
      }
      if (!match && results.length === batch.length && results[i]) match = results[i];
      if (!match || typeof match !== 'object') match = {};

      const clean = Object.assign({}, match);
      delete clean.topic;
      const row = processTopic(topic, clean || {});
      await persistTopic(topic, row);
    }
  }

  return {
    easy_explanation: label + '\n\n' + summaryParts.join('\n\n'),
    simple_explanation: label + '\n\n' + simpleParts.join('\n\n'),
    definitions_json: jsonEncode(merged.definitions),
    important_points_json: jsonEncode(merged.important_points),
    key_terms_json: jsonEncode(merged.key_terms),
    exam_important_json: jsonEncode(merged.exam_important),
    examples_json: jsonEncode(merged.examples),
    theory_json: label + '\n\n' + theoryParts.join('\n\n'),
    revision_notes: revisionParts.join('\n').trim(),
    memory_tricks_json: jsonEncode(memoryParts),
    exam_answers_json: jsonEncode(answerParts),
    differences_json: jsonEncode(diffParts),
    questions_generated: questionsInserted,
  };
}

// ---------------------------------------------------------------------------
// QUESTION BATCHES
// ---------------------------------------------------------------------------
const TYPE_LABELS = {
  mcq: 'multiple-choice',
  definition: 'definition',
  concept: 'conceptual',
  short_answer: 'short-answer',
  long_answer: 'long-answer (explain / describe / differentiate)',
};

async function generateQuestionBatch(db, chapterId, type, countPerType, instruction, system) {
  const label = TYPE_LABELS[type] || 'short-answer';
  const parsed = await aiOpenai(db, [
    { role: 'system', content: system },
    { role: 'user', content: questionBatchUserPrompt(instruction, countPerType, type, label) },
  ]);

  let questions = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (!Array.isArray(questions)) questions = [];

  let cnt = 0;
  for (const q of questions) {
    if (!q || typeof q !== 'object') continue;
    const text = String(q.question_text || '').trim();
    const answer = String(q.correct_answer || '').trim();
    if (text === '' || answer === '') continue;

    let options = [];
    if (type === 'mcq') {
      const opts = Array.isArray(q.options) ? q.options : [];
      let cleanOpts = opts.slice(0, 4).map((o) => String(o).trim()).filter((o) => o !== '');
      if (cleanOpts.length !== 4 || !cleanOpts.includes(answer)) continue;
      options = cleanOpts;
    }

    const explanation = String(q.explanation || '').trim();
    const topic = String(q.topic || '').trim();
    const res = await db.insertIgnore(
      `INSERT INTO questions (chapter_id, question_text, question_type, options_json, correct_answer, explanation, topic)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (chapter_id, question_text) DO NOTHING`,
      [chapterId, text, type, jsonEncode(options), answer, explanation, topic || 'General']
    );
    if (res.rowCount > 0) cnt++;
  }
  return cnt;
}

async function generateChapterQuestions(db, chapterId, types = ['mcq', 'definition', 'concept', 'short_answer', 'long_answer'], countPerType = 3) {
  const rows = await db.query('SELECT c.title, c.subject_id, c.content_level, c.topics_json FROM chapters c WHERE c.id = $1', [chapterId]);
  const chapterData = rows[0];
  if (!chapterData) throw new DomainException('Chapter not found.', 404);

  const subj = await db.query('SELECT name FROM subjects WHERE id = $1', [chapterData.subject_id]);
  const subjectName = String(subj[0] ? subj[0].name : '');

  const syllabusOnly = chapterData.content_level === 'syllabus';
  let system, instruction;

  if (syllabusOnly) {
    const topics = jsonDecode(chapterData.topics_json || '[]', []);
    if (!topics.length) throw new DomainException('No topics detected for this chapter.', 400);
    system = topicSystemPrompt();
    const topicListStr = '- ' + topics.slice(0, 40).join('\n- ');
    instruction = `Subject: ${subjectName}\nChapter/Unit: ${chapterData.title}\n\nGenerate study challenges for the syllabus topics below. Create exactly ${countPerType} questions per requested type. Every question must test one of the topics, and be answerable from a correct explanation of that topic (this is AI-generated, syllabus-topic-based study material).\n\nSyllabus topics:\n${topicListStr}`;
  } else {
    const rawText = await collectChapterText(db, chapterData);
    if (rawText.length < 30) {
      throw new DomainException('No readable PDF text available. Information not clearly available in the uploaded PDF.', 400);
    }
    system = systemPrompt();
    instruction = `Chapter: ${chapterData.title}\nSubject: ${subjectName}`;
  }

  let inserted = 0;
  for (const type of types) {
    if (typeof type !== 'string') continue;
    inserted += await generateQuestionBatch(db, chapterId, type, countPerType, instruction, system);
  }
  return inserted;
}

// ---------------------------------------------------------------------------
// MAIN ORCHESTRATOR (summaries POST + chapters regenerate)
// ---------------------------------------------------------------------------
async function generateChapterContent(db, chapterId, force = false) {
  const rows = await db.query(
    `SELECT c.*, s.name AS subject_name FROM chapters c JOIN subjects s ON s.id = c.subject_id WHERE c.id = $1`, [chapterId]
  );
  const chapter = rows[0];
  if (!chapter) throw new DomainException('Chapter not found.', 404);

  log('gen_start', 'Starting chapter content generation', {
    chapter_id: chapterId, subject: chapter.subject_name, title: chapter.title,
    content_level: chapter.content_level, force: force ? 'yes' : 'no',
  });

  const contentRows = await db.query('SELECT * FROM chapter_content WHERE chapter_id = $1', [chapterId]);
  const existing = contentRows[0] || {};

  if (force) {
    await db.query('DELETE FROM chapter_content WHERE chapter_id = $1', [chapterId]);
    await db.query('DELETE FROM questions WHERE chapter_id = $1', [chapterId]);
    await db.query('DELETE FROM study_topics WHERE chapter_id = $1', [chapterId]);
    for (const f of CONTENT_COLS) existing[f] = null;
  }

  const syllabusOnly = chapter.content_level === 'syllabus';
  const subjectName = String(chapter.subject_name);
  const responses = {};
  let rawText = '';
  let questionsGenerated = 0;

  const hasSummary = !!(existing.easy_explanation && existing.summary_ready) &&
    String(existing.easy_explanation || '').indexOf('Syllabus outline for this unit') === -1;
  const hasContent = !!(existing.definitions_json && existing.definitions_json !== '[]' &&
    existing.content_ready && existing.theory_json);

  if (!force && hasSummary && hasContent) {
    const st = await db.query('SELECT COUNT(*)::int AS c FROM study_topics WHERE chapter_id = $1', [chapterId]);
    return {
      chapter_content: existing,
      questions_generated: 0,
      study_topics_generated: st[0].c,
    };
  }

  if (syllabusOnly) {
    let topics = jsonDecode(chapter.topics_json || '[]', []);
    if (!topics.length) {
      rawText = await collectChapterText(db, chapter);
      if (String(rawText).trim().length > 30) {
        let detected = [];
        try { detected = await detectSyllabusTopicsFromText(rawText, 40); } catch (e) {}
        if (detected.length) {
          topics = detected;
          await db.query('UPDATE chapters SET topics_json = $1 WHERE id = $2',
            [jsonEncode(topics.slice(0, 40)), chapterId]);
        }
      }
    }
    topics = topics.map((t) => String(t).trim()).filter((t) => t !== '');
    if (!topics.length) {
      throw new DomainException('No syllabus topics detected for this chapter. The syllabus unit must list its topics before study material can be generated.', 400);
    }

    log('gen_topics', 'Topics ready for generation', { chapter_id: chapterId, topic_count: topics.length });

    const study = await generateSyllabusStudy(db, chapter, topics.slice(0, 40), subjectName);
    questionsGenerated = Number(study.questions_generated || 0);
    delete study.questions_generated;
    for (const [k, v] of Object.entries(study)) responses[k] = v;

    rawText = 'Syllabus topics for the unit "' + chapter.title + '" (subject: ' + subjectName + '):\n- ' + topics.slice(0, 40).join('\n- ');
  } else {
    rawText = await collectChapterText(db, chapter);
    if (String(rawText).trim().length < 30) {
      throw new DomainException('No readable PDF text available for this chapter. Information not clearly available in the uploaded PDF.', 400);
    }

    const hasSum = !!(existing.easy_explanation && existing.summary_ready) &&
      String(existing.easy_explanation || '').indexOf('Syllabus outline for this unit') === -1;
    const hasCont = !!(existing.definitions_json && existing.definitions_json !== '[]' && existing.content_ready);

    if (!hasSum) {
      const summary = await generateSummary(db, rawText, chapter, subjectName, false);
      responses.easy_explanation = String(summary.summary || '');
    }
    if (!hasCont) {
      const content = await generateContent(db, rawText, chapter, subjectName);
      responses.definitions_json = jsonEncode(content.definitions || []);
      responses.important_points_json = jsonEncode(content.important_points || []);
      responses.key_terms_json = jsonEncode(content.key_terms || []);
      responses.exam_important_json = jsonEncode(content.exam_important || []);
      responses.examples_json = jsonEncode(content.examples || []);
      responses.theory_json = String(content.theory || '');
      responses.revision_notes = String(content.revision_notes || '');
      responses.simple_explanation = '';
      responses.memory_tricks_json = jsonEncode([]);
      responses.exam_answers_json = jsonEncode([]);
      responses.differences_json = jsonEncode([]);
    }

    if (force) {
      questionsGenerated = await generateChapterQuestions(db, chapterId);
    }
  }

  const state = {};
  for (const f of CONTENT_COLS) {
    state[f] = (responses[f] !== undefined && responses[f] !== null) ? responses[f] : (existing[f] ?? null);
  }

  const summaryReady = String(state.easy_explanation || '').trim() !== '' ? 1 : 0;
  const contentReady = (String(state.definitions_json || '').trim() !== '' && state.definitions_json !== '[]') ? 1 : Number(existing.content_ready || 0);

  await db.query(`
    INSERT INTO chapter_content (chapter_id, easy_explanation, simple_explanation, definitions_json, important_points_json,
      key_terms_json, exam_important_json, examples_json, theory_json, revision_notes,
      memory_tricks_json, exam_answers_json, differences_json, raw_text, content_ready, summary_ready, last_generated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
    ON CONFLICT (chapter_id) DO UPDATE SET
      easy_explanation = EXCLUDED.easy_explanation,
      simple_explanation = EXCLUDED.simple_explanation,
      definitions_json = EXCLUDED.definitions_json,
      important_points_json = EXCLUDED.important_points_json,
      key_terms_json = EXCLUDED.key_terms_json,
      exam_important_json = EXCLUDED.exam_important_json,
      examples_json = EXCLUDED.examples_json,
      theory_json = EXCLUDED.theory_json,
      revision_notes = EXCLUDED.revision_notes,
      memory_tricks_json = EXCLUDED.memory_tricks_json,
      exam_answers_json = EXCLUDED.exam_answers_json,
      differences_json = EXCLUDED.differences_json,
      raw_text = EXCLUDED.raw_text,
      content_ready = EXCLUDED.content_ready,
      summary_ready = EXCLUDED.summary_ready,
      last_generated_at = NOW()`,
    [
      chapterId,
      state.easy_explanation ?? '', state.simple_explanation ?? '',
      state.definitions_json ?? '[]', state.important_points_json ?? '[]',
      state.key_terms_json ?? '[]', state.exam_important_json ?? '[]',
      state.examples_json ?? '[]', state.theory_json ?? '', state.revision_notes ?? '',
      state.memory_tricks_json ?? '[]', state.exam_answers_json ?? '[]',
      state.differences_json ?? '[]', rawText, contentReady, summaryReady,
    ]
  );

  const saved = await db.query('SELECT * FROM chapter_content WHERE chapter_id = $1', [chapterId]);
  const st = await db.query('SELECT COUNT(*)::int AS c FROM study_topics WHERE chapter_id = $1', [chapterId]);

  return {
    chapter_content: saved[0] || {},
    questions_generated: questionsGenerated,
    study_topics_generated: st[0].c,
  };
}

// Imported lazily from text.js by the syllabus path above.
const { detectSyllabusTopics, detectLineTopics } = require('./text');
async function detectSyllabusTopicsFromText(rawText, limit) {
  let detected = detectSyllabusTopics(rawText, limit);
  if (!detected.length) detected = detectLineTopics(rawText, limit);
  return detected;
}

module.exports = {
  CONTENT_COLS,
  generateSummary,
  generateContent,
  generateSyllabusStudy,
  generateQuestionBatch,
  generateChapterQuestions,
  generateChapterContent,
};