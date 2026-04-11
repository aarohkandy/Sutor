"use client";

import { useRef, useState } from "react";
import { createLiveOnsetState, processLiveOnsetFrame } from "@/lib/live-onset";
import type { SpeechEvent } from "@/lib/types";

interface AudioRecorderProps {
  noiseSensitivity: number;
  onOnset: (count: number, timestampMs: number) => void;
  onFinished: (payload: {
    blob: Blob;
    speechEvents: SpeechEvent[];
    noiseFloor: number;
    compatibilityMode: boolean;
  }) => void;
}

type RecorderPhase = "idle" | "calibrating" | "recording" | "stopping";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

export function AudioRecorder({ noiseSensitivity, onOnset, onFinished }: AudioRecorderProps) {
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [speechNotice, setSpeechNotice] = useState("");
  const [statusText, setStatusText] = useState("");
  const [compatibilityMode, setCompatibilityMode] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const processorRef = useRef<ScriptProcessorNode | AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const calibrationFramesRef = useRef<number[]>([]);
  const speechEventsRef = useRef<SpeechEvent[]>([]);
  const noiseFloorRef = useRef(0.0015);
  const onsetCountRef = useRef(0);
  const recordStartTimeRef = useRef(0);
  const calibrationTimeoutRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const phaseRef = useRef<RecorderPhase>("idle");
  const compatibilityModeRef = useRef(false);
  const onsetStateRef = useRef(createLiveOnsetState());

  const updatePhase = (value: RecorderPhase) => {
    phaseRef.current = value;
    setPhase(value);
  };

  const stopStream = async () => {
    if (calibrationTimeoutRef.current) {
      window.clearTimeout(calibrationTimeoutRef.current);
      calibrationTimeoutRef.current = null;
    }

    speechRecognitionRef.current?.stop();
    mediaRecorderRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const detectSpeechCommand = (transcript: string) => {
    const normalized = transcript.trim().toLowerCase();
    const match = normalized.match(/(restart|replay)\s+from\s+measure\s+(\d+)/);
    if (!match) {
      return;
    }

    speechEventsRef.current.push({
      type: "speech_command",
      command: match[1] as "restart" | "replay",
      measure: Number(match[2]),
      timestamp_ms: Math.max(0, performance.now() - recordStartTimeRef.current)
    });
  };

  const startSpeechRecognition = () => {
    const speechWindow = window as Window & {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const api = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!api) {
      setSpeechNotice("Speech commands are not available in this browser. Use Chrome or Edge for this feature.");
      return;
    }

    const recognition = new api();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = Array.from(event.results[index]).map((result) => result.transcript).join(" ");
        detectSpeechCommand(transcript);
      }
    };
    recognition.onerror = () => {
      setSpeechNotice("Speech commands are unavailable for this session.");
    };
    recognition.start();
    speechRecognitionRef.current = recognition;
  };

  const beginRecorderPhase = () => {
    const stream = streamRef.current;
    if (!stream) {
      return;
    }

    const sorted = [...calibrationFramesRef.current].sort((left, right) => left - right);
    const percentile = sorted[Math.floor(sorted.length * 0.8)] ?? 0.001;
    const multiplier = 1.8 - Math.min(10, Math.max(1, noiseSensitivity)) * 0.1;
    noiseFloorRef.current = Math.max(0.0005, percentile * multiplier);
    recordStartTimeRef.current = performance.now();
    setStatusText("");
    updatePhase("recording");

    if (processorRef.current instanceof AudioWorkletNode) {
      processorRef.current.port.postMessage({
        type: "config",
        mode: "tracking",
        noiseFloor: noiseFloorRef.current
      });
    }

    const mimeType =
      (MediaRecorder.isTypeSupported("audio/webm;codecs=opus") && "audio/webm;codecs=opus") ||
      (MediaRecorder.isTypeSupported("audio/mp4") && "audio/mp4") ||
      undefined;

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const speechEvents = [...speechEventsRef.current];
      const compatibility = compatibilityModeRef.current;
      const noiseFloor = noiseFloorRef.current;
      await stopStream();
      updatePhase("idle");
      onFinished({ blob, speechEvents, noiseFloor, compatibilityMode: compatibility });
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    startSpeechRecognition();
  };

  const handleLiveFrame = (frame: Float32Array, sampleRate: number, timeMs: number) => {
    if (phaseRef.current === "calibrating") {
      let sum = 0;
      for (let index = 0; index < frame.length; index += 1) {
        const sample = frame[index];
        sum += sample * sample;
      }
      calibrationFramesRef.current.push(Math.sqrt(sum / frame.length));
      return;
    }

    if (phaseRef.current !== "recording") {
      return;
    }

    const result = processLiveOnsetFrame(frame, sampleRate, timeMs, noiseFloorRef.current, onsetStateRef.current);
    if (result.onset) {
      onsetCountRef.current += 1;
      onOnset(onsetCountRef.current, timeMs);
    }
  };

  const startRecording = async () => {
    setPermissionDenied(false);
    setSpeechNotice("");
    speechEventsRef.current = [];
    calibrationFramesRef.current = [];
    onsetCountRef.current = 0;
    onsetStateRef.current = createLiveOnsetState();
    compatibilityModeRef.current = false;
    setCompatibilityMode(false);
    updatePhase("calibrating");
    setStatusText("Calibrating room noise...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      streamRef.current = stream;
      const context = new AudioContext({ latencyHint: "interactive" });
      audioContextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      sourceRef.current = source;

      const silentGain = context.createGain();
      silentGain.gain.value = 0;
      silentGain.connect(context.destination);

      if ("audioWorklet" in context && "AudioWorkletNode" in window) {
        await context.audioWorklet.addModule("/workers/onset-worklet.js");
        const node = new AudioWorkletNode(context, "sutor-onset-processor");
        node.port.postMessage({ type: "config", mode: "calibration", noiseFloor: 0 });
        node.port.onmessage = (event: MessageEvent<{ rms: number; onset: boolean; timeMs: number }>) => {
          if (phaseRef.current === "calibrating") {
            calibrationFramesRef.current.push(event.data.rms);
          }
          if (phaseRef.current === "recording" && event.data.onset) {
            onsetCountRef.current += 1;
            onOnset(onsetCountRef.current, event.data.timeMs);
          }
        };
        source.connect(node);
        node.connect(silentGain);
        processorRef.current = node;
      } else {
        compatibilityModeRef.current = true;
        setCompatibilityMode(true);
        setSpeechNotice("Using compatibility audio mode - for best results, use Chrome or Edge.");
        const scriptProcessor = context.createScriptProcessor(2048, 1, 1);
        scriptProcessor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          handleLiveFrame(new Float32Array(input), context.sampleRate, context.currentTime * 1000);
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(silentGain);
        processorRef.current = scriptProcessor;
      }

      calibrationTimeoutRef.current = window.setTimeout(beginRecorderPhase, 2000);
    } catch (reason) {
      await stopStream();
      updatePhase("idle");
      setPermissionDenied(true);
      setStatusText(reason instanceof Error ? reason.message : "Microphone access was denied.");
    }
  };

  const stopRecording = () => {
    if (phaseRef.current !== "recording" || !mediaRecorderRef.current) {
      return;
    }

    updatePhase("stopping");
    setStatusText("Wrapping up recording...");
    mediaRecorderRef.current.stop();
  };

  if (permissionDenied) {
    return (
      <div className="border border-line bg-[rgba(17,17,17,0.68)] px-6 py-8 text-center">
        <h2 className="font-display text-3xl text-warm">Microphone access is needed</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted">
          Allow microphone access in your browser&apos;s site settings, then try recording again. In Chrome and Edge this is in the lock icon near the address bar. In Safari, check Settings for This Website.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-line pt-5">
      <div className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-3">
          {phase === "recording" ? <span className="h-2.5 w-2.5 animate-pulseQuiet rounded-full bg-muted" /> : null}
          {speechNotice ? (
            <span className="text-xs text-muted">{speechNotice}</span>
          ) : (
            <span className="text-xs text-muted">{statusText || "Ready when you are."}</span>
          )}
          {compatibilityMode ? <span className="sr-only">Compatibility mode active</span> : null}
        </div>

        <div className="flex items-center gap-6">
          {phase === "idle" ? (
            <button type="button" onClick={startRecording} className="text-left text-warm">
              Record
            </button>
          ) : null}
          {phase === "calibrating" ? <span>Calibrating...</span> : null}
          {phase === "recording" || phase === "stopping" ? (
            <button type="button" onClick={stopRecording} disabled={phase === "stopping"} className="text-warm">
              Stop
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
