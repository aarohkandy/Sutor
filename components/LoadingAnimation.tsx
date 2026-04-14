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

const DURATION = 2.4;

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [, forceRender] = useState(0);
  const strings = useMemo<StringState[]>(
    () => {
      const center = viewport.width / 2;
      const gap = Math.max(20, Math.min(viewport.width * 0.03, 34));

      return Array.from({ length: 5 }, (_, index) => ({
        x: center + (index - 2) * gap,
        rise: 0,
        warm: 0,
        amplitude: 0,
        phase: index * 0.2,
        fall: 0,
        drift: [-32, -16, 0, 16, 32][index],
        opacity: 0
      }));
    },
    [viewport]
  );
  const glow = useRef({ x: -0.08, opacity: 0.1 });

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
    const finish = () => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      onComplete();
    };
    const ticker = () => forceRender((value) => value + 1);
    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.delayedCall(0.02, finish);
      }
    });
    const fallbackTimeout = window.setTimeout(finish, 3300);

    strings.forEach((string, index) => {
      timeline.to(
        string,
        {
          rise: 1,
          opacity: 1,
          duration: 0.66,
          ease: "power2.out"
        },
        index * 0.07
      );
    });

    timeline.to(
      glow.current,
        {
          x: 1.06,
          opacity: 0.72,
          duration: 0.86,
          ease: "power1.inOut"
        },
      0.56
    );

    strings.forEach((string, index) => {
      timeline.to(
        string,
        {
          warm: 1,
          amplitude: 0.8 + index * 0.02,
          duration: 0.48,
          ease: "sine.out"
        },
        0.78
      );
    });

    strings.forEach((string, index) => {
      timeline.to(
        string,
        {
          amplitude: 0.34 + index * 0.02,
          duration: 0.58,
          ease: "sine.inOut"
        },
        1.18
      );
    });

    timeline.to(
      overlayRef.current,
      {
        backgroundColor: "#111111",
        duration: 0.78,
        ease: "power1.inOut"
      },
      1.62
    );

    strings.forEach((string) => {
      timeline.to(
        string,
        {
          fall: 1,
          opacity: 0,
          duration: 0.88,
          ease: "power2.in"
        },
        1.62
      );
    });

    const phaseTween = gsap.to(strings, {
      phase: "+=14",
      duration: DURATION,
      ease: "none",
      repeat: -1,
      paused: false
    });

    gsap.ticker.add(ticker);
    return () => {
      window.clearTimeout(fallbackTimeout);
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
            <stop offset="0%" stopColor="rgba(201,168,76,0.58)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0)" />
          </radialGradient>
        </defs>
        <ellipse
          cx={viewport.width * glow.current.x}
          cy={viewport.height * 0.46}
          rx={viewport.width * 0.14}
          ry={viewport.height * 0.26}
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
