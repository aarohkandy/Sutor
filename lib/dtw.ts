import type { ActualNote, AlignedNote, ExpectedNote } from "@/lib/types";

function noteDistance(expected: ExpectedNote, actual: ActualNote): number {
  const notePenalty = expected.note === actual.note && expected.octave === actual.octave ? 0 : 4;
  const timingPenalty = Math.min(Math.abs(expected.start_ms - actual.start_ms) / 220, 4);
  return notePenalty + timingPenalty + Math.abs(actual.cents_off) / 100;
}

export function alignNotes(expected: ExpectedNote[], actual: ActualNote[]): AlignedNote[] {
  const rows = expected.length + 1;
  const cols = actual.length + 1;
  const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Number.POSITIVE_INFINITY));
  const trace = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));

  matrix[0][0] = 0;
  for (let row = 1; row < rows; row += 1) {
    matrix[row][0] = row * 3;
    trace[row][0] = "up";
  }
  for (let col = 1; col < cols; col += 1) {
    matrix[0][col] = col * 2;
    trace[0][col] = "left";
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const match = matrix[row - 1][col - 1] + noteDistance(expected[row - 1], actual[col - 1]);
      const miss = matrix[row - 1][col] + 2.8;
      const skip = matrix[row][col - 1] + 1.6;
      const best = Math.min(match, miss, skip);
      matrix[row][col] = best;
      trace[row][col] = best === match ? "diag" : best === miss ? "up" : "left";
    }
  }

  const aligned: AlignedNote[] = [];
  let row = expected.length;
  let col = actual.length;
  while (row > 0) {
    const step = trace[row][col] || "up";
    if (step === "diag") {
      aligned.push({ expected: expected[row - 1], actual: actual[col - 1] ?? null });
      row -= 1;
      col -= 1;
      continue;
    }
    if (step === "left") {
      col = Math.max(0, col - 1);
      continue;
    }
    aligned.push({ expected: expected[row - 1], actual: null });
    row -= 1;
  }

  return aligned.reverse();
}
