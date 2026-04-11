"use client";

import { useEffect, useState } from "react";
import { buildTeacherPrompt, generateOllamaSummary, pingOllama } from "@/lib/ollama";
import { STORAGE_KEYS, getStringSetting, setLocalSetting } from "@/lib/storage";
import type { ActualNote, AlignedNote, AnalysisStats, ExpectedNote, LibraryPiece, SpeechEvent } from "@/lib/types";

interface AnalysisPipelineProps {
  piece: LibraryPiece;
  expectedNotes: ExpectedNote[];
  blob: Blob;
  speechEvents: SpeechEvent[];
  noiseFloor: number;
  onComplete: (payload: {
    actualNotes: ActualNote[];
    paired: AlignedNote[];
    stats: AnalysisStats;
    summary: string;
  }) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

type PipelineState = "needs_url" | "offline" | "running" | "error";

export function AnalysisPipeline({
  piece,
  expectedNotes,
  blob,
  speechEvents,
  noiseFloor,
  onComplete,
  onError,
  onCancel
}: AnalysisPipelineProps) {
  const [state, setState] = useState<PipelineState>("running");
  const [ollamaUrl, setOllamaUrl] = useState("");
  const [error, setError] = useState("");

  const runPipeline = async (baseUrl: string) => {
    setState("running");
    setError("");

    const reachable = await pingOllama(baseUrl);
    if (!reachable) {
      setState("offline");
      return;
    }

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const offlineContext = new OfflineAudioContext(1, 1, 44100);
      const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer.slice(0));
      const channelCount = audioBuffer.numberOfChannels;
      const mono = new Float32Array(audioBuffer.length);
      for (let channel = 0; channel < channelCount; channel += 1) {
        const data = audioBuffer.getChannelData(channel);
        for (let index = 0; index < data.length; index += 1) {
          mono[index] += data[index] / channelCount;
        }
      }

      const workerPayload = await new Promise<{
        actualNotes: ActualNote[];
        paired: AlignedNote[];
        stats: AnalysisStats;
      }>((resolve, reject) => {
        const worker = new Worker("/workers/analysis.worker.js");
        worker.onmessage = (event) => {
          worker.terminate();
          if (event.data?.error) {
            reject(new Error(event.data.error));
            return;
          }
          resolve(event.data);
        };
        worker.onerror = () => {
          worker.terminate();
          reject(new Error("The analysis worker failed."));
        };
        worker.postMessage(
          {
            pcm: mono.buffer,
            sampleRate: audioBuffer.sampleRate,
            noiseFloor,
            expectedNotes
          },
          [mono.buffer]
        );
      });

      const prompt = buildTeacherPrompt({
        instrument: piece.instrument,
        title: piece.title,
        composer: piece.composer,
        paired: workerPayload.paired,
        speechEvents
      });
      const summary = await generateOllamaSummary(baseUrl, prompt);
      onComplete({
        actualNotes: workerPayload.actualNotes,
        paired: workerPayload.paired,
        stats: workerPayload.stats,
        summary
      });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Analysis failed.";
      setState("error");
      setError(message);
      onError(message);
    }
  };

  useEffect(() => {
    const stored = getStringSetting(STORAGE_KEYS.ollamaUrl);
    setOllamaUrl(stored);
    if (!stored) {
      setState("needs_url");
      return;
    }
    void runPipeline(stored);
  }, []);

  const saveAndRetry = () => {
    const value = ollamaUrl.trim();
    if (!value) {
      setState("needs_url");
      return;
    }
    setLocalSetting(STORAGE_KEYS.ollamaUrl, value);
    void runPipeline(value);
  };

  if (state === "needs_url" || state === "offline" || state === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div className="w-full max-w-md space-y-6">
          <h2 className="font-display text-4xl">{state === "needs_url" ? "Add your analysis brain" : state === "offline" ? "Your analysis brain is offline." : "Analysis hit a snag."}</h2>
          <p className="text-sm text-muted">
            {state === "needs_url"
              ? "Paste your Ollama Cloudflare Tunnel URL to let Sutor ask Gemma for the written summary."
              : state === "offline"
                ? "Make sure Ollama is running on your home computer and your tunnel is active."
                : error}
          </p>
          <input
            value={ollamaUrl}
            onChange={(event) => setOllamaUrl(event.target.value)}
            placeholder="https://your-tunnel.trycloudflare.com"
            className="w-full border border-border px-3 py-3 outline-none transition-colors focus:border-accent"
          />
          <div className="flex items-center justify-center gap-8 text-sm">
            <button type="button" onClick={saveAndRetry} className="border-b border-accent pb-0.5">
              {state === "offline" ? "Retry" : "Save"}
            </button>
            <button type="button" onClick={onCancel} className="quiet-link">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-6 text-center">
      <div>
        <h2 className="font-display text-5xl">Analyzing...</h2>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent animate-growLine" />
    </div>
  );
}
