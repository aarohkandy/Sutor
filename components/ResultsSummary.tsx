"use client";

import Link from "next/link";
import { Atmosphere } from "@/components/Atmosphere";
import type { StoredResultsPayload } from "@/lib/types";

export function ResultsSummary({ results }: { results: StoredResultsPayload }) {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 text-foreground sm:px-10">
      <Atmosphere variant="results" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="text-sm text-muted">
          {results.piece.title} - {results.piece.composer}
        </div>
        <div className="mt-4 inline-block border-l border-accent pl-3 text-xs uppercase tracking-caps text-warm">
          {results.piece.instrument}
        </div>

        <article className="mx-auto mt-10 max-w-[680px] font-display text-[1.45rem] leading-[1.7] text-warm">
          {results.summary}
        </article>

        <div className="mt-12 overflow-hidden border border-line bg-[rgba(17,17,17,0.58)]">
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              <tr className="border-b border-line">
                <th className="bg-[rgba(248,248,246,0.03)] px-4 py-3 font-medium text-warm">Total notes expected</th>
                <td className="px-4 py-3">{results.stats.totalExpected}</td>
              </tr>
              <tr className="border-b border-line">
                <th className="bg-[rgba(248,248,246,0.03)] px-4 py-3 font-medium text-warm">Total notes matched</th>
                <td className="px-4 py-3">{results.stats.totalMatched}</td>
              </tr>
              <tr className="border-b border-line">
                <th className="bg-[rgba(248,248,246,0.03)] px-4 py-3 font-medium text-warm">Average cents deviation</th>
                <td className="px-4 py-3">{results.stats.averageCentsDeviation.toFixed(1)}</td>
              </tr>
              <tr>
                <th className="bg-[rgba(248,248,246,0.03)] px-4 py-3 font-medium text-warm">Average HNR</th>
                <td className="px-4 py-3">{results.stats.averageHnr.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex gap-8 text-sm">
          <Link href={`/practice/${results.piece.instrument}`} className="border-b border-accent pb-0.5 text-warm">
            Practice again -&gt;
          </Link>
          <Link href="/" className="quiet-link">
            Change instrument -&gt;
          </Link>
        </div>
      </div>
    </main>
  );
}
