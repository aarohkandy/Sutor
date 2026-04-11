import { notFound } from "next/navigation";
import { MusicLibrary } from "@/components/MusicLibrary";
import { getCatalogForInstrument } from "@/lib/catalog";
import type { Instrument } from "@/lib/types";

const validInstruments: Instrument[] = ["violin", "viola", "flute"];

export default function PracticeInstrumentPage({ params }: { params: { instrument: string } }) {
  const instrument = params.instrument as Instrument;
  if (!validInstruments.includes(instrument)) {
    notFound();
  }

  const pieces = getCatalogForInstrument(instrument);
  return <MusicLibrary instrument={instrument} pieces={pieces} />;
}
