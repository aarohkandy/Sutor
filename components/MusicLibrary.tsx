"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Atmosphere } from "@/components/Atmosphere";
import { searchCatalog } from "@/lib/catalog";
import { parseMidiToExpectedNotes } from "@/lib/midi-parser";
import { fetchMutopiaAsset, instrumentLabel } from "@/lib/mutopia";
import { setPracticeSession } from "@/lib/session";
import type { Instrument, LibraryPiece } from "@/lib/types";

interface MusicLibraryProps {
  instrument: Instrument;
  pieces: LibraryPiece[];
}

export function MusicLibrary({ instrument, pieces }: MusicLibraryProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(pieces[0]?.id ?? "");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => searchCatalog(pieces, query), [pieces, query]);
  const selected =
    filtered.find((piece) => piece.id === selectedId) ??
    pieces.find((piece) => piece.id === selectedId) ??
    null;
  const suggestions = pieces.filter((piece) => piece.suggested);

  const openPiece = (piece: LibraryPiece) => {
    startTransition(() => {
      void (async () => {
        setError("");
        setPendingId(piece.id);
        setSelectedId(piece.id);

        try {
          const midiBuffer = await fetchMutopiaAsset(piece.midiAsset);
          const expectedNotes = parseMidiToExpectedNotes(midiBuffer);
          setPracticeSession({
            piece,
            expectedNotes
          });
          router.push(`/practice/${instrument}/record`);
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Unable to load this piece right now.");
          setPendingId(null);
        }
      })();
    });
  };

  const continueToRecording = () => {
    if (!selected) {
      return;
    }

    openPiece(selected);
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 sm:px-10">
      <Atmosphere variant="library" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8">
          <button type="button" onClick={() => router.push("/")} className="quiet-link text-sm">
            &larr; Back
          </button>
        </div>

        <div className="mb-10 max-w-3xl">
          <h1 className="font-display text-5xl text-warm">Choose a piece</h1>
          <p className="mt-3 text-xs uppercase tracking-caps text-muted">{instrumentLabel(instrument)}</p>
        </div>

        {suggestions.length > 0 ? (
          <section className="mb-10">
            <div className="text-xs uppercase tracking-caps text-muted">Quick starts</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {suggestions.map((piece) => {
                const loading = pendingId === piece.id && isPending;
                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => openPiece(piece)}
                    disabled={isPending}
                    className="border border-line bg-[rgba(17,17,17,0.48)] px-5 py-4 text-left transition-[border-color,background-color] duration-200 hover:border-accent hover:bg-[rgba(17,17,17,0.68)] disabled:text-muted"
                  >
                    <div className="font-display text-2xl text-warm">{loading ? "Loading..." : piece.title}</div>
                    <div className="mt-2 text-sm text-muted">{piece.composer}</div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-3 text-xs uppercase tracking-caps text-muted">Search the full catalog</div>

          <div className="border border-line bg-[rgba(17,17,17,0.68)]">
            <div className="border-b border-line p-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search all ${instrumentLabel(instrument).toLowerCase()} pieces by title or composer`}
                className="w-full border border-border bg-[rgba(248,248,246,0.03)] px-3 py-3 outline-none transition-colors focus:border-accent"
              />
            </div>

            <div>
              {filtered.map((piece) => {
                const active = piece.id === selectedId;
                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => setSelectedId(piece.id)}
                    className={`grid w-full grid-cols-[1fr_auto] gap-4 border-b border-line px-4 py-4 text-left transition-colors last:border-b-0 ${
                      active
                        ? "border-l-2 border-l-accent bg-[rgba(248,248,246,0.08)]"
                        : "hover:border-l-2 hover:border-l-accent hover:bg-[rgba(248,248,246,0.05)]"
                    }`}
                  >
                    <div>
                      <div className="font-display text-2xl text-warm">{piece.title}</div>
                      {piece.subtitle ? <div className="mt-2 text-xs uppercase tracking-caps text-muted">{piece.subtitle}</div> : null}
                    </div>
                    <div className="self-center text-sm text-muted">{piece.composer}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {selected ? (
          <div className="mt-7">
            <button
              type="button"
              disabled={isPending}
              onClick={continueToRecording}
              className="inline-flex border-b border-accent pb-1 font-medium text-warm disabled:text-muted"
            >
              {pendingId === selected.id && isPending ? "Loading score..." : "Continue ->"}
            </button>
            {error ? <p className="mt-3 text-sm text-muted">{error}</p> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
