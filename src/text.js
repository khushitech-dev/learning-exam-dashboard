'use strict';
/**
 * Text structure helpers ported from exam/api/config.php
 * (exam_parse_heading, exam_guess_doc_type, exam_detect_*, exam_slice_chapter_in_doc, ...)
 */

const { normalize, jsonDecode } = require('./util');

// ---------- word count (port of str_word_count) ----------
function wordCount(s) {
  const m = String(s || '').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu);
  return m ? m.length : 0;
}
function strWords(s) { return wordCount(s); }

// ---------- strings ----------
function mbStrlen(s) { return Array.from(String(s || '')).length; }
function mbStrpos(hay, needle, offset = 0) {
  const h = String(hay || '');
  return h.indexOf(needle, offset);
}
function mbStripos(hay, needle) {
  const h = String(hay || '').toLowerCase();
  return h.indexOf(String(needle || '').toLowerCase());
}
function mbSubstr(s, start, len) {
  if (start === undefined) return String(s || '');
  const arr = Array.from(String(s || ''));
  let res = arr.slice(start, len === undefined ? undefined : start + len).join('');
  if (Number.isNaN(len) === false && start < 0) res = arr.slice(arr.length + start).join('');
  return res;
}
function ucfirst(s) {
  s = String(s || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// exam_ai_to_string — flatten model-returned values into a clean string
// ---------------------------------------------------------------------------
function aiToString(value) {
  if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
    const parts = [];
    for (const [k, v] of Object.entries(value)) {
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) {
        const s = aiToString(v);
        if (s !== '') parts.push(s);
      } else if (typeof v === 'string' || typeof v === 'number') {
        const t = String(v).trim();
        if (t !== '') parts.push((typeof k === 'string' ? k + ': ' : '') + t);
      }
    }
    return parts.join('\n').trim();
  }
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

// ---------------------------------------------------------------------------
// exam_split_text — bounded chunks at sentence boundaries
// ---------------------------------------------------------------------------
function splitText(text, maxLen) {
  text = String(text || '').replace(/\s+/g, ' ');
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);
    if (end < text.length) {
      const cut = text.slice(start, end).lastIndexOf('. ');
      if (cut !== -1) end = start + cut + 1;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks.filter(Boolean);
}

// ---------------------------------------------------------------------------
// exam_parse_heading — detect Unit/Chapter/Module/... headings
// ---------------------------------------------------------------------------
const HEADING_TYPES = 'unit|chapter|module|part|lesson|section|topic|session|week';
function parseHeading(line) {
  line = String(line || '').trim();
  if (line === '' || line.length > 160) return null;

  // "XII 3a: Title" — with optional trailing 's'
  let m = line.match(new RegExp(
    '^\\s*(' + HEADING_TYPES + ')s?\\s*[-.:]?\\s*((?:[0-9]+(?:[.\\-][0-9]+)*|[IVXLCDM]+)(?!\\p{L}))\\s*[:.\\-—–]*\\s*(.*)$', 'iu'
  ));
  if (m) {
    let type = m[1].toLowerCase();
    if (type === 'session' || type === 'week' || type === 'class') type = 'module';
    return {
      type: ['unit', 'chapter', 'module', 'section', 'part', 'lesson', 'topic'].includes(type) ? type : 'other',
      no: m[2],
      title: m[3].trim(),
    };
  }

  // "Topic: XYZ" / "UNIT – one" style with word numbers
  m = line.match(new RegExp('^\\s*(' + HEADING_TYPES + ')s?\\s*[:.\\-—–]\\s*(.+)$', 'iu'));
  if (m && line.length < 100) {
    const type = m[1].toLowerCase();
    return {
      type: ['unit', 'chapter', 'module', 'section', 'part', 'lesson', 'topic'].includes(type) ? type : 'other',
      no: '',
      title: m[2].trim(),
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// exam_guess_doc_type
// ---------------------------------------------------------------------------
const DOC_TYPES = ['syllabus', 'textbook', 'notes', 'general'];
function guessDocType(text, originalName) {
  const name = String(originalName || '').toLowerCase();
  const body = String(text || '').toLowerCase();

  if (/syllabus|outline|course\s*(plan|structure)|scheme/i.test(name)) return 'syllabus';
  if (/\bnotes?\b|\bhandout\b|\brevision\b/i.test(name)) return 'notes';
  if (/text\s*book|textbook|\bbook\b|material|lecture/i.test(name)) return 'textbook';

  const markers = [
    'syllabus', 'course outline', 'course structure', 'course objective', 'course outcome',
    'course objectives', 'course outcomes', 'prerequisite', 'prerequisites', 'evaluation scheme',
    'text books', 'textbook', 'reference books', 'reference book', 'unit', 'credit',
  ];
  let markerHits = 0;
  for (const marker of markers) {
    if (body.includes(marker)) markerHits++;
  }

  const lines = String(text || '').split(/\r?\n/);
  let longLines = 0, shortLines = 0;
  for (const line of lines) {
    const len = line.trim().length;
    if (len >= 80) longLines++;
    else if (len >= 8) shortLines++;
  }
  const total = Math.max(1, longLines + shortLines);
  const longRatio = longLines / total;

  if (markerHits >= 3 && longRatio < 0.35) return 'syllabus';
  if (markerHits >= 2 && longRatio < 0.25) return 'syllabus';
  if (longRatio < 0.15 && total >= 20) return 'syllabus';
  return 'textbook';
}

// ---------------------------------------------------------------------------
// exam_detect_topics — numbered sub-sections, "Topic:" lines, bullet items
// ---------------------------------------------------------------------------
function detectTopics(region, limit = 25) {
  const topics = [];
  const seen = new Set();
  const lines = String(region || '').split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (t === '' || t.length > 90) continue;
    if (/^\.{3,}$/.test(t)) continue;
    let topic = null;
    let m = t.match(/^\s*(\d+\.\d+(?:\.\d+)?)\s*[:.\-—–]?\s*(.+)$/);
    if (m) topic = m[2].trim();
    else {
      m = t.match(/^\s*(topic|sub[- ]topic)\s*[:.\-—–]\s*(.+)$/i);
      if (m) topic = m[2].trim();
      else {
        m = t.match(/^[•\-*▪◦◆●]\s+(.+)$/);
        if (m && wordCount(t) < 16) topic = m[1].trim();
      }
    }
    if (topic === null) continue;
    const key = normalize(topic);
    if (topic === '' || seen.has(key)) continue;
    seen.add(key);
    topics.push(topic);
    if (topics.length >= limit) break;
  }
  return topics;
}

// ---------------------------------------------------------------------------
// exam_detect_syllabus_topics — comma-separated syllabus table topics
// ---------------------------------------------------------------------------
function detectSyllabusTopics(region, limit = 25) {
  const topics = [];
  const seen = new Set();
  const lines = String(region || '').split(/\r?\n/);
  const blocks = [];
  let cur = [];
  let stop = false;

  for (const line of lines) {
    const t = line.trim();
    if (t === '') {
      if (cur.length) { blocks.push(cur.join(' ')); cur = []; }
      continue;
    }
    const low = t.toLowerCase();
    if (/\bco\d*\b|credits?|weightage|teaching hours|\bmapping\b|units?\s+no|\bpage\b|\bmarks?\b|experiment|equipment/.test(low)) {
      if (cur.length) { blocks.push(cur.join(' ')); cur = []; }
      continue;
    }
    if (/reference books|suggested (distribution|list)|websites?|major/.test(low)) {
      stop = true;
      break;
    }
    if (/^(faculty|document id|page \d+ of)|^.{0,6}page \d+ of/i.test(low)) {
      if (cur.length) { blocks.push(cur.join(' ')); cur = []; }
      continue;
    }
    if (/^[\d.%()\s]+$/.test(t)) {
      if (cur.length) { blocks.push(cur.join(' ')); cur = []; }
      continue;
    }
    cur.push(t);
    if (cur.length >= 8) { blocks.push(cur.join(' ')); cur = []; }
  }
  if (cur.length) blocks.push(cur.join(' '));

  for (const block of blocks) {
    if ((block.match(/,/g) || []).length < 1) continue;
    const parts = block.split(/[,;]\s+/);
    if (parts.length < 2) continue;
    for (let frag of parts) {
      frag = frag.replace(/[.;,]\s*$/, '').trim();
      if (mbStrlen(frag) < 6 || mbStrlen(frag) > 140) continue;
      const words = wordCount(frag);
      if (words < 2 || words > 14) continue;
      if (/[\d%]/.test(frag)) continue;
      const key = normalize(frag);
      if (key === '' || seen.has(key)) continue;
      seen.add(key);
      topics.push(frag);
      if (topics.length >= limit) return topics;
    }
  }
  return topics;
}

// ---------------------------------------------------------------------------
// exam_detect_line_topics — fallback line-based topic detection
// ---------------------------------------------------------------------------
function detectLineTopics(region, limit = 25) {
  const topics = [];
  const seen = new Set();
  const lines = String(region || '').split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (t === '') continue;
    if (t.length < 3 || t.length > 80) continue;
    if (/^[\d.%()\s]+$/.test(t)) continue;
    if (new RegExp('^(unit|chapter|module|section|part|lesson|topic)s?\\s*[-.:]?\\s*\\d', 'iu').test(t)) continue;
    if (/^(reference|suggested|websites?|major|faculty|page\s+\d|co\d|credits?|weightage|teaching|experiment|equipment)/i.test(t)) continue;
    if (/^\.{3,}$/.test(t)) continue;
    let clean = t.replace(/^[•\-*▪◦◆●]\s+/, '');
    clean = clean.replace(/^\d+[.)]\s+/, '').trim();
    if (clean.length < 3) continue;
    const wc = wordCount(clean);
    if (wc < 1 || wc > 14) continue;
    if (wc === 1 && clean.length < 3) continue;
    if (/[.!?]$/.test(clean) && clean.length > 40) continue;
    const key = normalize(clean);
    if (key === '' || seen.has(key)) continue;
    seen.add(key);
    topics.push(clean);
    if (topics.length >= limit) break;
  }
  return topics;
}

// ---------------------------------------------------------------------------
// exam_line_page_numbers
// ---------------------------------------------------------------------------
function linePageNumbers(lines) {
  const pageAt = {};
  let page = 1;
  lines.forEach((line, i) => {
    const m = String(line).trim().match(/^--- Page (\d+) ---$/i);
    if (m) { page = parseInt(m[1], 10); }
    pageAt[i] = page;
  });
  return pageAt;
}

// ---------------------------------------------------------------------------
// exam_detect_table_units — syllabus table fallback (lone number + heading line)
// ---------------------------------------------------------------------------
function detectTableUnits(lines) {
  const n = lines.length;
  const candidates = [];
  for (let i = 0; i < n - 1; i++) {
    const t = String(lines[i]).trim();
    if (!/^\d{1,2}$/.test(t)) continue;
    const num = parseInt(t, 10);
    if (num < 1 || num > 40) continue;

    const title = String(lines[i + 1]).trim();
    const len = mbStrlen(title);
    if (len < 3 || len > 80) continue;
    if (/[.!?]$/.test(title)) continue;
    if (!/\p{L}{3,}/u.test(title)) continue;
    if (/[\x00-\x1F\x7F]/.test(title)) continue;
    const hasColon = title.indexOf(':') !== -1;
    const colonHeading = title.endsWith(':') || hasColon || len <= 40;
    if (!colonHeading) continue;

    if (/^(topics?|teaching|hours?|weightage|co\b|credits?|marks|sr|unit|name|remarks|experiment|equipment|website|books?)/i.test(title)) continue;

    let cleanTitle = title;
    const colonPos = title.indexOf(':');
    if (colonPos !== -1 && colonPos < mbStrlen(title) - 1) {
      const before = title.slice(0, colonPos).trim();
      if (mbStrlen(before) >= 6) cleanTitle = before;
    }
    cleanTitle = ucfirst(cleanTitle.replace(/\s+/g, ' ').replace(/:\s*$/, '').trim());
    candidates.push({ num, title: cleanTitle, i });
  }

  const pageAt = linePageNumbers(lines);
  const byPage = {};
  for (const c of candidates) {
    const p = pageAt[c.i] || 1;
    (byPage[p] = byPage[p] || []).push(c);
  }
  const pageCounts = {};
  for (const [p, items] of Object.entries(byPage)) {
    items.sort((a, b) => a.num - b.num);
    pageCounts[p] = items.length;
  }
  const total = Object.values(pageCounts).reduce((s, x) => s + x, 0);
  if (total < 2) return [];

  const kept = [];
  for (const [p, items] of Object.entries(byPage)) {
    for (const c of items) {
      const neighbour = items.some((other) =>
        (other.num === c.num - 1 || other.num === c.num + 1) && Math.abs(c.i - other.i) <= 40
      );
      if (neighbour) kept.push(c);
    }
  }
  return kept;
}

// ---------------------------------------------------------------------------
// exam_slice_chapter_in_doc
// ---------------------------------------------------------------------------
function sliceChapterInDoc(docText, chapter) {
  const normalizedTitle = chapter && chapter.title ? normalize(chapter.title) : '';
  const wantType = chapter.unit_type || 'other';
  const wantNo = chapter.unit_no || '';

  const lines = String(docText || '').split(/\r?\n/);
  const n = lines.length;

  let startIdx = -1;
  for (let i = 0; i < n; i++) {
    const h = parseHeading(lines[i]);
    if (h === null) continue;
    const titleMatch = normalizedTitle !== '' && normalize(h.title) === normalizedTitle;
    const numMatch = wantNo !== '' && String(h.no || '').toLowerCase() === String(wantNo).toLowerCase() && h.type === wantType;
    if (titleMatch || numMatch) { startIdx = i; break; }
  }

  if (startIdx === -1 && normalizedTitle !== '') {
    const needle = normalizedTitle.slice(0, 40);
    for (let i = 0; i < n; i++) {
      const lineNorm = normalize(lines[i]);
      if (lineNorm !== '' && lineNorm.indexOf(needle) !== -1 && lineNorm.length < 120) {
        startIdx = i;
        break;
      }
    }
  }

  if (startIdx === -1) return '';

  let endIdx = n;
  const startNorm = normalize(lines[startIdx]);
  for (let i = startIdx + 1; i < n; i++) {
    const h = parseHeading(lines[i]);
    if (h !== null && normalize(lines[i]) !== startNorm) { endIdx = i; break; }
  }

  return lines.slice(startIdx, endIdx).join('\n');
}

// ---------------------------------------------------------------------------
// exam_normalize_exam_important
// ---------------------------------------------------------------------------
function normalizeExamImportant(items) {
  const out = [];
  for (const it of items || []) {
    if (it === null || typeof it !== 'object') continue;
    if (!it.priority || !['very_high', 'high', 'medium'].includes(it.priority)) it.priority = 'high';
    out.push(it);
  }
  return out;
}

// ---------------------------------------------------------------------------
// exam_sentinel_response
// ---------------------------------------------------------------------------
const SENTINEL = 'Information not clearly available in the uploaded PDF';
function isSentinel(parsed) {
  if (typeof parsed === 'string') return parsed.indexOf(SENTINEL) !== -1;
  let found = false;
  (function walk(v) {
    if (found) return;
    if (typeof v === 'string') { if (v.indexOf(SENTINEL) !== -1) found = true; return; }
    if (Array.isArray(v) || (v !== null && typeof v === 'object')) {
      for (const x of Object.values(v)) walk(x);
    }
  })(parsed);
  return found;
}

// ---------------------------------------------------------------------------
// exam_collect_chapter_text / exam_collect_subject_text (db-backed)
// ---------------------------------------------------------------------------
async function collectChapterText(db, chapter) {
  const subjectId = Number(chapter.subject_id || 0);
  const docs = await db.query(
    `SELECT id, doc_type, original_name, full_text FROM subject_documents
     WHERE subject_id = $1 AND status = 'ready' ORDER BY id ASC`, [subjectId]
  );
  const parts = [];
  let found = false;
  let docCount = 0;
  for (const doc of docs) {
    docCount++;
    const text = String(doc.full_text || '');
    if (text.trim().length < 30) continue;
    const slice = sliceChapterInDoc(text, chapter);
    if (slice === '' || slice.trim().length < 30) continue;
    found = true;
    const typeLabel = { syllabus: 'Syllabus', textbook: 'Textbook', notes: 'Notes', general: 'Study material' }[doc.doc_type] || 'Study material';
    parts.push('[Source: ' + doc.original_name + ' - ' + typeLabel + ']\n\n' + slice);
  }

  if (!found && docCount === 1) {
    for (const doc of docs) {
      const text = String(doc.full_text || '');
      if (text.trim().length >= 30) return text;
      break;
    }
  }

  if (!found) {
    // Legacy content_jobs payload fallback
    const stmt = await db.query(`SELECT payload FROM content_jobs WHERE category_id = $1 AND job_type = 'chapters' ORDER BY id DESC LIMIT 1`, [subjectId]);
    const full = stmt[0] && stmt[0].payload;
    if (full && String(full).length >= 30) return String(full);
    return '';
  }

  let combined = parts.join('\n\n---oOo---\n\n');
  if (combined.length > 32000) {
    combined = combined.slice(0, 20000) + '\n\n[-- truncated --]\n\n' + combined.slice(-12000);
  }
  return combined;
}

async function collectSubjectText(db, subjectId) {
  const docs = await db.query(
    `SELECT original_name, full_text FROM subject_documents WHERE subject_id = $1 AND status = 'ready' ORDER BY id ASC`, [subjectId]
  );
  const parts = [];
  for (const doc of docs) {
    const text = String(doc.full_text || '');
    if (text.trim().length < 30) continue;
    parts.push('[Source: ' + doc.original_name + ']\n\n' + text);
  }
  if (parts.length === 0) {
    const stmt = await db.query(`SELECT payload FROM content_jobs WHERE category_id = $1 AND job_type = 'chapters' ORDER BY id DESC LIMIT 1`, [subjectId]);
    const legacy = stmt[0] && stmt[0].payload;
    return String(legacy || '');
  }
  let combined = parts.join('\n\n---oOo---\n\n');
  if (combined.length > 32000) {
    combined = combined.slice(0, 20000) + '\n\n[-- truncated --]\n\n' + combined.slice(-12000);
  }
  return combined;
}

module.exports = {
  wordCount,
  mbStrlen, mbStrpos, mbStripos, mbSubstr, ucfirst,
  aiToString,
  splitText,
  parseHeading,
  guessDocType,
  detectTopics,
  detectSyllabusTopics,
  detectLineTopics,
  linePageNumbers,
  detectTableUnits,
  sliceChapterInDoc,
  normalizeExamImportant,
  isSentinel, SENTINEL,
  collectChapterText,
  collectSubjectText,
  jsonDecode,
};