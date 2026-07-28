import { frequencyToNote } from "@/lib/note";

export interface YinPitchDetection {
  frequency: number | null;
  probability: number;
  note: string | null;
  octave: number | null;
  cents: number | null;
}

export function yin(frame: Float32Array, sampleRate: number, threshold = 0.12): YinPitchDetection {
  const tauMax = Math.floor(frame.length / 2);
  const difference = new Float32Array(tauMax);
  const cumulative = new Float32Array(tauMax);

  for (let tau = 1; tau < tauMax; tau += 1) {
    let sum = 0;
    for (let index = 0; index < tauMax; index += 1) {
      const delta = frame[index] - frame[index + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  cumulative[0] = 1;
  let running = 0;
  for (let tau = 1; tau < tauMax; tau += 1) {
    running += difference[tau];
    cumulative[tau] = (difference[tau] * tau) / (running || 1);
  }

  let bestTau = -1;
  for (let tau = 2; tau < tauMax; tau += 1) {
    if (cumulative[tau] < threshold) {
      bestTau = tau;
      while (bestTau + 1 < tauMax && cumulative[bestTau + 1] < cumulative[bestTau]) {
        bestTau += 1;
      }
      break;
    }
  }

  if (bestTau === -1) {
    let minimum = Number.POSITIVE_INFINITY;
    for (let tau = 2; tau < tauMax; tau += 1) {
      if (cumulative[tau] < minimum) {
        minimum = cumulative[tau];
        bestTau = tau;
      }
    }
  }

  if (bestTau <= 0) {
    return { frequency: null, probability: 0, note: null, octave: null, cents: null };
  }

  const x0 = bestTau > 1 ? cumulative[bestTau - 1] : cumulative[bestTau];
  const x1 = cumulative[bestTau];
  const x2 = bestTau + 1 < tauMax ? cumulative[bestTau + 1] : cumulative[bestTau];
  const denominator = x2 + x0 - 2 * x1;
  const betterTau = denominator === 0 ? bestTau : bestTau + (x2 - x0) / (2 * denominator);
  const frequency = sampleRate / betterTau;

  if (!Number.isFinite(frequency) || frequency <= 0) {
    return { frequency: null, probability: 0, note: null, octave: null, cents: null };
  }

  const note = frequencyToNote(frequency);
  return {
    frequency,
    probability: Math.max(0, Math.min(1, 1 - cumulative[bestTau])),
    note: note.note,
    octave: note.octave,
    cents: note.cents
  };
}
