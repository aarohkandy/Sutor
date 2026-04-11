const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export function midiToNoteName(midi: number): { note: string; octave: number } {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return {
    note: NOTE_NAMES[noteIndex],
    octave
  };
}

export function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440);
}

export function frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
  const midi = frequencyToMidi(frequency);
  const nearest = Math.round(midi);
  const cents = (midi - nearest) * 100;
  const { note, octave } = midiToNoteName(nearest);
  return { note, octave, cents };
}
