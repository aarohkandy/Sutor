"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { fetchMutopiaAsset } from "@/lib/mutopia";
import type { MutopiaAsset } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface SheetMusicRendererProps {
  pdfAsset: MutopiaAsset;
  currentPage: number;
  countdownProgress: number;
  onAdvance: () => void;
  onPageCount: (count: number) => void;
}

export function SheetMusicRenderer({
  pdfAsset,
  currentPage,
  countdownProgress,
  onAdvance,
  onPageCount
}: SheetMusicRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [documentProxy, setDocumentProxy] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadedPdf: pdfjs.PDFDocumentProxy | null = null;

    (async () => {
      try {
        setError("");
        const data = await fetchMutopiaAsset(pdfAsset);
        const task = pdfjs.getDocument({
          data,
          isEvalSupported: false
        });
        const pdf = await task.promise;
        loadedPdf = pdf;
        if (cancelled) {
          await pdf.destroy();
          return;
        }

        setDocumentProxy(pdf);
        onPageCount(pdf.numPages);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to open the score.");
      }
    })();

    return () => {
      cancelled = true;
      void loadedPdf?.destroy();
    };
  }, [onPageCount, pdfAsset]);

  useEffect(() => {
    if (!documentProxy || !canvasRef.current) {
      return;
    }

    let cancelled = false;

    (async () => {
      const page = await documentProxy.getPage(currentPage + 1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPage, documentProxy]);

  return (
    <div className="overflow-hidden border border-line bg-[rgba(17,17,17,0.72)]">
      <div
        className="h-0.5 origin-left bg-accent transition-transform duration-100"
        style={{ transform: `scaleX(${countdownProgress})` }}
      />
      <button
        type="button"
        onClick={onAdvance}
        className="block w-full bg-[rgba(248,248,246,0.02)] transition-colors duration-200 hover:bg-[rgba(248,248,246,0.04)]"
      >
        <div className="min-h-[28rem] p-4 sm:p-8">
          {error ? (
            <div className="flex min-h-[24rem] items-center justify-center text-sm text-muted">{error}</div>
          ) : (
            <div className="flex min-h-[24rem] items-center justify-center bg-[#F8F8F6] p-4">
              <canvas ref={canvasRef} className="mx-auto h-auto max-h-[72vh] w-full max-w-full" />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
