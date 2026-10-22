"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Notice } from "@/components/ui/notice";
import { ApiClientError, apiRequest } from "@/lib/api/browser";
import { LEVELS, type ReadingLevel } from "@/lib/reading-level";

const LEVEL_GUIDANCE: Record<ReadingLevel, string> = {
  1: "Aquí encontraremos pistas claras y conoceremos a cada personaje paso a paso.",
  2: "Aquí uniremos pistas para descubrir lo que sienten y piensan los personajes.",
  3: "Aquí pensaremos más profundo y defenderemos nuestras propias ideas.",
};

const LEVEL_SCENES: Record<
  ReadingLevel,
  { theme: "meadow" | "forest" | "summit"; destination: string; symbol: string }
> = {
  1: { theme: "meadow", destination: "Sendero de las pistas", symbol: "✦" },
  2: { theme: "forest", destination: "Bosque de los secretos", symbol: "☾" },
  3: { theme: "summit", destination: "Cumbre de las ideas", symbol: "★" },
};

export function LevelPicker({ current }: { current: ReadingLevel | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadingLevel>(current ?? 1);
  const [pending, setPending] = useState<ReadingLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedLevel = LEVELS.find((level) => level.id === selected) ?? LEVELS[0];

  async function choose(level: ReadingLevel) {
    setPending(level);
    setError(null);
    try {
      await apiRequest("/api/profile", {
        method: "POST",
        body: JSON.stringify({ preferredLevel: level }),
      });
      router.push("/cuentos");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No pudimos guardar el nivel.");
      setPending(null);
    }
  }

  return (
    <section className="magic-level-picker">
      <aside className="magic-level-picker__guide" aria-live="polite">
        <Link className="magic-level-picker__back" href="/">
          <span aria-hidden="true">←</span> Volver al portal
        </Link>
        <div className="magic-level-picker__speech">
          <p>{LEVEL_GUIDANCE[selected]}</p>
        </div>
        <div className="magic-level-picker__nawi" aria-hidden="true">
          <span className="magic-level-picker__halo" />
          <Image
            src="/nawi-mago.png"
            alt=""
            width={1211}
            height={1299}
            loading="eager"
          />
        </div>
      </aside>

      <div className="magic-level-picker__choices">
        <div className="magic-level-picker__list" role="radiogroup" aria-label="Caminos de lectura">
          {LEVELS.map((level) => {
            const isSelected = selected === level.id;
            const scene = LEVEL_SCENES[level.id];

            return (
              <button
                key={level.id}
                className={`magic-path-card magic-path-card--${scene.theme}`}
                data-selected={isSelected}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelected(level.id);
                  setError(null);
                }}
              >
                <span className="magic-path-card__scene" aria-hidden="true">
                  <i className="magic-path-card__orb">{scene.symbol}</i>
                  <i className="magic-path-card__land magic-path-card__land--back" />
                  <i className="magic-path-card__land magic-path-card__land--front" />
                  <i className="magic-path-card__trail">
                    <b />
                  </i>
                  <i className="magic-path-card__destination" />
                </span>

                <span className="magic-path-card__copy">
                  <span className="magic-path-card__eyebrow">
                    Camino {level.id} · {scene.destination}
                  </span>
                  <strong>{level.name}</strong>
                  <span className="magic-path-card__description">{level.description}</span>
                  <span className="magic-path-card__meta">
                    <em>{level.difficulty}</em>
                    <span>{level.details[0]}</span>
                  </span>
                </span>

                <span className="magic-path-card__choice" aria-hidden="true">
                  <span>{isSelected ? "Elegido" : "Explorar"}</span>
                  <i>{isSelected ? "✓" : "→"}</i>
                </span>
              </button>
            );
          })}
        </div>

        <div className="magic-level-picker__action">
          <p>
            Elegiste <strong>{selectedLevel.name}</strong>
          </p>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => choose(selected)}
          >
            <span aria-hidden="true">✦</span>
            {pending === selected ? "Abriendo la biblioteca..." : `Entrar a ${selectedLevel.name}`}
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {error ? (
          <div className="magic-level-picker__notice">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : null}

        <p className="magic-level-picker__disclaimer">
          Los caminos orientan la experiencia y no equivalen a una evaluación psicopedagógica.
        </p>
      </div>
    </section>
  );
}
