/**
 * PingLoop's reusable "LOOP" graphic language: a ball tracing a looping
 * trajectory. LoopMark is the compact symbol (logo/favicon/loading);
 * LoopTrajectory is the large decorative path used in hero/CTA sections.
 */

export function LoopMark({ className = "w-6 h-6", animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M4 20C4 20 8 8 16 8C24 8 24 17 18 18C13.5 18.8 12 14.5 16 13C20 11.5 24 14 26 20"
        stroke="var(--color-lime)"
        strokeWidth="2.75"
        strokeLinecap="round"
        className={animated ? "loop-draw" : undefined}
      />
      <circle cx="26" cy="20" r="3" fill="var(--color-lime)" />
    </svg>
  );
}

export function LoopTrajectory({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M20 380C120 420 220 200 340 160C420 133 470 200 420 250C370 300 300 240 340 180C400 90 540 60 610 110"
        stroke="var(--color-lime)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
        className="loop-draw"
      />
      <circle cx="20" cy="380" r="7" fill="var(--color-lime)" opacity="0.35" />
      <circle cx="610" cy="110" r="6" fill="var(--color-lime)" />
    </svg>
  );
}
