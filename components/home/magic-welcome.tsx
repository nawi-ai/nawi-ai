"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const STARS = Array.from({ length: 52 }, (_, index) => ({
  id: index,
  left: `${2 + ((index * 37) % 96)}%`,
  top: `${3 + ((index * 53) % 92)}%`,
  symbol: index % 9 === 0 ? "✦" : index % 5 === 0 ? "✧" : "•",
  depth: index % 3,
  delay: `${-(index % 11) * 0.37}s`,
}));

export function MagicWelcome({ enterHref }: { enterHref: string }) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => {
    router.prefetch(enterHref);
    const resetPortal = () => setEntering(false);
    window.addEventListener("pageshow", resetPortal);

    return () => {
      window.removeEventListener("pageshow", resetPortal);
      if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
    };
  }, [enterHref, router]);

  const enter = useCallback(() => {
    if (entering) return;
    setEntering(true);
    const transitionTime = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420;

    navigationTimer.current = window.setTimeout(() => {
      navigationTimer.current = null;
      setEntering(false);
      router.push(enterHref);
    }, transitionTime);
  }, [enterHref, entering, router]);

  return (
    <section className={`magic-home ${entering ? "magic-home--entering" : ""}`}>
      <div className="magic-home__sky" aria-hidden="true">
        <span className="magic-home__galaxy" />
        <span className="magic-home__nebula magic-home__nebula--one" />
        <span className="magic-home__nebula magic-home__nebula--two" />
        <span className="magic-home__nebula magic-home__nebula--three" />
        <span className="magic-home__planet magic-home__planet--one" />
        <span className="magic-home__planet magic-home__planet--two" />
        {STARS.map((star) => (
          <span
            key={star.id}
            className={`magic-home__star magic-home__star--${star.depth}`}
            style={{
              "--star-index": star.id,
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
            } as React.CSSProperties}
          >
            {star.symbol}
          </span>
        ))}
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={`magic-home__meteor magic-home__meteor--${index + 1}`} />
        ))}
      </div>

      <div
        className="magic-home__welcome"
        role="button"
        tabIndex={0}
        aria-label="Entrar a la biblioteca mágica de Ñawi"
        aria-busy={entering}
        onClick={enter}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            enter();
          }
        }}
      >
        <div className="magic-home__character" aria-label="Ñawi, guardián mágico de las historias">
          <span className="magic-home__ring magic-home__ring--one" aria-hidden="true" />
          <span className="magic-home__ring magic-home__ring--two" aria-hidden="true" />
          <span className="magic-home__glow" aria-hidden="true" />
          <Image
            src="/nawi-mago.webp"
            alt="Ñawi, una capibara maga con un libro brillante"
            width={1211}
            height={1299}
            sizes="(max-width: 700px) 88vw, 570px"
            priority
          />
        </div>

        <div className="magic-home__copy">
          <span>Hola, soy</span>
          <h1>Ñawi</h1>
          <p>
            El guardián mágico de las historias.
            <br />
            ¿Descubrimos una juntos?
          </p>
          <small>
            <i>✦</i> Haz clic en cualquier lugar para entrar <i>✦</i>
          </small>
        </div>
      </div>

      {entering ? (
        <div className="magic-home__portal" aria-hidden="true">
          <span className="magic-home__portal-ring magic-home__portal-ring--one" />
          <span className="magic-home__portal-ring magic-home__portal-ring--two" />
          <span className="magic-home__portal-ring magic-home__portal-ring--three" />
          <span className="magic-home__portal-core">✦</span>
        </div>
      ) : null}
    </section>
  );
}
