"use client";

interface StringAnimationProps {
  height: number;
  width: number;
  x: number;
  rise: number;
  warm: number;
  amplitude: number;
  phase: number;
  fall: number;
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
  fall
}: {
  x: number;
  width: number;
  height: number;
  rise: number;
  amplitude: number;
  phase: number;
  drift: number;
  fall: number;
}): string {
  const segments = 26;
  const visibleHeight = Math.max(0, height * rise);
  const startY = height - visibleHeight;
  const easedFall = fall * fall;
  const driftTop = drift * easedFall * 0.35;
  const driftBottom = drift * easedFall;
  const dropY = easedFall * height * 0.12;
  const activeAmplitude = amplitude * (1 - easedFall * 0.82);
  const points: string[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const envelope = Math.sin(Math.PI * t);
    const standingWave = Math.sin(phase) * envelope;
    const sympatheticWave = Math.sin(phase * 1.55 + t * Math.PI * 2) * envelope * 0.12;
    const driftX = driftTop + (driftBottom - driftTop) * t;
    const localX = x + driftX + (standingWave + sympatheticWave) * activeAmplitude * Math.min(width * 0.008, 8);
    const y = startY + t * visibleHeight + dropY * t;
    points.push(`${index === 0 ? "M" : "L"} ${localX.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(" ");
}

export function StringAnimation(props: StringAnimationProps) {
  const stroke = mixColor(props.warm);
  const strokeWidth = 1.1 + (1 - Math.abs(0.5 - props.x / props.width) * 2) * 1.15;

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
