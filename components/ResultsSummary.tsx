"use client";

import Link from "next/link";
import type { StoredResultsPayload } from "@/lib/types";

export function ResultsSummary({ results }: { results: StoredResultsPayload }) {
  return (
    <main className="min-h-screen bg-surface px-6 py-8 text-foreground sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-sm text-muted">
          {results.piece.title} — {results.piece.composer}
        </div>
        <div className="mt-4 inline-block border-l border-accent pl-3 text-xs uppercase tracking-caps text-foreground">
          {results.piece.instrument}
        </div>

        <article className="mx-auto mt-10 max-w-[680px] font-display text-[1.45rem] leading-[1.7]">
          {results.summary}
        </article>

        <div className="mt-12 overflow-hidden border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              <tr className="border-b border-line">
                <th className="bg-background px-4 py-3 font-medium">Total notes expected</th>
                <td className="px-4 py-3">{results.stats.totalExpected}</td>
              </tr>
              <tr className="border-b border-line">
                <th className="bg-background px-4 py-3 font-medium">Total notes matched</th>
                <td className="px-4 py-3">{results.stats.totalMatched}</td>
              </tr>
              <tr className="border-b border-line">
                <th className="bg-background px-4 py-3 font-medium">Average cents deviation</th>
                <td className="px-4 py-3">{results.stats.averageCentsDeviation.toFixed(1)}</td>
              </tr>
              <tr>
                <th className="bg-background px-4 py-3 font-medium">Average HNR</th>
                <td className="px-4 py-3">{results.stats.averageHnr.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex gap-8 text-sm">
          <Link href={`/practice/${results.piece.instrument}`} className="border-b border-accent pb-0.5">
            Practice again →
          </Link>
          <Link href="/" className="quiet-link">
            Change instrument →
          </Link>
        </div>
      </div>
    </main>
  );
}
