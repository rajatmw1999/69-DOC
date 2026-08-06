// Lumera logo — SVG recreation of the brand mark: flowing parallel wave
// lines (gold ↔ indigo) sweeping up to a four-point star.
// To use the original raster logo instead, drop it in /public and swap
// this component for an <img>.
export default function Logo({ size = 28 }) {
  const waves = [];
  for (let i = 0; i < 9; i++) {
    const o = i * 2.6;
    waves.push(
      <path
        key={i}
        d={`M 6 ${58 - o * 0.4} C 26 ${16 + o}, 44 ${74 - o}, 66 ${44 - o * 0.8} S 88 ${18 - o * 0.5}, 91 ${14 - o * 0.5}`}
        fill="none"
        stroke="url(#lumeraGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />,
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Lumera logo">
      <defs>
        <linearGradient id="lumeraGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d4a94e" />
          <stop offset="45%" stopColor="#7c8cf8" />
          <stop offset="80%" stopColor="#d4a94e" />
        </linearGradient>
        <radialGradient id="lumeraStar" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffe9b0" />
          <stop offset="100%" stopColor="#d4a94e" />
        </radialGradient>
      </defs>
      {waves}
      <path
        d="M 91 2 L 93.2 9.8 L 99 12 L 93.2 14.2 L 91 22 L 88.8 14.2 L 83 12 L 88.8 9.8 Z"
        fill="url(#lumeraStar)"
      />
    </svg>
  );
}
