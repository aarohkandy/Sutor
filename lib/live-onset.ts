export interface OnsetFrameResult {
  rms: number;
  onset: boolean;
}

export interface LiveOnsetState {
  previousRms: number;
  smoothedRms: number;
  lastOnsetTimeMs: number;
}

export function createLiveOnsetState(): LiveOnsetState {
  return {
    previousRms: 0,
    smoothedRms: 0,
    lastOnsetTimeMs: -Infinity
  };
}

export function computeRms(frame: Float32Array): number {
  if (frame.length === 0) {
    return 0;
  }

  let sum = 0;
  for (let index = 0; index < frame.length; index += 1) {
    const sample = frame[index];
    sum += sample * sample;
  }

  return Math.sqrt(sum / frame.length);
}

export function processLiveOnsetFrame(
  frame: Float32Array,
  sampleRate: number,
  timeMs: number,
  noiseFloor: number,
  state: LiveOnsetState
): OnsetFrameResult {
  const rms = computeRms(frame);
  state.smoothedRms = state.smoothedRms === 0 ? rms : state.smoothedRms * 0.82 + rms * 0.18;
  const delta = rms - state.previousRms;
  const minGapMs = (frame.length / sampleRate) * 1000 * 2.5;
  const onset =
    rms > noiseFloor * 1.25 &&
    delta > Math.max(noiseFloor * 0.15, state.smoothedRms * 0.12) &&
    timeMs - state.lastOnsetTimeMs > minGapMs;

  state.previousRms = rms;
  if (onset) {
    state.lastOnsetTimeMs = timeMs;
  }

  return { rms, onset };
}
