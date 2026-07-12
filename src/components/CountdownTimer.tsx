"use client";

/**
 * Circular SVG countdown ring with the remaining seconds in the
 * middle. Purely presentational — the parent owns the clock.
 */
export function CountdownTimer({
  total,
  remaining,
}: {
  total: number;
  remaining: number;
}) {
  const size = 176;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? remaining / total : 0;
  const offset = circumference * (1 - progress);
  const done = remaining <= 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={done ? "var(--success)" : "url(#unlock-gradient)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={done ? 0 : offset}
          className="ring-progress"
        />
        <defs>
          <linearGradient id="unlock-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="timer"
        aria-live="polite"
        aria-label={done ? "Unlocked" : `${remaining} seconds remaining`}
      >
        {done ? (
          <>
            <svg
              className="h-10 w-10 text-success animate-fade-in"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span className="mt-1 text-sm font-medium text-success">
              Unlocked
            </span>
          </>
        ) : (
          <>
            <span className="text-5xl font-bold tabular-nums tracking-tight">
              {remaining}
            </span>
            <span className="mt-1 text-xs uppercase tracking-widest text-muted">
              seconds
            </span>
          </>
        )}
      </div>
    </div>
  );
}
