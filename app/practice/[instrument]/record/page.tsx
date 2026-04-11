"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisPipeline } from "@/components/AnalysisPipeline";
import { Atmosphere } from "@/components/Atmosphere";
import { AudioRecorder } from "@/components/AudioRecorder";
import { SheetMusicRenderer } from "@/components/SheetMusicRenderer";
import { clearRecordedBlob, getRecordedBlob, setRecordedBlob } from "@/lib/audio-session-store";
import { clearResultsSession, getPracticeSession, setResultsSession } from "@/lib/session";
import { getNumberSetting, STORAGE_KEYS } from "@/lib/storage";
import type { RecordingSessionPayload, SpeechEvent } from "@/lib/types";

interface AnalysisContext {
  noiseFloor: number;
  speechEvents: SpeechEvent[];
}

function SessionMessage({
  title,
  description,
  actionLabel,
  onAction
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-center">
      <Atmosphere variant="record" />
      <div className="relative z-10 max-w-xl">
        <h1 className="font-display text-4xl text-warm">{title}</h1>
        <p className="mt-4 text-sm text-muted">{description}</p>
        <button type="button" onClick={onAction} className="mt-6 border-b border-accent pb-1 text-sm text-warm">
          {actionLabel}
        </button>
      </div>
    </main>
  );
}

export default function RecordPage() {
  const router = useRouter();
  const [session, setSession] = useState<RecordingSessionPayload | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [flipSeconds, setFlipSeconds] = useState(30);
  const [pageStartedAt, setPageStartedAt] = useState(() => Date.now());
  const [countdownProgress, setCountdownProgress] = useState(1);
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    clearResultsSession();
    setFlipSeconds(30);
    setSession(getPracticeSession());
  }, []);

  useEffect(() => {
    setFlipSeconds(30);
  }, [session?.piece.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - pageStartedAt) / 1000;
      const progress = Math.max(0, 1 - elapsed / Math.max(1, flipSeconds));
      setCountdownProgress(progress);
      if (elapsed >= flipSeconds) {
        setCurrentPage((page) => Math.min(page + 1, Math.max(0, pageCount - 1)));
        setPageStartedAt(Date.now());
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [flipSeconds, pageCount, pageStartedAt]);

  const onsetThresholds = useMemo(() => {
    const count = session?.expectedNotes.filter((note) => note.note !== "REST").length ?? 0;
    return Array.from({ length: pageCount }, (_, index) => Math.ceil((count * (index + 1)) / pageCount));
  }, [pageCount, session?.expectedNotes]);

  const handleAdvance = useCallback(() => {
    setCurrentPage((page) => Math.min(page + 1, Math.max(0, pageCount - 1)));
    setPageStartedAt(Date.now());
  }, [pageCount]);

  const handlePageCount = useCallback((count: number) => {
    const nextCount = Math.max(1, count);
    setPageCount((previous) => (previous === nextCount ? previous : nextCount));
    setCurrentPage((previous) => Math.min(previous, Math.max(0, nextCount - 1)));
    setPageStartedAt(Date.now());
  }, []);

  const handleOnset = useCallback(
    (count: number) => {
      if (count >= (onsetThresholds[currentPage] ?? Number.POSITIVE_INFINITY) && currentPage < pageCount - 1) {
        setCurrentPage((page) => Math.min(page + 1, pageCount - 1));
        setPageStartedAt(Date.now());
      }
    },
    [currentPage, onsetThresholds, pageCount]
  );

  const noiseSensitivity = getNumberSetting(STORAGE_KEYS.noiseSensitivity, 5);

  if (!session) {
    return (
      <SessionMessage
        title="This session has expired."
        description="Choose your piece again to restart the practice flow."
        actionLabel="Return home"
        onAction={() => router.push("/")}
      />
    );
  }

  if (analysisContext) {
    const blob = getRecordedBlob();
    if (!blob) {
      return (
        <SessionMessage
          title="The recording is no longer in memory."
          description="Sutor only keeps the raw audio in memory for this session. Start the take again to continue."
          actionLabel="Back to score"
          onAction={() => setAnalysisContext(null)}
        />
      );
    }

    return (
      <AnalysisPipeline
        piece={session.piece}
        expectedNotes={session.expectedNotes}
        blob={blob}
        speechEvents={analysisContext.speechEvents}
        noiseFloor={analysisContext.noiseFloor}
        onError={setError}
        onCancel={() => setAnalysisContext(null)}
        onComplete={({ actualNotes, paired, stats, summary }) => {
          setResultsSession({
            piece: session.piece,
            expectedNotes: session.expectedNotes,
            actualNotes,
            paired,
            speechEvents: analysisContext.speechEvents,
            stats,
            summary
          });
          clearRecordedBlob();
          router.push("/results");
        }}
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-6 sm:px-10">
      <Atmosphere variant="record" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href={`/practice/${session.piece.instrument}`} className="quiet-link text-sm">
              &larr; Back
            </Link>
            <h1 className="mt-4 font-display text-4xl text-warm">{session.piece.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {session.piece.composer}
              {session.piece.subtitle ? (
                <>
                  <span aria-hidden="true"> • </span>
                  {session.piece.subtitle}
                </>
              ) : null}
            </p>
          </div>

          <label className="w-28 text-right">
            <span className="block text-[11px] uppercase tracking-caps text-muted">Flip in</span>
            <input
              value={flipSeconds}
              onChange={(event) => {
                setFlipSeconds(Math.max(5, Number(event.target.value) || 30));
                setPageStartedAt(Date.now());
              }}
              inputMode="numeric"
              className="mt-2 w-full border border-border bg-[rgba(17,17,17,0.68)] px-3 py-2 text-right outline-none focus:border-accent"
            />
            <span className="mt-1 block text-[11px] text-muted">seconds</span>
          </label>
        </div>

        <SheetMusicRenderer
          pdfAsset={session.piece.pdfAsset}
          currentPage={currentPage}
          countdownProgress={countdownProgress}
          onAdvance={handleAdvance}
          onPageCount={handlePageCount}
        />

        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span>
            Page {Math.min(currentPage + 1, pageCount)} of {pageCount}
          </span>
          <span>Tap the score to advance early.</span>
        </div>

        <div className="mt-6">
          <AudioRecorder
            noiseSensitivity={noiseSensitivity}
            onOnset={handleOnset}
            onFinished={({ blob, speechEvents, noiseFloor }) => {
              setRecordedBlob(blob);
              setAnalysisContext({ speechEvents, noiseFloor });
            }}
          />
        </div>

        {error ? <p className="mt-4 text-sm text-muted">{error}</p> : null}
      </div>
    </main>
  );
}
