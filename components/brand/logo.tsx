import Link from "next/link";

export function Logo({ large = false }: { large?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-full" aria-label="Ñawi, inicio">
      <span className={large ? "h-14 w-14" : "h-10 w-10"} aria-hidden="true">
        <OwlMark />
      </span>
      <span className="leading-none">
        <span className={large ? "block text-5xl font-extrabold tracking-tight" : "block text-2xl font-extrabold tracking-tight"}>
          Ñawi
        </span>
        {large ? <span className="mt-1 block text-base font-bold text-muted">Tu compa de lectura IA</span> : null}
      </span>
    </Link>
  );
}

function OwlMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <circle cx="32" cy="32" r="30" fill="#377A58" />
      <circle cx="32" cy="34" r="18" fill="#FFF9F0" />
      <circle cx="24" cy="30" r="7" fill="#FFFFFF" />
      <circle cx="40" cy="30" r="7" fill="#FFFFFF" />
      <circle cx="25" cy="31" r="3" fill="#26352F" />
      <circle cx="41" cy="31" r="3" fill="#26352F" />
      <path d="M30 38l2 3 2-3" fill="#F28B72" />
    </svg>
  );
}
