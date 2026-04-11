"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { StringAnimation } from "@/components/StringAnimation";

interface LoadingAnimationProps {
  onComplete: () => void;
}

interface StringState {
  x: number;
  rise: number;
  warm: number;
  amplitude: number;
  phase: number;
  fall: number;
  drift: number;
  opacity: number;
}

const DURATION = 1.5;

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [, forceRender] = useState(0);
  const strings = useMemo<StringState[]>(
    () =>
      Array.from({ length: 5 }, (_, index) => ({
        x: ((index + 1) * viewport.width) / 6,
        rise: 0,
        warm: 0,
        amplitude: 0,
        phase: index * 0.6,
        fall: 0,
        drift: [-54, -28, 18, 40, 58][index],
        opacity: 1
      })),
    [viewport]
  );
  const glow = useRef({ x: -0.1, opacity: 0.2 });

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
    const ticker = () => forceRender((value) => value + 1);
    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.delayedCall(0.02, onComplete);
      }
    });

    strings.forEach((string, index) => {
      timeline.to(
        string,
        {
          rise: 1,
          duration: 0.4,
          ease: "power2.out"
        },
        index * 0.06
      );
    });

    timeline.to(
      glow.current,
      {
        x: 1.1,
        opacity: 0.85,
        duration: 0.5,
        ease: "power1.inOut"
      },
      0.4
    );

    strings.forEach((string, index) => {
      timeline.to(
        string,
        {
          warm: 1,
          amplitude: 1,
          duration: 0.42,
          ease: "sine.inOut"
        },
        0.44 + index * 0.04
      );
    });

    timeline.to(
      overlayRef.current,
      {
        backgroundColor: "#F8F8F6",
        duration: 0.58,
        ease: "power1.inOut"
      },
      0.92
    );

    strings.forEach((string) => {
      timeline.to(
        string,
        {
          fall: 1,
          opacity: 0,
          duration: 0.58,
          ease: "power2.in"
        },
        0.92
      );
    });

    const phaseTween = gsap.to(strings, {
      phase: "+=16",
      duration: DURATION,
      ease: "none",
      repeat: -1,
      paused: false
    });

    gsap.ticker.add(ticker);
    return () => {
      timeline.kill();
      phaseTween.kill();
      gsap.ticker.remove(ticker);
    };
  }, [onComplete, strings]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]"
      aria-hidden="true"
    >
      <svg width={viewport.width} height={viewport.height} className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="sutor-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.75)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0)" />
          </radialGradient>
        </defs>
        <ellipse
          cx={viewport.width * glow.current.x}
          cy={viewport.height * 0.46}
          rx={viewport.width * 0.18}
          ry={viewport.height * 0.34}
          fill="url(#sutor-glow)"
          opacity={glow.current.opacity}
        />
        {strings.map((string, index) => (
          <StringAnimation
            key={index}
            height={viewport.height}
            width={viewport.width}
            x={string.x}
            rise={string.rise}
            warm={string.warm}
            amplitude={string.amplitude}
            phase={string.phase}
            fall={string.fall}
            drift={string.drift}
            opacity={string.opacity}
          />
        ))}
      </svg>
    </div>
  );
}
