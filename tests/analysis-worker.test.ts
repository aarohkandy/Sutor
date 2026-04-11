import { describe, expect, test } from "vitest";
import { harmonicToNoiseRatio, spectralCentroid } from "@/lib/timbre";
import { yin } from "@/lib/yin";

function tone(frequency: number, sampleRate: number, durationSeconds: number): Float32Array {
  const length = Math.floor(sampleRate * durationSeconds);
  const signal = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    signal[index] = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.7;
  }
  return signal;
}

describe("analysis helpers", () => {
  test("derive stable pitch and timbre values from a clean tone", () => {
    const sampleRate = 44100;
    const signal = tone(440, sampleRate, 0.12);
    const pitch = yin(signal.subarray(0, 2048), sampleRate);
    expect(pitch.note).toBe("A");
    const centroid = spectralCentroid(signal, sampleRate);
    const hnr = harmonicToNoiseRatio(signal, sampleRate, pitch.frequency ?? 440);
    expect(centroid).toBeGreaterThan(0);
    expect(hnr).toBeGreaterThan(5);
  });
});
