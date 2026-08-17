export type Difficulty = 1 | 2 | 3;

export function clampDifficulty(d: number): Difficulty {
  return Math.min(3, Math.max(1, Math.round(d))) as Difficulty;
}

// Computer-adaptive staircase: a correct answer raises difficulty, a wrong
// answer lowers it. Keeps the test tuned to the candidate's ability level.
export function nextDifficulty(current: number, lastCorrect: boolean): Difficulty {
  return clampDifficulty(current + (lastCorrect ? 1 : -1));
}

export function difficultyLabel(d: number): string {
  if (d <= 1) return "Easy";
  if (d >= 3) return "Hard";
  return "Medium";
}
