import catalogData from "@/data/catalog.json";
import type { Instrument, LibraryPiece } from "@/lib/types";

export interface CatalogBuilderEntry {
  relativePath: string;
  title: string;
  composer: string;
  mutopiaComposer?: string;
  instrumentLine: string;
  style?: string;
  source?: string;
  license: string;
  publicDomain: boolean;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function inferCatalogInstrument(instrumentLine: string): Instrument | null {
  const normalized = normalizeText(instrumentLine);
  if (normalized.includes("viola")) {
    return "viola";
  }
  if (normalized.includes("flute")) {
    return "flute";
  }
  if (normalized.includes("violin")) {
    return "violin";
  }
  return null;
}

export function isPublicDomainLicense(license: string): boolean {
  return normalizeText(license).includes("public domain");
}

export function getCatalog(): LibraryPiece[] {
  return catalogData as LibraryPiece[];
}

export function getCatalogForInstrument(instrument: Instrument): LibraryPiece[] {
  return getCatalog().filter((piece) => piece.instrument === instrument);
}

export function getSuggestedPieces(instrument: Instrument): LibraryPiece[] {
  return getCatalogForInstrument(instrument).filter((piece) => piece.suggested);
}

export function searchCatalog(pieces: LibraryPiece[], query: string): LibraryPiece[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return pieces;
  }

  return pieces.filter((piece) => {
    const haystack = normalizeText(
      `${piece.title} ${piece.composer} ${piece.subtitle ?? ""} ${piece.instrumentLine} ${piece.era ?? ""}`
    );
    return haystack.includes(normalizedQuery);
  });
}
