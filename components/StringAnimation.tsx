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
  const segments = 20;
  const visibleHeight = Math.max(0, height * rise);
  const startY = height - visibleHeight;
  const easedFall = fall * fall;
  const dropY = easedFall * height * 0.55;
  const driftX = drift * easedFall;
  const left = x + driftX;
  const points: string[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const y = startY + t * visibleHeight + dropY;
    const envelope = Math.sin(Math.PI * t);
    const wave = Math.sin(t * Math.PI * 4.5 + phase) * amplitude * envelope;
    const localX = left + wave * Math.min(width * 0.03, 18);
    points.push(`${index === 0 ? "M" : "L"} ${localX.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(" ");
}

export function StringAnimation(props: StringAnimationProps) {
  const stroke = mixColor(props.warm);
  const width = 1.1 + (1 - Math.abs(0.5 - props.x / props.width) * 2) * 1.3;

  return (
    <path
      d={buildPath(props)}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
      opacity={props.opacity}
    />
  );
}
