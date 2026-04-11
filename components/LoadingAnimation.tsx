"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

interface LoadingAnimationProps {
  onComplete: () => void;
}

interface StringState {
  x: number;
  rise: number;
  warm: number;
  amplitude: number;
  release: number;
  drift: number;
  opacity: number;
  phaseOffset: number;
}

interface GlowState {
  x: number;
  opacity: number;
}

const TOTAL_DURATION = 2.6;

function mixColor(progress: number): string {
  const start = [255, 255, 255];
  const end = [248, 248, 246];
  const channel = start.map((value, index) => Math.round(value + (end[index] - value) * progress));
  return `rgb(${channel[0]}, ${channel[1]}, ${channel[2]})`;
}

function buildPath({
  x,
  width,
  height,
  rise,
  amplitude,
  phase,
  drift,
  release
}: {
  x: number;
  width: number;
  height: number;
  rise: number;
  amplitude: number;
  phase: number;
  drift: number;
  release: number;
}): string {
  const segments = 32;
  const visibleHeight = Math.max(0, height * rise);
  const startY = height - visibleHeight;
  const easedRelease = release * release;
  const topDrift = drift * easedRelease * 0.3;
  const bottomDrift = drift * easedRelease;
  const verticalSlip = easedRelease * height * 0.05;
  const activeAmplitude = amplitude * (1 - easedRelease * 0.8);
  const points: string[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const envelope = Math.sin(Math.PI * t);
    const firstMode = Math.sin(phase) * envelope;
    const secondMode = Math.sin(phase * 1.55 + x * 0.0022) * Math.sin(2 * Math.PI * t) * 0.14;
    const releaseDrift = topDrift + (bottomDrift - topDrift) * t;
    const releaseSag = easedRelease * height * 0.022 * envelope * envelope;
    const wave = (firstMode + secondMode) * activeAmplitude;
    const localX = x + releaseDrift + wave * Math.min(width * 0.007, 7);
    const y = startY + t * visibleHeight + verticalSlip * t + releaseSag;

    points.push(`${index === 0 ? "M" : "L"} ${localX.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(" ");
}

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<SVGEllipseElement | null>(null);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const stringStatesRef = useRef<StringState[]>([]);
  const glowStateRef = useRef<GlowState>({ x: 0.22, opacity: 0.16 });
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });

  const baseStrings = useMemo<StringState[]>(() => {
    const center = viewport.width / 2;
    const gap = Math.max(20, Math.min(viewport.width * 0.03, 34));

    return Array.from({ length: 5 }, (_, index) => ({
      x: center + (index - 2) * gap,
      rise: 0.22,
      warm: 0,
      amplitude: 0,
      release: 0,
      drift: [-22, -11, 0, 11, 22][index],
      opacity: 0.78,
      phaseOffset: index * 0.1
    }));
  }, [viewport]);

  useLayoutEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useLayoutEffect(() => {
    stringStatesRef.current = baseStrings.map((string) => ({ ...string }));
    glowStateRef.current = { x: 0.22, opacity: 0.16 };
    completedRef.current = false;

    const render = () => {
      const now = performance.now() * 0.0044;
      const strings = stringStatesRef.current;

      strings.forEach((string, index) => {
        const path = pathRefs.current[index];
        if (!path) {
          return;
        }

        path.setAttribute(
          "d",
          buildPath({
            x: string.x,
            width: viewport.width,
            height: viewport.height,
            rise: string.rise,
            amplitude: string.amplitude,
            phase: now + string.phaseOffset,
            drift: string.drift,
            release: string.release
          })
        );
        path.setAttribute("stroke", mixColor(string.warm));
        path.setAttribute("opacity", string.opacity.toFixed(3));
      });

      if (glowRef.current) {
        glowRef.current.setAttribute("cx", `${(viewport.width * glowStateRef.current.x).toFixed(2)}`);
        glowRef.current.setAttribute("opacity", glowStateRef.current.opacity.toFixed(3));
      }

      if (!completedRef.current) {
        rafRef.current = window.requestAnimationFrame(render);
      }
    };

    const finish = () => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      onComplete();
    };

    render();

    const timeline = gsap.timeline({
      defaults: { overwrite: true },
      onComplete: () => {
        finish();
      }
    });

    stringStatesRef.current.forEach((string, index) => {
      timeline.to(
        string,
        {
          rise: 1,
          opacity: 1,
          duration: 0.72,
          ease: "power2.out"
        },
        index * 0.06
      );
    });

    timeline.to(
      glowStateRef.current,
      {
        x: 0.9,
        opacity: 0.72,
        duration: 0.82,
        ease: "power1.inOut"
      },
      0.5
    );

    stringStatesRef.current.forEach((string, index) => {
      timeline.to(
        string,
        {
          warm: 1,
          amplitude: 0.78 + index * 0.02,
          duration: 0.42,
          ease: "sine.out"
        },
        0.78
      );
    });

    stringStatesRef.current.forEach((string, index) => {
      timeline.to(
        string,
        {
          amplitude: 0.34 + index * 0.02,
          duration: 0.54,
          ease: "sine.inOut"
        },
        1.22
      );
    });

    stringStatesRef.current.forEach((string) => {
      timeline.to(
        string,
        {
          release: 1,
          opacity: 0,
          duration: 0.74,
          ease: "power2.in"
        },
        1.68
      );
    });

    timeline.to(
      glowStateRef.current,
      {
        opacity: 0,
        duration: 0.54,
        ease: "power1.out"
      },
      1.7
    );

    timeline.to(
      overlayRef.current,
      {
        opacity: 0,
        duration: 0.52,
        ease: "power1.out"
      },
      2.02
    );

    const fallbackTimeout = window.setTimeout(finish, Math.round((TOTAL_DURATION + 0.7) * 1000));

    return () => {
      window.clearTimeout(fallbackTimeout);
      completedRef.current = true;
      timeline.kill();
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [baseStrings, onComplete, viewport.height, viewport.width]);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-50 bg-[#0A0A0A]"
      aria-hidden="true"
    >
      <svg width={viewport.width} height={viewport.height} className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="sutor-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.44)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0)" />
          </radialGradient>
        </defs>

        <ellipse
          ref={glowRef}
          cx={viewport.width * 0.22}
          cy={viewport.height * 0.46}
          rx={viewport.width * 0.12}
          ry={viewport.height * 0.24}
          fill="url(#sutor-glow)"
          opacity="0.16"
        />

        {baseStrings.map((_, index) => (
          <path
            key={index}
            ref={(node) => {
              pathRefs.current[index] = node;
            }}
            d={buildPath({
              x: baseStrings[index].x,
              width: viewport.width,
              height: viewport.height,
              rise: baseStrings[index].rise,
              amplitude: baseStrings[index].amplitude,
              phase: baseStrings[index].phaseOffset,
              drift: baseStrings[index].drift,
              release: baseStrings[index].release
            })}
            stroke="rgb(255, 255, 255)"
            strokeWidth={1.45}
            strokeLinecap="round"
            fill="none"
            opacity={baseStrings[index].opacity}
          />
        ))}
      </svg>
    </div>
  );
}
