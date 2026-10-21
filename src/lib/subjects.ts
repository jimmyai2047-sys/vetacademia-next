// Shared classification of non-academic "subject" rows (Flashcards, Mock
// Tests, Quizzes, PYQ sets …). These rows exist so study tools can carry
// content, but they are NOT part of the prescribed curriculum — every surface
// that counts/reports curriculum coverage must exclude them.

export const STUDY_TOOL_NAME =
  /\b(flashcards?|mock\s*tests?|quizzes|quiz|test\s*series|practice\s*(sets?|papers?)?|pyqs?|previous\s*(year\s*)?papers?)\b/i;

export function isStudyToolSubject(s: { name: string } | string): boolean {
  const name = typeof s === "string" ? s : s.name;
  return STUDY_TOOL_NAME.test(name);
}
