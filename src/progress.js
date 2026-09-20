'use strict';
/**
 * exam_recompute_progress + exam_update_chapter_status ports
 * (shared by upload.php and tests.php).
 */

async function recomputeProgress(db, subjectId) {
  const tot = await db.query('SELECT COUNT(*)::int AS c FROM chapters WHERE subject_id = $1', [subjectId]);
  const comp = await db.query('SELECT COUNT(*)::int AS c FROM chapters WHERE subject_id = $1 AND status = $2', [subjectId, 'completed']);
  const avgRows = await db.query('SELECT COALESCE(ROUND(AVG(percentage),2),0)::float AS a FROM test_attempts WHERE subject_id = $1', [subjectId]);
  const avgScore = Number(avgRows[0].a || 0);
  const total = tot[0].c;
  const completed = comp[0].c;
  const progress = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

  await db.query('UPDATE subjects SET total_chapters = $1 WHERE id = $2', [total, subjectId]);
  await db.query(`
    INSERT INTO subject_progress (subject_id, total_chapters, completed_chapters, avg_score, overall_progress)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (subject_id) DO UPDATE SET
      total_chapters = EXCLUDED.total_chapters,
      completed_chapters = EXCLUDED.completed_chapters,
      avg_score = EXCLUDED.avg_score,
      overall_progress = EXCLUDED.overall_progress`,
    [subjectId, total, completed, avgScore, progress]
  );
  return { total, completed, avgScore, progress };
}

async function updateChapterStatus(db, chapterId, subjectId, passed, percentage) {
  const wt = await db.query(
    `SELECT COUNT(*)::int AS c FROM weak_topics WHERE chapter_id = $1 AND status IN ('open','revising','retested_now')`, [chapterId]
  );
  const openWeak = wt[0].c;

  let status;
  if (passed && openWeak === 0) status = 'completed';
  else if (passed) status = 'needs_revision';
  else status = 'test_pending';

  await db.query('UPDATE chapters SET status = $1 WHERE id = $2', [status, chapterId]);

  if (status === 'completed') {
    await db.query(`
      INSERT INTO chapter_completion (chapter_id, subject_id, final_score)
      VALUES ($1,$2,$3)
      ON CONFLICT (chapter_id) DO UPDATE SET final_score = $3`,
      [chapterId, subjectId, percentage]
    );
  }

  await recomputeProgress(db, subjectId);
  return status;
}

module.exports = { recomputeProgress, updateChapterStatus };