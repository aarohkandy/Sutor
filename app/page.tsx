"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Atmosphere } from "@/components/Atmosphere";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { STORAGE_KEYS, getNumberSetting, getStringSetting, setLocalSetting } from "@/lib/storage";
import type { Instrument } from "@/lib/types";

const instruments: Instrument[] = ["violin", "viola", "flute"];

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState("");
  const [noiseSensitivity, setNoiseSensitivity] = useState("5");
  const introFinishedRef = useRef(false);

  useEffect(() => {
    setOllamaUrl(getStringSetting(STORAGE_KEYS.ollamaUrl));
    setNoiseSensitivity(String(getNumberSetting(STORAGE_KEYS.noiseSensitivity, 5)));
  }, []);

  const finishIntro = useCallback(() => {
    if (introFinishedRef.current) {
      return;
    }

    introFinishedRef.current = true;
    setReady(true);
    setIntroVisible(false);
  }, []);

  useEffect(() => {
    const fallbackTimeout = window.setTimeout(finishIntro, 2800);
    return () => window.clearTimeout(fallbackTimeout);
  }, [finishIntro]);

  const openSettings = () => {
    setOllamaUrl(getStringSetting(STORAGE_KEYS.ollamaUrl));
    setNoiseSensitivity(String(getNumberSetting(STORAGE_KEYS.noiseSensitivity, 5)));
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    setLocalSetting(STORAGE_KEYS.ollamaUrl, ollamaUrl.trim());
    setLocalSetting(STORAGE_KEYS.noiseSensitivity, Math.min(10, Math.max(1, Number(noiseSensitivity) || 5)));
    setSettingsOpen(false);
  };

  return (
    <main className="relative h-screen overflow-hidden bg-background px-6 py-6 text-foreground sm:px-10 sm:py-8">
      {introVisible ? <LoadingAnimation onComplete={finishIntro} /> : null}
      <Atmosphere variant="home" />

      <div className={`relative z-10 mx-auto flex h-[calc(100vh-3rem)] max-w-6xl flex-col transition-opacity duration-200 sm:h-[calc(100vh-4rem)] ${ready ? "opacity-100" : "opacity-0"}`}>
        <header className="flex items-start justify-between text-sm">
          <div className="font-display text-lg uppercase tracking-caps text-warm">Sutor</div>
          <div className="pt-1 text-right text-xs text-muted">Practice. Analyze. Improve.</div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center">
          <div className="max-w-3xl text-center">
            <h1 className="font-display text-5xl leading-tight tracking-tight text-warm sm:text-6xl">
              Hear what you&apos;re missing.
            </h1>
            <div className="mx-auto mt-3 h-px w-16 bg-accent" />
          </div>

          <div className="mt-14 grid w-full max-w-4xl gap-4 md:grid-cols-3">
            {instruments.map((instrument) => (
              <button
                key={instrument}
                type="button"
                onClick={() => router.push(`/practice/${instrument}`)}
                className="group border border-border bg-[rgba(17,17,17,0.5)] px-8 py-12 text-center transition-[border-color,background-color] duration-200 hover:border-accent hover:bg-[rgba(17,17,17,0.72)]"
              >
                <span className="font-display text-3xl capitalize text-warm">{instrument}</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="flex justify-end text-xs text-muted">
          <button type="button" onClick={openSettings} className="quiet-link">
            Settings
          </button>
        </footer>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(10,10,10,0.76)] px-6">
          <Atmosphere variant="dialog" />
          <div className="relative z-10 w-full max-w-md space-y-6 text-center">
            <div>
              <h2 className="font-display text-4xl text-warm">Settings</h2>
            </div>

            <label className="block space-y-2 text-left">
              <span className="text-xs uppercase tracking-caps text-muted">Ollama Tunnel URL</span>
              <input
                value={ollamaUrl}
                onChange={(event) => setOllamaUrl(event.target.value)}
                className="w-full border border-border bg-[rgba(17,17,17,0.68)] px-3 py-3 outline-none transition-colors focus:border-accent"
                placeholder="https://your-tunnel.trycloudflare.com"
              />
            </label>

            <label className="block space-y-2 text-left">
              <span className="text-xs uppercase tracking-caps text-muted">Ambient Noise Sensitivity</span>
              <input
                value={noiseSensitivity}
                onChange={(event) => setNoiseSensitivity(event.target.value)}
                className="w-full border border-border bg-[rgba(17,17,17,0.68)] px-3 py-3 outline-none transition-colors focus:border-accent"
                inputMode="numeric"
                placeholder="5"
              />
            </label>

            <div className="flex items-center justify-center gap-8 text-sm">
              <button type="button" onClick={saveSettings} className="border-b border-accent pb-0.5">
                Save
              </button>
              <button type="button" onClick={() => setSettingsOpen(false)} className="quiet-link">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
