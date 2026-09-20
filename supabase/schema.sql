-- ============================================================
-- Exam Study Dashboard - Supabase (PostgreSQL) Schema
--
-- Port of exam/api/init_db.php (MySQL) to PostgreSQL.
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- ============================================================

-- ---------- updated_at trigger helper ----------
CREATE OR REPLACE FUNCTION exam_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Subjects ----------
CREATE TABLE IF NOT EXISTS subjects (
  id                BIGSERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  pdf_filename      TEXT NOT NULL DEFAULT 'pending',
  pdf_original_name TEXT NOT NULL DEFAULT '',
  pdf_path          TEXT NOT NULL DEFAULT '',
  total_chapters    INTEGER NOT NULL DEFAULT 0,
  file_size         BIGINT DEFAULT NULL,
  page_count        INTEGER DEFAULT NULL,
  status            TEXT NOT NULL DEFAULT 'processing'
                    CHECK (status IN ('processing','ready','failed','needs_detection')),
  doc_count         INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_subject_pdf ON subjects (pdf_filename);
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION exam_set_updated_at();

-- ---------- Chapters ----------
CREATE TABLE IF NOT EXISTS chapters (
  id             BIGSERIAL PRIMARY KEY,
  subject_id     BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  order_index    INTEGER NOT NULL DEFAULT 0,
  start_page     INTEGER DEFAULT NULL,
  end_page       INTEGER DEFAULT NULL,
  status         TEXT NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started','studying','test_pending','needs_revision','completed')),
  summary_viewed INTEGER NOT NULL DEFAULT 0,
  progress       NUMERIC(5,2) NOT NULL DEFAULT 0,
  org_label      TEXT DEFAULT NULL,
  unit_type      TEXT NOT NULL DEFAULT 'other'
                 CHECK (unit_type IN ('unit','chapter','module','section','part','lesson','topic','other')),
  unit_no        TEXT DEFAULT NULL,
  topics_json    TEXT DEFAULT NULL,
  content_level  TEXT NOT NULL DEFAULT 'detailed'
                 CHECK (content_level IN ('syllabus','detailed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_chapter_order ON chapters (subject_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters (subject_id);
CREATE TRIGGER trg_chapters_updated BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION exam_set_updated_at();

-- ---------- Chapter Content ----------
CREATE TABLE IF NOT EXISTS chapter_content (
  id                    BIGSERIAL PRIMARY KEY,
  chapter_id            BIGINT NOT NULL UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  easy_explanation      TEXT,
  simple_explanation    TEXT,
  definitions_json      TEXT,
  important_points_json TEXT,
  key_terms_json        TEXT,
  exam_important_json   TEXT,
  examples_json         TEXT,
  theory_json           TEXT,
  revision_notes        TEXT,
  memory_tricks_json    TEXT,
  exam_answers_json     TEXT,
  differences_json      TEXT,
  raw_text              TEXT,
  content_ready         INTEGER NOT NULL DEFAULT 0,
  summary_ready         INTEGER NOT NULL DEFAULT 0,
  last_generated_at     TIMESTAMPTZ DEFAULT NULL,
  generated_by          TEXT NOT NULL DEFAULT 'openai'
);

-- ---------- Study Topics (syllabus-based per-topic study material) ----------
CREATE TABLE IF NOT EXISTS study_topics (
  id                        BIGSERIAL PRIMARY KEY,
  subject_id                BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id                BIGINT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic                     TEXT NOT NULL,
  topic_no                  INTEGER NOT NULL DEFAULT 0,
  summary                   TEXT,
  simple_explanation        TEXT,
  definitions_json          TEXT,
  theory                    TEXT,
  important_points_json     TEXT,
  key_terms_json            TEXT,
  exam_important_json       TEXT,
  examples_json             TEXT,
  revision_notes            TEXT,
  memory_trick              TEXT,
  exam_answers_json         TEXT,
  differences_json          TEXT,
  important_questions_json  TEXT,
  question_answers_json     TEXT,
  ai_generated              INTEGER NOT NULL DEFAULT 1,
  generated_at              TIMESTAMPTZ DEFAULT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_study_topic ON study_topics (chapter_id, topic);

-- ---------- Questions ----------
CREATE TABLE IF NOT EXISTS questions (
  id             BIGSERIAL PRIMARY KEY,
  chapter_id     BIGINT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  question_type  TEXT NOT NULL DEFAULT 'mcq'
                 CHECK (question_type IN ('mcq','definition','concept','short_answer','true_false','long_answer')),
  options_json   TEXT,
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  topic          TEXT,
  source_text    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions (chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (question_type);
CREATE UNIQUE INDEX IF NOT EXISTS uq_question_text ON questions (chapter_id, question_text);

-- ---------- Test Config ----------
CREATE TABLE IF NOT EXISTS test_config (
  id                 BIGSERIAL PRIMARY KEY,
  chapter_id         BIGINT NOT NULL UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  passing_score      NUMERIC(5,2) NOT NULL DEFAULT 60.00,
  questions_per_test INTEGER NOT NULL DEFAULT 10,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_testconfig_updated BEFORE UPDATE ON test_config
  FOR EACH ROW EXECUTE FUNCTION exam_set_updated_at();

-- ---------- Test Attempts ----------
CREATE TABLE IF NOT EXISTS test_attempts (
  id              BIGSERIAL PRIMARY KEY,
  chapter_id      BIGINT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  subject_id      BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  percentage      NUMERIC(6,2) NOT NULL,
  passed          INTEGER NOT NULL DEFAULT 0,
  passing_score   NUMERIC(5,2) NOT NULL,
  answers_json    TEXT NOT NULL,
  weak_topics_json TEXT,
  test_type       TEXT NOT NULL DEFAULT 'full'
                  CHECK (test_type IN ('full','retest','subject')),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_subject ON test_attempts (subject_id);
CREATE INDEX IF NOT EXISTS idx_attempts_chapter ON test_attempts (chapter_id);
CREATE INDEX IF NOT EXISTS idx_attempts_ts ON test_attempts (timestamp);

-- ---------- Weak Topics ----------
CREATE TABLE IF NOT EXISTS weak_topics (
  id             BIGSERIAL PRIMARY KEY,
  chapter_id     BIGINT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  subject_id     BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_name     TEXT NOT NULL,
  why_weak       TEXT,
  revision_notes TEXT,
  retested       INTEGER NOT NULL DEFAULT 0,
  retest_score   NUMERIC(6,2) DEFAULT NULL,
  status         TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','revising','retested_now','resolved')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_weak ON weak_topics (subject_id, chapter_id, topic_name);
CREATE INDEX IF NOT EXISTS idx_weak_status ON weak_topics (subject_id, status);
CREATE TRIGGER trg_weak_updated BEFORE UPDATE ON weak_topics
  FOR EACH ROW EXECUTE FUNCTION exam_set_updated_at();

-- ---------- Chapter Completion ----------
CREATE TABLE IF NOT EXISTS chapter_completion (
  id             BIGSERIAL PRIMARY KEY,
  chapter_id     BIGINT NOT NULL UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  subject_id     BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  final_score    NUMERIC(6,2) NOT NULL,
  attempts_count INTEGER NOT NULL DEFAULT 1
);

-- ---------- Subject Progress ----------
CREATE TABLE IF NOT EXISTS subject_progress (
  id                 BIGSERIAL PRIMARY KEY,
  subject_id         BIGINT NOT NULL UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
  total_chapters     INTEGER NOT NULL DEFAULT 0,
  completed_chapters INTEGER NOT NULL DEFAULT 0,
  avg_score          NUMERIC(6,2) NOT NULL DEFAULT 0,
  overall_progress   NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON subject_progress
  FOR EACH ROW EXECUTE FUNCTION exam_set_updated_at();

-- ---------- Final Summaries ----------
CREATE TABLE IF NOT EXISTS final_summaries (
  id           BIGSERIAL PRIMARY KEY,
  subject_id   BIGINT NOT NULL UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
  content      TEXT,
  word_count   INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Content Jobs (legacy text store / resumability) ----------
CREATE TABLE IF NOT EXISTS content_jobs (
  id          BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL,
  job_type    TEXT NOT NULL CHECK (job_type IN ('summary','content','questions','final_summary','chapters')),
  step        TEXT NOT NULL DEFAULT '',
  payload     TEXT,
  result      TEXT,
  status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_cat ON content_jobs (category_id, job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON content_jobs (status);

-- ---------- Subject Documents (multi-PDF per subject) ----------
CREATE TABLE IF NOT EXISTS subject_documents (
  id              BIGSERIAL PRIMARY KEY,
  subject_id      BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL DEFAULT 'general'
                  CHECK (doc_type IN ('syllabus','textbook','notes','general')),
  stored_filename TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  rel_path        TEXT NOT NULL,
  file_size       BIGINT DEFAULT NULL,
  page_count      INTEGER DEFAULT NULL,
  full_text       TEXT,
  status          TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','ready','failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docs_subject ON subject_documents (subject_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON subject_documents (subject_id, doc_type);

-- ---------- App Settings ----------
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key   TEXT NOT NULL PRIMARY KEY,
  setting_value TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION exam_set_updated_at();

-- ---------- Asynchronous AI generation jobs ----------
-- Long-running AI work (chapter content / regenerate / questions) runs out of
-- band (Netlify background function) so requests return before Netlify's 26s
-- synchronous-function limit. Clients poll GET /api/jobs.php?id=... until done.
CREATE TABLE IF NOT EXISTS ai_jobs (
  id           BIGSERIAL PRIMARY KEY,
  job_type     TEXT NOT NULL DEFAULT 'chapter_content',
  chapter_id   BIGINT,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  status       TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','running','done','failed')),
  error        TEXT,
  result       JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_chapter ON ai_jobs (chapter_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created ON ai_jobs (created_at DESC);

-- ---------- Test attempt sessions (replaces PHP $_SESSION) ----------
CREATE TABLE IF NOT EXISTS attempt_sessions (
  attempt_token TEXT NOT NULL PRIMARY KEY,
  payload       TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);
DELETE FROM attempt_sessions WHERE expires_at < NOW();