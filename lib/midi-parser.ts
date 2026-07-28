import { midiToNoteName } from "@/lib/note";
import type { ExpectedNote, MidiTempoEvent, MidiTimeSignatureEvent } from "@/lib/types";

interface MidiHeader {
  format: number;
  tracks: number;
  division: number;
}

interface NoteEvent {
  tick: number;
  durationTicks: number;
  midi: number;
}

class Reader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  readUint8(): number {
    return this.bytes[this.offset++];
  }

  peekUint8(): number {
    return this.bytes[this.offset];
  }

  readUint16(): number {
    const value = (this.bytes[this.offset] << 8) | this.bytes[this.offset + 1];
    this.offset += 2;
    return value;
  }

  readUint32(): number {
    const value =
      (this.bytes[this.offset] << 24) |
      (this.bytes[this.offset + 1] << 16) |
      (this.bytes[this.offset + 2] << 8) |
      this.bytes[this.offset + 3];
    this.offset += 4;
    return value >>> 0;
  }

  readString(length: number): string {
    const view = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(view);
  }

  readBytes(length: number): Uint8Array {
    const view = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return view;
  }

  readVarInt(): number {
    let value = 0;
    while (true) {
      const byte = this.readUint8();
      value = (value << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) {
        return value;
      }
    }
  }

  get position(): number {
    return this.offset;
  }
}

function parseHeader(reader: Reader): MidiHeader {
  if (reader.readString(4) !== "MThd") {
    throw new Error("Invalid MIDI header");
  }

  const length = reader.readUint32();
  const format = reader.readUint16();
  const tracks = reader.readUint16();
  const division = reader.readUint16();
  if (length > 6) {
    reader.readBytes(length - 6);
  }

  return { format, tracks, division };
}

function parseTracks(
  reader: Reader,
  header: MidiHeader
): { notes: NoteEvent[]; tempos: MidiTempoEvent[]; signatures: MidiTimeSignatureEvent[] } {
  const notes: NoteEvent[] = [];
  const tempos: MidiTempoEvent[] = [];
  const signatures: MidiTimeSignatureEvent[] = [];

  for (let trackIndex = 0; trackIndex < header.tracks; trackIndex += 1) {
    if (reader.readString(4) !== "MTrk") {
      throw new Error("Invalid MIDI track");
    }

    const trackLength = reader.readUint32();
    const trackEnd = reader.position + trackLength;
    let tick = 0;
    let runningStatus = 0;
    const activeNotes = new Map<string, number>();

    while (reader.position < trackEnd) {
      tick += reader.readVarInt();
      let status = reader.peekUint8();
      let firstData: number | null = null;

      if (status >= 0x80) {
        status = reader.readUint8();
        runningStatus = status;
      } else {
        status = runningStatus;
        firstData = reader.readUint8();
      }

      if (status === 0xff) {
        const metaType = reader.readUint8();
        const metaLength = reader.readVarInt();
        const metaData = reader.readBytes(metaLength);

        if (metaType === 0x51 && metaData.length === 3) {
          tempos.push({
            tick,
            microsecondsPerQuarter: (metaData[0] << 16) | (metaData[1] << 8) | metaData[2]
          });
        }

        if (metaType === 0x58 && metaData.length >= 2) {
          signatures.push({
            tick,
            numerator: metaData[0],
            denominator: 2 ** metaData[1]
          });
        }
        continue;
      }

      if (status === 0xf0 || status === 0xf7) {
        const payloadLength = reader.readVarInt();
        reader.readBytes(payloadLength);
        continue;
      }

      const eventType = status & 0xf0;
      const channel = status & 0x0f;
      const data1 = firstData ?? reader.readUint8();
      const data2 = eventType === 0xc0 || eventType === 0xd0 ? 0 : reader.readUint8();

      if (eventType === 0x90 && data2 > 0) {
        activeNotes.set(`${channel}:${data1}`, tick);
      } else if (eventType === 0x80 || (eventType === 0x90 && data2 === 0)) {
        const key = `${channel}:${data1}`;
        const startTick = activeNotes.get(key);
        if (startTick !== undefined) {
          notes.push({
            tick: startTick,
            durationTicks: Math.max(1, tick - startTick),
            midi: data1
          });
          activeNotes.delete(key);
        }
      }
    }
  }

  return {
    notes: notes.sort((left, right) => left.tick - right.tick),
    tempos: (tempos.length > 0 ? tempos : [{ tick: 0, microsecondsPerQuarter: 500000 }]).sort(
      (left, right) => left.tick - right.tick
    ),
    signatures: (signatures.length > 0 ? signatures : [{ tick: 0, numerator: 4, denominator: 4 }]).sort(
      (left, right) => left.tick - right.tick
    )
  };
}

function tickToMs(tick: number, division: number, tempos: MidiTempoEvent[]): number {
  let elapsed = 0;
  for (let index = 0; index < tempos.length; index += 1) {
    const current = tempos[index];
    const nextTick = tempos[index + 1]?.tick ?? tick;
    const segmentEnd = Math.min(tick, nextTick);
    if (segmentEnd <= current.tick) {
      break;
    }

    const deltaTicks = segmentEnd - current.tick;
    elapsed += (deltaTicks / division) * (current.microsecondsPerQuarter / 1000);
    if (segmentEnd === tick) {
      break;
    }
  }
  return elapsed;
}

function measureAtTick(tick: number, division: number, signatures: MidiTimeSignatureEvent[]): number {
  let measureNumber = 1;
  for (let index = 0; index < signatures.length; index += 1) {
    const current = signatures[index];
    const nextTick = signatures[index + 1]?.tick ?? tick + 1;
    const measureTicks = division * current.numerator * (4 / current.denominator);
    if (tick >= nextTick) {
      measureNumber += Math.floor((nextTick - current.tick) / measureTicks);
      continue;
    }

    measureNumber += Math.floor((tick - current.tick) / measureTicks);
    return measureNumber;
  }

  return measureNumber;
}

export function parseMidiToExpectedNotes(buffer: ArrayBuffer): ExpectedNote[] {
  const reader = new Reader(new Uint8Array(buffer));
  const header = parseHeader(reader);
  const { notes, tempos, signatures } = parseTracks(reader, header);
  const expected: ExpectedNote[] = [];

  for (let index = 0; index < notes.length; index += 1) {
    const event = notes[index];
    const startMs = tickToMs(event.tick, header.division, tempos);
    const endMs = tickToMs(event.tick + event.durationTicks, header.division, tempos);
    const pitch = midiToNoteName(event.midi);

    if (expected.length > 0) {
      const previous = expected[expected.length - 1];
      const previousEnd = previous.start_ms + previous.duration_ms;
      const gapMs = startMs - previousEnd;
      if (gapMs > 45) {
        expected.push({
          measure: measureAtTick(event.tick, header.division, signatures),
          note: "REST",
          octave: 0,
          start_ms: previousEnd,
          duration_ms: gapMs,
          dynamic: null
        });
      }
    }

    expected.push({
      measure: measureAtTick(event.tick, header.division, signatures),
      note: pitch.note,
      octave: pitch.octave,
      start_ms: startMs,
      duration_ms: Math.max(1, endMs - startMs),
      dynamic: null
    });
  }

  return expected;
}
