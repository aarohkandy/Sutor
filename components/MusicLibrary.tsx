"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseMidiToExpectedNotes } from "@/lib/midi-parser";
import { fetchMutopiaAsset, instrumentLabel } from "@/lib/mutopia";
import { setPracticeSession } from "@/lib/session";
import { searchCatalog } from "@/lib/catalog";
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
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => searchCatalog(pieces, query), [pieces, query]);
  const selected = filtered.find((piece) => piece.id === selectedId) ?? pieces.find((piece) => piece.id === selectedId) ?? null;
  const suggestions = pieces.filter((piece) => piece.suggested);

  const continueToRecording = () => {
    if (!selected) {
      return;
    }

    startTransition(() => {
      void (async () => {
        setError("");
        try {
          const midiBuffer = await fetchMutopiaAsset(selected.midiAsset);
          const expectedNotes = parseMidiToExpectedNotes(midiBuffer);
          setPracticeSession({
            piece: selected,
            expectedNotes
          });
          router.push(`/practice/${instrument}/record`);
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Unable to load this piece right now.");
        }
      })();
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10">
      <div className="mb-8">
        <button type="button" onClick={() => router.push("/")} className="quiet-link text-sm">
          ← Back
        </button>
      </div>

      <div className="mb-10">
        <h1 className="font-display text-5xl">Choose a piece</h1>
        <p className="mt-3 text-xs uppercase tracking-caps text-muted">{instrumentLabel(instrument)}</p>
      </div>

      <div className="mb-8">
        <div className="mb-3 text-xs uppercase tracking-caps text-muted">Suggested Starts</div>
        <div className="flex flex-wrap gap-3">
          {suggestions.map((piece) => (
            <button
              key={piece.id}
              type="button"
              onClick={() => setSelectedId(piece.id)}
              className={`border px-3 py-2 text-left text-sm transition-colors ${selectedId === piece.id ? "border-accent" : "border-border hover:border-accent"}`}
            >
              <span className="font-display text-lg">{piece.title}</span>
              <span className="ml-2 text-muted">{piece.composer}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border border-line bg-surface">
        <div className="border-b border-line p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or composer"
            className="w-full border border-border px-3 py-3 outline-none transition-colors focus:border-accent"
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
                className={`grid w-full grid-cols-[1fr_auto] gap-4 border-b border-line px-4 py-4 text-left transition-colors ${active ? "border-l-2 border-l-accent bg-[#F0EDE8]" : "hover:border-l-2 hover:border-l-accent hover:bg-[#F0EDE8]"}`}
              >
                <div>
                  <div className="font-display text-2xl">{piece.title}</div>
                  {piece.subtitle ? <div className="mt-1 text-xs uppercase tracking-caps text-muted">{piece.subtitle}</div> : null}
                </div>
                <div className="self-center text-sm text-muted">{piece.composer}</div>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="mt-8">
          <div className="text-sm text-muted">
            {selected.instrumentLine}
            {selected.era ? ` • ${selected.era}` : ""}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={continueToRecording}
            className="mt-4 inline-flex border-b border-accent pb-1 font-medium text-foreground disabled:text-muted"
          >
            {isPending ? "Loading score…" : "Continue →"}
          </button>
          {error ? <p className="mt-3 text-sm text-muted">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
