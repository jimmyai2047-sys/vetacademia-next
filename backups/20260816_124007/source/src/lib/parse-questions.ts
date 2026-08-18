export type ParsedQuestion = {
  text: string;
  options: string[];
  correctAnswer: number; // index of correct option, -1 if unmarked
  explanation: string | null;
  error?: string;
};

// Matches a question-start line, e.g. "1.", "12)", "Q.", "Q1."
const QSTART_RE = /^\s*(?:\d+[\.\)]|Q[\.\):]?\d*)\s+(.+)$/i;
// Matches an option line: "A. text", "B) text"
const OPTION_RE = /^\s*([A-Da-d])[\.\)]\s+(.*\S)\s*$/;
// Marks an option as the correct answer (trailing marker).
const EXPL_RE = /^\s*(?:explanation|answer|solution|ans|explain|sol)\s*[:\-]\s*(.*)$/i;
// Answer given as a single letter, e.g. "Answer: B" / "Correct: C"
const ANS_RE = /^\s*(?:answer|correct(?:\s*answer)?|ans|correct\s*option)\s*[:\-]\s*([A-Da-d])\b/i;

function stripCorrectMarker(opt: string): string {
  return opt
    .replace(/\*$/, "")
    .replace(/\s*✓$/, "")
    .replace(/\s*✔$/, "")
    .replace(/\s*\(ans\)$/i, "")
    .replace(/\s*\(answer\)$/i, "")
    .replace(/\s*\(correct\)$/i, "")
    .trim();
}

function isCorrectMarked(opt: string): boolean {
  const t = opt.trim();
  return (
    t.endsWith("*") ||
    t.endsWith("✓") ||
    t.endsWith("✔") ||
    /\(\s*ans\s*\)$/i.test(t) ||
    /\(\s*answer\s*\)$/i.test(t) ||
    /\(\s*correct\s*\)$/i.test(t)
  );
}

export function parseQuestions(raw: string): ParsedQuestion[] {
  const lines = (raw || "").replace(/\r\n/g, "\n").split("\n");
  const questions: ParsedQuestion[] = [];
  let cur: ParsedQuestion | null = null;
  let explanation: string[] = [];

  const flush = () => {
    if (cur) {
      cur.text = cur.text.trim().replace(/\s+/g, " ");
      cur.options = cur.options.map(stripCorrectMarker);
      cur.explanation = explanation.join(" ").trim() || null;
      questions.push(cur);
    }
  };

  for (const line of lines) {
    const qm = QSTART_RE.exec(line);
    const om = OPTION_RE.exec(line);
    const ansm = ANS_RE.exec(line);
    const exm = EXPL_RE.exec(line);

    if (ansm && cur) {
      cur.correctAnswer = ansm[1].toUpperCase().charCodeAt(0) - 65;
      explanation = [];
      continue;
    }

    if (qm) {
      flush();
      cur = {
        text: qm[1],
        options: [],
        correctAnswer: -1,
        explanation: null,
      };
      explanation = [];
      continue;
    }

    if (om && cur) {
      const optText = om[2];
      cur.options.push(optText);
      if (isCorrectMarked(optText)) {
        cur.correctAnswer = cur.options.length - 1;
      }
      explanation = [];
      continue;
    }

    if (exm && cur) {
      if (exm[1].trim()) explanation.push(exm[1].trim());
      continue;
    }

    if (cur) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (cur.options.length === 0) {
        cur.text += " " + trimmed;
      } else {
        // Continuation after options == explanation body.
        explanation.push(trimmed);
      }
    }
  }
  flush();

  questions.forEach((q) => {
    if (!q.text) q.error = "Missing question text";
    else if (q.options.length < 2) q.error = "Needs at least 2 options";
    else if (q.correctAnswer < 0) q.error = "No correct answer marked";
  });

  return questions;
}
