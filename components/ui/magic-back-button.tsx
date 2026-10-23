"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  useEffect(() => {
    router.prefetch(fallbackHref);
  }, [fallbackHref, router]);

  function goBack() {
    if (onBack) {
      onBack();
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }

  return (
    <button
      type="button"
      className={`magic-back-button ${className}`.trim()}
      aria-label={ariaLabel}
      onClick={goBack}
    >
      <span className="magic-back-button__glow" aria-hidden="true" />
      <span className="magic-back-button__trail" aria-hidden="true"><i /><i /><i /></span>
      <ArrowLeft className="magic-back-button__arrow" aria-hidden="true" strokeWidth={1.8} />
    </button>
  );
}
