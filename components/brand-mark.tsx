export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="10" fill="#123047" />
      <path
        d="M8 21 H14 L16.5 14 L20 28 L23 18 L25.5 21 H32"
        stroke="#2dd4bf"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="12" r="3.2" fill="#2dd4bf" />
    </svg>
  );
}
