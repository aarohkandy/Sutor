export type Instrument = "violin" | "viola" | "flute";
export type AssetKind = "file" | "zip";
export type AssetFormat = "midi" | "pdf";
export type Difficulty = "starter" | "intermediate" | "advanced";

export interface MutopiaAsset {
  url: string;
  kind: AssetKind;
  format: AssetFormat;
}

export interface LibraryPiece {
  id: string;
  title: string;
  composer: string;
  instrument: Instrument;
  instrumentLine: string;
  subtitle?: string;
  era?: string;
  source?: string;
  license: "Public Domain";
  difficulty: Difficulty;
  suggested: boolean;
  midiAsset: MutopiaAsset;
  pdfAsset: MutopiaAsset;
}

export interface ExpectedNote {
  measure: number;
  note: string;
  octave: number;
  start_ms: number;
  duration_ms: number;
  dynamic: string | null;
}

export interface ActualNote {
  note: string;
  octave: number;
  cents_off: number;
  start_ms: number;
  duration_ms: number;
  rms: number;
  spectral_centroid: number;
  hnr: number;
}

export interface SpeechEvent {
  type: "speech_command";
  command: "restart" | "replay";
  measure: number;
  timestamp_ms: number;
}

export interface AlignedNote {
  expected: ExpectedNote;
  actual: ActualNote | null;
}

export interface AnalysisStats {
  totalExpected: number;
  totalMatched: number;
  averageCentsDeviation: number;
  averageHnr: number;
}

export interface RecordingSessionPayload {
  piece: LibraryPiece;
  expectedNotes: ExpectedNote[];
}

export interface StoredResultsPayload {
  piece: LibraryPiece;
  expectedNotes: ExpectedNote[];
  actualNotes: ActualNote[];
  paired: AlignedNote[];
  speechEvents: SpeechEvent[];
  stats: AnalysisStats;
  summary: string;
}

export interface MidiTempoEvent {
  tick: number;
  microsecondsPerQuarter: number;
}

export interface MidiTimeSignatureEvent {
  tick: number;
  numerator: number;
  denominator: number;
}
