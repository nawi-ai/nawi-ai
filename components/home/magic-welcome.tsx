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

function MagicCursor() {
  const layer = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    let lastSpark = 0;
    const move = (event: PointerEvent) => {
      if (!layer.current || !core.current) return;
      core.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      core.current.style.opacity = "1";
      if (Date.now() - lastSpark < 30) return;
      lastSpark = Date.now();

      const spark = document.createElement("span");
      spark.className = "magic-home__cursor-spark";
      spark.textContent = Math.random() > 0.34 ? "✦" : "•";
      spark.style.setProperty("--spark-size", `${12 + Math.random() * 10}px`);
      spark.style.setProperty("--spark-drift", `${(Math.random() - 0.5) * 34}px`);
      spark.style.left = `${event.clientX}px`;
      spark.style.top = `${event.clientY}px`;
      layer.current.appendChild(spark);
      window.setTimeout(() => spark.remove(), 950);
    };

    const burst = (event: PointerEvent) => {
      if (!layer.current) return;
      const ring = document.createElement("span");
      ring.className = "magic-home__cursor-burst";
      ring.style.left = `${event.clientX}px`;
      ring.style.top = `${event.clientY}px`;
      layer.current.appendChild(ring);
      window.setTimeout(() => ring.remove(), 900);
    };

    const leave = () => {
      if (core.current) core.current.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", burst, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", burst);
      window.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={layer} className="magic-home__cursor-layer" aria-hidden="true">
      <span ref={core} className="magic-home__cursor-core">
        <i className="magic-home__wand-tip">✦</i>
        <b className="magic-home__wand-handle" />
      </span>
    </div>
  );
}

export function MagicWelcome({ enterHref }: { enterHref: string }) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  const enter = useCallback(() => {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => router.push(enterHref), 1500);
  }, [enterHref, entering, router]);

  return (
    <section className={`magic-home ${entering ? "magic-home--entering" : ""}`}>
      <MagicCursor />
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
            src="/nawi-mago.png"
            alt="Ñawi, una capibara maga con un libro brillante"
            width={1211}
            height={1299}
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
