'use strict';
/**
 * Prompts ported from exam/api/config.php + exam/api/ai_generate.php
 */

function systemPrompt() {
  return `You are an expert exam-study assistant for students. You work ONLY from the PDF
text provided between the markers <<<PDF_TEXT>>> and <<<END_PDF>>>.

Strict rules:
1. Never invent facts, formulas, dates, or definitions not present in the text.
2. If the requested information is absent or unclear in the text, respond with
   exactly this string and nothing else: "Information not clearly available in the uploaded PDF"
3. Use simple, easy-to-understand English (target: 7th–10th grade reading level).
   Prefer short sentences, plain words, and everyday examples.
4. Give COMPLETE, PROPER answers. NEVER give a one-line answer. Every answer
   must be detailed and fully explain the point: what it is, how it works, why it
   matters, and a simple example where possible. Use clear points/bullets so the
   student can actually learn from the answer.
5. Return ONLY valid JSON matching the requested schema.`;
}

function topicSystemPrompt() {
  return `You are an expert exam-study tutor for college students. You are given a Subject,
a Chapter/Unit title, and a list of Syllabus Topics. The PDF is a syllabus, so it
only lists these topics — it does NOT contain full textbook explanations.

Your job: write COMPREHENSIVE, DETAILED, EXAM-READY study material that explains each
topic THOROUGHLY. You generate this study material based on the syllabus topic — this
is expected, so EXPLAIN each concept PROPERLY and IN DEPTH. Never answer with
"Information not clearly available in the uploaded PDF", because the topics are your source.

Rules:
1. Be technically correct and complete for every topic given.
2. Use plain, easy words. Give DETAILED definitions, thorough concept/theory (aim for 800+ words per topic), many key points, short revision notes, and likely exam questions with model answers.
3. This material is AI-generated for study purposes; do not quote or cite the PDF.
4. Include comparisons (X vs Y), advantages/disadvantages, real-world examples, and memory tricks wherever possible.
5. Return ONLY valid JSON matching the requested schema.`;
}

function aiGeneratedLabel() {
  return 'AI-generated study explanation based on this syllabus topic.';
}

function summaryUserPrompt(chapterTitle, subjectName, modeNote, chunk) {
  return `Chapter: ${chapterTitle}
Subject: ${subjectName}

${modeNote}
- Use plain, simple words (10th grade level). Explain every important concept clearly and THOROUGHLY.
- Write 8-15 detailed paragraphs. Cover every important concept, formula, definition, and process mentioned in the text.
- For each concept: explain WHAT it is, HOW it works, WHY it matters, and give a real-world analogy.
- Include sub-sections with clear headings where appropriate (e.g. "Key Concepts", "How it Works", "Important Formulas").
- End with a 5-10 bullet list called "exam_focus" naming the topics most likely to be asked in exams, with brief notes on why each is important.
- Return ONLY JSON: {"summary":"...","exam_focus":["..."],"unclear_topics":["..."]}
- If content is unclear, set summary to "Information not clearly available in the uploaded PDF".

<<<PDF_TEXT>>>
${chunk}
<<<END_PDF>>>`;
}

function summaryConsolidatePrompt(combined) {
  return `Combine the following partial chapter summaries into ONE coherent easy-language chapter summary.
- Remove repetition, keep the order of ideas.
- Keep the final exam_focus list (merged, max 6 items).
Return ONLY JSON: {"summary":"...","exam_focus":["..."],"unclear_topics":["..."]}

<<<PDF_TEXT>>>
${combined}
<<<END_PDF>>>`;
}

function contentUserPrompt(chapterTitle, subjectName, chunk) {
  return `Chapter: ${chapterTitle}
Subject: ${subjectName}

Extract detailed, exam-ready study material from the text below. Return ONLY JSON:
{
 "definitions": [{"term":"...","definition":"detailed, clear definition in easy words with examples where possible"}],
 "important_points": [{"point":"...","reason":"why it matters for exams and real-world use"}],
 "key_terms": [{"term":"...","context":"one-line context explaining when/where this term is used"}],
 "exam_important": [{"item":"...","why":"why it is frequently asked in exams","priority":"very_high|high|medium"}],
 "examples": [{"title":"...","content":"detailed practical example with step-by-step explanation"}],
 "theory": "STRUCTURED theory with numbered headings and points.\n\nFormat each section like this:\n\n## Heading Name\n1. First point — explanation\n2. Second point — explanation\n3. Third point — explanation\n... (8-12 numbered points per section)\n\nUse multiple ## sections for different sub-topics.\nCover: principles, working, types, advantages, disadvantages, comparisons, applications.\nWrite in easy language. Aim for 1000-2000 words total.\n\nDIAGRAMS: Whenever a concept has a clear visual/flow structure (e.g. Waterfall Model steps, HTTP request flow, process lifecycle, architecture layers, database ER relationships, algorithm steps, class/type hierarchies), ADD a Mermaid flowchart diagram in a \`\`\`mermaid fenced code block right after the relevant ## section. Use flowchart TD/ LR nodes (A --> B) with short labels.",
 "revision_notes": "8-15 short one-line memory cues covering every major concept, formula, and definition. Each on its own line, designed for quick pre-exam revision."
}
Rules:
- Use ONLY terms/concepts actually present in the text.
- 5-15 definitions, 10-20 important points, 5-15 key_terms, 3-8 exam_important, 2-8 examples.
- theory: MUST have ## headings and numbered points (1, 2, 3...) under each heading. Clean, structured format. No plain paragraphs.
- revision_notes: Cover ALL major points - student should be able to revise the entire chapter from these notes alone.
- Empty array [] when a section has nothing. Do NOT fabricate.

<<<PDF_TEXT>>>
${chunk}
<<<END_PDF>>>`;
}

function syllabusStudyUserPrompt(subjectName, chapterTitle, listText) {
  return `Subject: ${subjectName}
Chapter/Unit: ${chapterTitle}
Syllabus topics:
${listText}

You are a personal exam-study tutor. For EACH syllabus topic listed above, generate COMPLETE, EXAM-READY, COMPREHENSIVE study material FOR THAT TOPIC: summary, simple explanation, definitions, theory, important points, key terms, exam-important items, examples, memory tricks, 3/5/7-mark answers, differences, revision notes and questions. The topics themselves are the source (AI-generated educational material, not PDF text). Do NOT add unrelated topics. Preserve technical correctness.

The student needs DETAILED, THOROUGH explanations — not short summaries. Think of this as writing a mini-textbook chapter for each topic.

Return ONLY JSON with EXACTLY this shape and ONE topic entry per listed topic, in the SAME ORDER, with "topic" spelled EXACTLY as listed:
{"results":[
 {"topic":"<exact topic as listed>","summary":"DETAILED 4-6 paragraph overview covering definition, purpose, key aspects, types/classifications, and real-world examples. Use sub-headings within paragraphs.",
  "simple_explanation":"1-2 paragraphs in simplest possible English, as if explaining to someone who has never studied this subject. Use everyday analogies.",
  "definitions":[{"term":"...","definition":"clear, detailed definition in easy words. Include when it was introduced, where it is used, and how it relates to other concepts."}],
  "theory":"STRUCTURED theory with ## headings and numbered points.\n\nFormat:\n## Section Heading 1\n1. Point — detailed explanation\n2. Point — detailed explanation\n3. Point — detailed explanation\n... (8-12 numbered points per section)\n\n## Section Heading 2\n1. Point — detailed explanation\n2. Point — detailed explanation\n... (8-12 numbered points per section)\n\nCreate 3-5 ## sections covering: principle, working mechanism, types/classifications, advantages, disadvantages, applications.\nUse 🔥 VERY IMPORTANT / 📝 EXAM QUESTION / ⭐ IMPORTANT labels where relevant.\nAim for 800-1500 words per topic.\n\nDIAGRAMS: Whenever this topic has a clear visual/flow structure (e.g. Waterfall Model steps, SDLC phases, network topology, algorithm flowchart, architecture layers, database relationship, process lifecycle, class/type hierarchy), ADD a Mermaid flowchart diagram in a \`\`\`mermaid fenced code block right after the relevant ## section. Use flowchart TD or LR with short labels: A --> B.",
  "important_points":[{"point":"...","reason":"why it matters for exams and real-world applications"}],
  "key_terms":[{"term":"...","context":"detailed one-line context with usage example"}],
  "exam_important":[{"item":"...","why":"why often asked in exams, which exam pattern it fits","priority":"very_high|high|medium"}],
  "examples":[{"title":"...","content":"detailed practical example with step-by-step explanation. For programming topics, include a short code snippet with line-by-line explanation. For theory topics, include a real-world case study."}],
  "memory_trick":"2-4 memory tricks / mnemonics / keyword associations / analogies for each major concept",
  "exam_answers":[{"marks":"3","answer":"well-structured 3-mark answer with 3-4 clear points"},{"marks":"5","answer":"detailed 5-mark answer with 5-6 points, brief explanation for each"},{"marks":"7","answer":"comprehensive 7-mark answer with 7-8 structured points, examples, and a comparison table where relevant"}],
  "differences":[{"a":"first concept","b":"second concept","points":[{"aspect":"comparison point","a":"value for a","b":"value for b"}]}],
  "revision_notes":"6-10 short one-line memory cues covering every major aspect of this topic. Student should be able to revise fully from these.",
  "questions":[
    {"type":"mcq","question_text":"...","options":["A","B","C","D"],"correct_answer":"...","explanation":"..."},
    {"type":"definition","question_text":"Define: <term>","correct_answer":"...","explanation":"..."},
    {"type":"concept","question_text":"Explain: <concept>","correct_answer":"...","explanation":"..."},
    {"type":"short_answer","question_text":"...","correct_answer":"a COMPLETE answer made of 4-6 clearly explained points, never one line","explanation":"..."},
    {"type":"long_answer","question_text":"Explain / Describe / Differentiate: <concept>","correct_answer":"structured model answer in 6-10 detailed points with examples and a comparison where relevant","explanation":"marking scheme note"}
  ]}
]
Rules:
- THEORY MUST use ## headings and numbered points (1, 2, 3...) under each heading. No plain paragraphs. Clean, exam-ready structure.
- EXAM_ANSWERS: provide all three mark levels (3, 5, 7) for every topic. The 7-mark answer should be detailed enough to score full marks.
- DIFFERENCES: include 1-3 comparison tables for confusable concepts in every topic (e.g. Waterfall vs Agile, GET vs POST, HTML vs CSS). Make comparison tables with 5-8 aspects.
- EXAM_IMPORTANT priority: very_high (⭐⭐⭐), high (⭐⭐) or medium (⭐).
- QUESTIONS: 4-6 per topic, mixing mcq / definition / concept / short_answer / long_answer; add difference and application questions where they fit.
- MCQ: exactly 4 options and 1 correct answer spelled exactly like an option.
- Every topic entry MUST be present, even if some keys are empty (use [] or "").
- MEMORY_TRICK: include at least 2 mnemonics or keyword associations per topic.
- REVISION_NOTES: at least 6 lines per topic, covering all major concepts.`;
}

function questionBatchUserPrompt(instruction, countPerType, type, label) {
  return `${instruction}

Create exactly ${countPerType} ${label} questions.

Rules:
- Do NOT invent facts. If the material lacks enough content for ${countPerType} questions, generate fewer (minimum 2) — never fabricate.
- Use simple, easy-to-understand English (7th–10th grade level): short sentences, plain words.
- ANSWERS MUST BE DETAILED AND COMPLETE — NEVER a one-line answer. Write each answer in a PROPER way:
  * definition: 2-4 clear sentences — what it means, where it is used, and one simple example.
  * concept / short_answer: 3-6 clear points. For each point add a short explanation. Include how it works and why it matters.
  * long_answer: 6-10 structured points covering the definition, how it works, types (if any), advantages/disadvantages, and a real-world example.

Return ONLY JSON:
{"questions":[{"type":"${type}","question_text":"?...","options":["A","B","C","D"],"correct_answer":"exact option text","explanation":"1-2 sentence why","topic":"short topic tag"}]}

- For mcq: exactly 4 options, 1 correct.
- For definition: question_text = "Define: <term>", correct_answer = a clear, complete definition with an example.
- For concept/short_answer: correct_answer = a full, easy-language model answer made of 3-6 explained points, explanation = why this answer scores marks.
- For long_answer: question_text = "Explain/Describe/Differentiate: <concept>", correct_answer = a structured model answer in 6-10 detailed points with examples and a comparison where relevant, explanation = marking scheme.
- For mcq: exactly 4 options, 1 correct.
- topic must be a short tag like "Normalization", "Primary Key", "Calvin Cycle".`;
}

function finalSummaryUserPrompt(chapterBlocks, perfData) {
  return `You are a final-exam revision assistant. Using ONLY the chapter study material below,
produce a comprehensive exam-revision CHEAT SHEET for the whole subject.

Cover these sections:
1. Syllabus overview (units and their weight)
2. Unit-wise revision (2-4 lines per unit)
3. 20 most important definitions
4. 15 concepts/theory items
5. 15 most-asked exam topics
6. Quick revision notes (per unit)
7. Weak topics advice
8. Test performance summary
9. 10-minute emergency list (25-30 items)
10. Common exam mistakes

Return ONLY JSON: {"final_summary":"detailed markdown text with clear section headings"}.

<<<PDF_TEXT>>>
${chapterBlocks}
=== SUBJECT PERFORMANCE DATA ===
${perfData}
<<<END_PDF>>>`;
}

module.exports = {
  systemPrompt,
  topicSystemPrompt,
  aiGeneratedLabel,
  summaryUserPrompt,
  summaryConsolidatePrompt,
  contentUserPrompt,
  syllabusStudyUserPrompt,
  questionBatchUserPrompt,
  finalSummaryUserPrompt,
};