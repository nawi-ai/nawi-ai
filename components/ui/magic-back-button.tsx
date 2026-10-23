"use client";

import { useRouter } from "next/navigation";

type MagicBackButtonProps = {
  ariaLabel?: string;
  className?: string;
  fallbackHref: string;
  onBack?: () => void;
};

export function MagicBackButton({
  ariaLabel = "Volver a la pantalla anterior",
  className = "",
  fallbackHref,
  onBack,
}: MagicBackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (onBack) {
      onBack();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      className={`magic-back-button ${className}`.trim()}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={goBack}
    >
      <span className="magic-back-button__glow" aria-hidden="true" />
      <span className="magic-back-button__arrow" aria-hidden="true">←</span>
    </button>
  );
}
