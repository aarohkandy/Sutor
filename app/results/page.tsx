"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ResultsSummary } from "@/components/ResultsSummary";
import { getResultsSession } from "@/lib/session";

export default function ResultsPage() {
  const results = useMemo(() => getResultsSession(), []);

  if (!results) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <h1 className="font-display text-4xl">No analysis is ready yet.</h1>
          <p className="mt-4 text-sm text-muted">Start a practice session first, then come back here.</p>
          <Link href="/" className="mt-6 inline-block border-b border-accent pb-1 text-sm">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  return <ResultsSummary results={results} />;
}
