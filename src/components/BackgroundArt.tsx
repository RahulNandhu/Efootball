export default function BackgroundArt() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      <svg
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1400px] max-w-none h-auto opacity-100"
        viewBox="0 0 1200 620"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="var(--pitch-line)" strokeWidth="2.5">
          <rect x="40" y="40" width="1120" height="560" rx="4" />
          <line x1="600" y1="40" x2="600" y2="600" />
          <circle cx="600" cy="320" r="95" />
          <circle cx="600" cy="320" r="4" fill="var(--pitch-line)" stroke="none" />

          <rect x="40" y="160" width="180" height="320" />
          <rect x="40" y="240" width="70" height="160" />
          <circle cx="230" cy="320" r="4" fill="var(--pitch-line)" stroke="none" />
          <path d="M 220 220 A 95 95 0 0 1 220 420" />

          <rect x="980" y="160" width="180" height="320" />
          <rect x="1090" y="240" width="70" height="160" />
          <circle cx="970" cy="320" r="4" fill="var(--pitch-line)" stroke="none" />
          <path d="M 980 220 A 95 95 0 0 0 980 420" />

          <path d="M 40 40 A 24 24 0 0 1 64 64" />
          <path d="M 1136 40 A 24 24 0 0 0 1160 64" />
          <path d="M 40 600 A 24 24 0 0 0 64 576" />
          <path d="M 1136 600 A 24 24 0 0 1 1160 576" />
        </g>
      </svg>
    </div>
  );
}
