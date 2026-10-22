export function NawiCharacter({ className = "h-56 w-56" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden="true">
      <ellipse cx="110" cy="196" rx="54" ry="10" fill="#E9E5DB" />
      <path d="M46 118c-18 8-24 34-10 48 12-18 28-24 42-18" fill="#2f684b" />
      <path d="M174 118c18 8 24 34 10 48-12-18-28-24-42-18" fill="#2f684b" />
      <ellipse cx="110" cy="126" rx="62" ry="58" fill="#377A58" />
      <ellipse cx="110" cy="138" rx="40" ry="36" fill="#FFF9F0" />
      <circle cx="110" cy="86" r="48" fill="#377A58" />
      <circle cx="86" cy="86" r="18" fill="#FFFFFF" />
      <circle cx="134" cy="86" r="18" fill="#FFFFFF" />
      <circle cx="90" cy="88" r="8" fill="#26352F" />
      <circle cx="138" cy="88" r="8" fill="#26352F" />
      <circle cx="93" cy="85" r="3" fill="#FFFFFF" />
      <circle cx="141" cy="85" r="3" fill="#FFFFFF" />
      <path d="M104 102l6 8 6-8" fill="#F28B72" />
      <path d="M78 58c8-22 24-28 32-16" fill="none" stroke="#26352F" strokeWidth="4" strokeLinecap="round" />
      <path d="M142 58c-8-22-24-28-32-16" fill="none" stroke="#26352F" strokeWidth="4" strokeLinecap="round" />
      <rect x="92" y="146" width="36" height="26" rx="6" fill="#FFD879" />
      <path d="M110 146v26" stroke="#F28B72" strokeWidth="3" />
    </svg>
  );
}
