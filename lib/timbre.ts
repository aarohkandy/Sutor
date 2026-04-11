function nextPowerOfTwo(value: number): number {
  let power = 1;
  while (power < value) {
    power <<= 1;
  }
  return power;
}

export function fftMagnitudes(signal: Float32Array): Float32Array {
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

export function spectralCentroid(signal: Float32Array, sampleRate: number): number {
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

export function harmonicToNoiseRatio(signal: Float32Array, sampleRate: number, fundamental: number): number {
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
