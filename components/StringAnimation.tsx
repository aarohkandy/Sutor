"use client";

interface StringAnimationProps {
  height: number;
  width: number;
  x: number;
  rise: number;
  warm: number;
  amplitude: number;
  phase: number;
  release: number;
  drift: number;
  opacity: number;
}

function mixColor(progress: number): string {
  const start = [255, 255, 255];
  const end = [247, 243, 233];
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
  const segments = 28;
  const visibleHeight = Math.max(0, height * rise);
  const startY = height - visibleHeight;
  const easedRelease = release * release;
  const topDrift = drift * easedRelease * 0.28;
  const bottomDrift = drift * easedRelease * 0.92;
  const verticalSlip = easedRelease * height * 0.075;
  const activeAmplitude = amplitude * (1 - easedRelease * 0.78);
  const points: string[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const envelope = Math.sin(Math.PI * t);
    const firstMode = Math.sin(phase) * envelope;
    const secondMode = Math.sin(phase * 1.65 + x * 0.0025) * Math.sin(2 * Math.PI * t) * 0.16;
    const releaseDrift = topDrift + (bottomDrift - topDrift) * t;
    const releaseSag = easedRelease * height * 0.028 * envelope * envelope;
    const wave = (firstMode + secondMode) * activeAmplitude;
    const localX = x + releaseDrift + wave * Math.min(width * 0.008, 8);
    const y = startY + t * visibleHeight + verticalSlip * t + releaseSag;

    points.push(`${index === 0 ? "M" : "L"} ${localX.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(" ");
}

export function StringAnimation(props: StringAnimationProps) {
  const stroke = mixColor(props.warm);
  const strokeWidth = 1 + (1 - Math.abs(0.5 - props.x / props.width) * 2) * 1.1;

  return (
    <path
      d={buildPath(props)}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
      opacity={props.opacity}
    />
  );
}
