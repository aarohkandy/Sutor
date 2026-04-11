import { describe, expect, test } from "vitest";
import { yin } from "@/lib/yin";

function sineWave(frequency: number, sampleRate: number, length: number): Float32Array {
  const frame = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    frame[index] = Math.sin((2 * Math.PI * frequency * index) / sampleRate);
  }
  return frame;
}

describe("yin", () => {
  test("detects concert A", () => {
    const frame = sineWave(440, 44100, 2048);
    const result = yin(frame, 44100);
    expect(result.frequency).not.toBeNull();
    expect(result.note).toBe("A");
    expect(result.octave).toBe(4);
    expect(Math.abs(result.cents ?? 0)).toBeLessThan(10);
  });
});
