"use client";

import { useEffect, useRef } from "react";

export function MagicCursor() {
  const layer = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    root.dataset.magicCursor = "true";

    let frame = 0;
    let x = -100;
    let y = -100;
    let lastSpark = 0;

    const paint = () => {
      frame = 0;
      if (!core.current) return;
      core.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      core.current.style.opacity = "1";
    };

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(paint);

      if (reducedMotion || document.hidden || Date.now() - lastSpark < 82 || !layer.current) return;
      lastSpark = Date.now();
      const spark = document.createElement("span");
      spark.className = "magic-home__cursor-spark";
      spark.textContent = Math.random() > 0.38 ? "✦" : "•";
      spark.style.setProperty("--spark-size", `${10 + Math.random() * 7}px`);
      spark.style.setProperty("--spark-drift", `${(Math.random() - 0.5) * 28}px`);
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      layer.current.appendChild(spark);
      window.setTimeout(() => spark.remove(), 760);
    };

    const burst = (event: PointerEvent) => {
      if (reducedMotion || !layer.current) return;
      const ring = document.createElement("span");
      ring.className = "magic-home__cursor-burst";
      ring.style.left = `${event.clientX}px`;
      ring.style.top = `${event.clientY}px`;
      layer.current.appendChild(ring);
      window.setTimeout(() => ring.remove(), 620);
    };

    const leave = () => {
      if (core.current) core.current.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", burst, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      delete root.dataset.magicCursor;
      if (frame) window.cancelAnimationFrame(frame);
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
