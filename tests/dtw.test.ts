import { describe, expect, test } from "vitest";
import { alignNotes } from "@/lib/dtw";
import type { ActualNote, ExpectedNote } from "@/lib/types";

describe("dtw alignment", () => {
  test("keeps matching notes paired despite timing drift", () => {
    const expected: ExpectedNote[] = [
      { measure: 1, note: "C", octave: 4, start_ms: 0, duration_ms: 500, dynamic: null },
      { measure: 1, note: "D", octave: 4, start_ms: 500, duration_ms: 500, dynamic: null }
    ];
    const actual: ActualNote[] = [
      {
        note: "C",
        octave: 4,
        cents_off: 4,
        start_ms: 30,
        duration_ms: 520,
        rms: 0.12,
        spectral_centroid: 900,
        hnr: 10
      },
      {
        note: "D",
        octave: 4,
        cents_off: -6,
        start_ms: 570,
        duration_ms: 480,
        rms: 0.11,
        spectral_centroid: 910,
        hnr: 11
      }
    ];

    const aligned = alignNotes(expected, actual);
    expect(aligned).toHaveLength(2);
    expect(aligned[0].actual?.note).toBe("C");
    expect(aligned[1].actual?.note).toBe("D");
  });
});
