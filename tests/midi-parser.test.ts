import { describe, expect, test } from "vitest";
import { parseMidiToExpectedNotes } from "@/lib/midi-parser";

function encodeVarInt(value: number): number[] {
  const bytes = [value & 0x7f];
  let remaining = value >> 7;
  while (remaining > 0) {
    bytes.unshift((remaining & 0x7f) | 0x80);
    remaining >>= 7;
  }
  return bytes;
}

function buildMidiBuffer(): ArrayBuffer {
  // Each row is one MIDI event, kept grouped for readability.
  // prettier-ignore
  const trackEvents = [
    0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20,
    0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08,
    0x00, 0x90, 0x3c, 0x64,
    ...encodeVarInt(480), 0x80, 0x3c, 0x00,
    ...encodeVarInt(480), 0x90, 0x3e, 0x64,
    ...encodeVarInt(480), 0x80, 0x3e, 0x00,
    0x00, 0xff, 0x2f, 0x00
  ];

  // prettier-ignore
  const header = [
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00,
    0x00, 0x01,
    0x01, 0xe0
  ];
  // prettier-ignore
  const track = [
    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, trackEvents.length,
    ...trackEvents
  ];

  return new Uint8Array([...header, ...track]).buffer;
}

describe("midi parser", () => {
  test("uses tempo metadata and inserts rests", () => {
    const notes = parseMidiToExpectedNotes(buildMidiBuffer());
    expect(notes[0].note).toBe("C");
    expect(notes.some((note) => note.note === "REST")).toBe(true);
    expect(notes.find((note) => note.note === "D")?.start_ms).toBeGreaterThan(900);
  });
});
