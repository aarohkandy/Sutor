function midiToNoteName(midi) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return { note: names[((midi % 12) + 12) % 12], octave: Math.floor(midi / 12) - 1 };
}

function frequencyToMidi(frequency) {
  return 69 + 12 * Math.log2(frequency / 440);
}

function frequencyToNote(frequency) {
  const midi = frequencyToMidi(frequency);
  const nearest = Math.round(midi);
  const cents = (midi - nearest) * 100;
  const pitch = midiToNoteName(nearest);
  return { note: pitch.note, octave: pitch.octave, cents };
}

function yin(frame, sampleRate, threshold = 0.12) {
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
    cumulative[tau] = difference[tau] * tau / (running || 1);
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
    let minimum = Infinity;
    for (let tau = 2; tau < tauMax; tau += 1) {
      if (cumulative[tau] < minimum) {
        minimum = cumulative[tau];
        bestTau = tau;
      }
    }
  }
  if (bestTau <= 0) {
    return null;
  }
  const x0 = bestTau > 1 ? cumulative[bestTau - 1] : cumulative[bestTau];
  const x1 = cumulative[bestTau];
  const x2 = bestTau + 1 < tauMax ? cumulative[bestTau + 1] : cumulative[bestTau];
  const denominator = x2 + x0 - 2 * x1;
  const betterTau = denominator === 0 ? bestTau : bestTau + (x2 - x0) / (2 * denominator);
  const frequency = sampleRate / betterTau;
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return null;
  }
  return {
    frequency,
    probability: Math.max(0, Math.min(1, 1 - cumulative[bestTau])),
    ...frequencyToNote(frequency)
  };
}

function nextPowerOfTwo(value) {
  let power = 1;
  while (power < value) {
    power <<= 1;
  }
  return power;
}

function fftMagnitudes(signal) {
  const size = nextPowerOfTwo(signal.length);
  const real = new Float32Array(size);
  const imag = new Float32Array(size);
  real.set(signal);

  for (let index = 1, j = 0; index < size; index += 1) {
    let bit = size >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (index < j) {
      [real[index], real[j]] = [real[j], real[index]];
      [imag[index], imag[j]] = [imag[j], imag[index]];
    }
  }

  for (let length = 2; length <= size; length <<= 1) {
    const half = length >> 1;
    const theta = (-2 * Math.PI) / length;
    for (let offset = 0; offset < size; offset += length) {
      for (let index = 0; index < half; index += 1) {
        const cos = Math.cos(theta * index);
        const sin = Math.sin(theta * index);
        const evenIndex = offset + index;
        const oddIndex = evenIndex + half;
        const oddReal = real[oddIndex] * cos - imag[oddIndex] * sin;
        const oddImag = real[oddIndex] * sin + imag[oddIndex] * cos;
        const evenReal = real[evenIndex];
        const evenImag = imag[evenIndex];
        real[oddIndex] = evenReal - oddReal;
        imag[oddIndex] = evenImag - oddImag;
        real[evenIndex] = evenReal + oddReal;
        imag[evenIndex] = evenImag + oddImag;
      }
    }
  }

  const magnitudes = new Float32Array(size / 2);
  for (let index = 0; index < magnitudes.length; index += 1) {
    magnitudes[index] = Math.hypot(real[index], imag[index]);
  }
  return magnitudes;
}

function spectralCentroid(signal, sampleRate) {
  const magnitudes = fftMagnitudes(signal);
  let weighted = 0;
  let total = 0;
  for (let index = 0; index < magnitudes.length; index += 1) {
    const frequency = (index * sampleRate) / (magnitudes.length * 2);
    const magnitude = magnitudes[index];
    weighted += frequency * magnitude;
    total += magnitude;
  }
  return total > 0 ? weighted / total : 0;
}

function harmonicToNoiseRatio(signal, sampleRate, fundamental) {
  if (!Number.isFinite(fundamental) || fundamental <= 0) {
    return 0;
  }
  const magnitudes = fftMagnitudes(signal);
  const binWidth = sampleRate / (magnitudes.length * 2);
  let harmonicEnergy = 0;
  let totalEnergy = 0;
  for (let index = 1; index < magnitudes.length; index += 1) {
    const magnitude = magnitudes[index];
    const energy = magnitude * magnitude;
    totalEnergy += energy;
    const frequency = index * binWidth;
    const harmonic = Math.round(frequency / fundamental);
    if (harmonic > 0) {
      const target = harmonic * fundamental;
      if (Math.abs(frequency - target) <= binWidth * 1.5) {
        harmonicEnergy += energy;
      }
    }
  }
  if (harmonicEnergy <= 0 || totalEnergy <= 0) {
    return 0;
  }
  const noiseEnergy = Math.max(totalEnergy - harmonicEnergy, 1e-9);
  return 10 * Math.log10(harmonicEnergy / noiseEnergy);
}

function alignNotes(expected, actual) {
  const rows = expected.length + 1;
  const cols = actual.length + 1;
  const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Infinity));
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
  const distance = (exp, act) => {
    const notePenalty = exp.note === act.note && exp.octave === act.octave ? 0 : 4;
    const timingPenalty = Math.min(Math.abs(exp.start_ms - act.start_ms) / 220, 4);
    return notePenalty + timingPenalty + Math.abs(act.cents_off) / 100;
  };
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const match = matrix[row - 1][col - 1] + distance(expected[row - 1], actual[col - 1]);
      const miss = matrix[row - 1][col] + 2.8;
      const skip = matrix[row][col - 1] + 1.6;
      const best = Math.min(match, miss, skip);
      matrix[row][col] = best;
      trace[row][col] = best === match ? "diag" : best === miss ? "up" : "left";
    }
  }
  const paired = [];
  let row = expected.length;
  let col = actual.length;
  while (row > 0) {
    const step = trace[row][col] || "up";
    if (step === "diag") {
      paired.push({ expected: expected[row - 1], actual: actual[col - 1] || null });
      row -= 1;
      col -= 1;
      continue;
    }
    if (step === "left") {
      col = Math.max(0, col - 1);
      continue;
    }
    paired.push({ expected: expected[row - 1], actual: null });
    row -= 1;
  }
  return paired.reverse();
}

function analyzePcm(pcm, sampleRate, noiseFloor) {
  const frameSize = 2048;
  const hopSize = 512;
  const frameDurationMs = (hopSize / sampleRate) * 1000;
  const frames = [];

  for (let start = 0; start + frameSize <= pcm.length; start += hopSize) {
    const frame = pcm.subarray(start, start + frameSize);
    let sum = 0;
    for (let index = 0; index < frame.length; index += 1) {
      sum += frame[index] * frame[index];
    }
    const rms = Math.sqrt(sum / frame.length);
    if (rms < noiseFloor) {
      continue;
    }
    const pitch = yin(frame, sampleRate);
    if (!pitch || !pitch.note || pitch.probability < 0.6) {
      continue;
    }
    frames.push({
      note: pitch.note,
      octave: pitch.octave,
      cents: pitch.cents,
      frequency: pitch.frequency,
      rms,
      startMs: (start / sampleRate) * 1000
    });
  }

  const segments = [];
  let current = null;
  for (const frame of frames) {
    const changed = !current || current.note !== frame.note || current.octave !== frame.octave || frame.startMs - current.lastMs > 140;
    if (changed) {
      if (current) {
        segments.push(current);
      }
      current = {
        note: frame.note,
        octave: frame.octave,
        centsTotal: frame.cents,
        rmsTotal: frame.rms,
        frequencyTotal: frame.frequency,
        count: 1,
        startMs: frame.startMs,
        endMs: frame.startMs + frameDurationMs,
        lastMs: frame.startMs
      };
      continue;
    }
    current.centsTotal += frame.cents;
    current.rmsTotal += frame.rms;
    current.frequencyTotal += frame.frequency;
    current.count += 1;
    current.endMs = frame.startMs + frameDurationMs;
    current.lastMs = frame.startMs;
  }
  if (current) {
    segments.push(current);
  }

  return segments.map((segment) => {
    const startIndex = Math.max(0, Math.floor((segment.startMs / 1000) * sampleRate));
    const endIndex = Math.min(pcm.length, Math.floor((segment.endMs / 1000) * sampleRate));
    const slice = pcm.subarray(startIndex, Math.max(startIndex + 32, endIndex));
    return {
      note: segment.note,
      octave: segment.octave,
      cents_off: segment.centsTotal / segment.count,
      start_ms: segment.startMs,
      duration_ms: Math.max(frameDurationMs, segment.endMs - segment.startMs),
      rms: segment.rmsTotal / segment.count,
      spectral_centroid: spectralCentroid(slice, sampleRate),
      hnr: harmonicToNoiseRatio(slice, sampleRate, segment.frequencyTotal / segment.count)
    };
  });
}

self.onmessage = (event) => {
  try {
    const pcm = new Float32Array(event.data.pcm);
    const sampleRate = event.data.sampleRate;
    const noiseFloor = event.data.noiseFloor;
    const expectedNotes = event.data.expectedNotes || [];
    const actualNotes = analyzePcm(pcm, sampleRate, noiseFloor);
    const paired = alignNotes(expectedNotes, actualNotes);
    const matched = paired.filter((item) => item.actual);
    const stats = {
      totalExpected: expectedNotes.length,
      totalMatched: matched.length,
      averageCentsDeviation: matched.length
        ? matched.reduce((sum, item) => sum + Math.abs(item.actual.cents_off), 0) / matched.length
        : 0,
      averageHnr: actualNotes.length ? actualNotes.reduce((sum, note) => sum + note.hnr, 0) / actualNotes.length : 0
    };

    self.postMessage({
      actualNotes,
      paired,
      stats
    });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Analysis failed."
    });
  }
};
