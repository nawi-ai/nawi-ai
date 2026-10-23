"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Notice } from "@/components/ui/notice";
import { MagicBackButton } from "@/components/ui/magic-back-button";
import { ApiClientError, apiRequest } from "@/lib/api/browser";
import { LEVELS, type ReadingLevel } from "@/lib/reading-level";

const LEVEL_SCENES: Record<
  ReadingLevel,
  {
    theme: "meadow" | "forest" | "summit";
    destination: string;
    symbol: string;
    path: string;
  }
> = {
  1: {
    theme: "meadow",
    destination: "Sendero de las pistas",
    symbol: "✦",
    path: "M 500 500 C 445 430 335 390 275 320 C 215 250 195 178 165 92",
  },
  2: {
    theme: "forest",
    destination: "Bosque de los secretos",
    symbol: "☾",
    path: "M 500 500 C 540 415 455 350 505 275 C 555 205 470 150 500 72",
  },
  3: {
    theme: "summit",
    destination: "Cumbre de las ideas",
    symbol: "★",
    path: "M 500 500 C 565 430 660 395 720 325 C 785 250 810 174 845 92",
  },
};

export function LevelPicker({ current }: { current: ReadingLevel | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadingLevel>(current ?? 1);
  const [hovered, setHovered] = useState<ReadingLevel | null>(null);
  const [pending, setPending] = useState<ReadingLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = hovered ?? selected;
  const selectedLevel = LEVELS.find((level) => level.id === selected) ?? LEVELS[0];
  const selectedScene = LEVEL_SCENES[selected];

  useEffect(() => {
    router.prefetch("/cuentos");
  }, [router]);

  function select(level: ReadingLevel) {
    if (pending !== null) return;
    setSelected(level);
    setError(null);
  }

  function moveSelection(direction: -1 | 1) {
    if (pending !== null) return;
    const index = LEVELS.findIndex((level) => level.id === selected);
    const nextIndex = (index + direction + LEVELS.length) % LEVELS.length;
    select(LEVELS[nextIndex].id);
  }

  async function choose(level: ReadingLevel) {
    setPending(level);
    setHovered(null);
    setError(null);

    try {
      const travelTime = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420;
      await Promise.all([
        apiRequest("/api/profile", {
          method: "POST",
          body: JSON.stringify({ preferredLevel: level }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, travelTime)),
      ]);
      setPending(null);
      router.push("/cuentos");
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No pudimos guardar el nivel.");
      setPending(null);
    }
  }

  return (
    <section
      className="magic-route-picker"
      data-active={active}
      data-traveling={pending ?? ""}
    >
      <MagicBackButton
        className="magic-route-picker__back"
        fallbackHref="/"
        ariaLabel="Volver al portal"
      />

      <div
        className="magic-route-map"
        role="radiogroup"
        aria-label="Tres caminos de lectura"
        onMouseLeave={() => setHovered(null)}
      >
        <div className="magic-route-map__sky" aria-hidden="true">
          <span className="magic-route-map__moon" />
          <span className="magic-route-map__horizon magic-route-map__horizon--far" />
          <span className="magic-route-map__horizon magic-route-map__horizon--near" />
          <span className="magic-route-map__trees" />
          <span className="magic-route-map__mountains" />
        </div>

        <svg
          className="magic-route-map__paths"
          viewBox="0 0 1000 540"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {LEVELS.map((level) => {
            const scene = LEVEL_SCENES[level.id];
            return (
              <g key={level.id} data-route={level.id} data-active={active === level.id}>
                <path
                  className="magic-route-map__path-hit"
                  d={scene.path}
                  onMouseEnter={() => setHovered(level.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => select(level.id)}
                />
                <path className="magic-route-map__path-aura" d={scene.path} />
                <path className="magic-route-map__path-shadow" d={scene.path} />
                <path className="magic-route-map__path-rim" d={scene.path} />
                <path className="magic-route-map__path-ground" d={scene.path} />
                <path className="magic-route-map__path-light" d={scene.path} />
              </g>
            );
          })}
        </svg>

        <div className="magic-route-map__traveler" aria-hidden="true">
          <span className="magic-route-map__traveler-glow" />
          <Image
            src="/nawi-mago.webp"
            alt=""
            width={1211}
            height={1299}
            sizes="260px"
          />
        </div>

        {LEVELS.map((level) => {
          const scene = LEVEL_SCENES[level.id];
          const isSelected = selected === level.id;

          return (
            <button
              key={level.id}
              className={`magic-route-destination magic-route-destination--${level.id}`}
              data-theme={scene.theme}
              data-selected={isSelected}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={pending !== null}
              onMouseEnter={() => setHovered(level.id)}
              onFocus={() => setHovered(level.id)}
              onBlur={() => setHovered(null)}
              onClick={() => select(level.id)}
            >
              <span className="magic-route-destination__portal" aria-hidden="true">
                {scene.symbol}
              </span>
              <span className="magic-route-destination__copy">
                <small>{scene.destination}</small>
                <strong>{level.name}</strong>
                <em>{level.difficulty}</em>
              </span>
              <span className="magic-route-destination__status" aria-hidden="true">
                {isSelected ? "✓ Elegido" : "Elegir"}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="magic-mobile-route"
        data-theme={selectedScene.theme}
        aria-label={`Camino seleccionado: ${selectedScene.destination}`}
      >
        <div className="magic-mobile-route__scene" aria-hidden="true">
          <span className="magic-mobile-route__orb">{selectedScene.symbol}</span>
          <span className="magic-mobile-route__land magic-mobile-route__land--far" />
          <span className="magic-mobile-route__land magic-mobile-route__land--near" />
          <span className="magic-mobile-route__trail" />
          <span className="magic-mobile-route__goal" />
          <span className="magic-mobile-route__traveler">
            <Image src="/nawi-mago.webp" alt="" width={1211} height={1299} sizes="180px" />
          </span>
        </div>

        <button
          className="magic-mobile-route__arrow magic-mobile-route__arrow--left"
          type="button"
          disabled={pending !== null}
          aria-label="Ver el camino anterior"
          onClick={() => moveSelection(-1)}
        >
          ←
        </button>
        <button
          className="magic-mobile-route__arrow magic-mobile-route__arrow--right"
          type="button"
          disabled={pending !== null}
          aria-label="Ver el siguiente camino"
          onClick={() => moveSelection(1)}
        >
          →
        </button>

        <div className="magic-mobile-route__copy">
          <small>
            Camino {selectedLevel.id} de {LEVELS.length}
          </small>
          <h2>{selectedScene.destination}</h2>
          <strong>{selectedLevel.name}</strong>
          <p>{selectedLevel.description}</p>
          <span>{selectedLevel.difficulty}</span>
        </div>

        <div className="magic-mobile-route__dots" aria-hidden="true">
          {LEVELS.map((level) => (
            <i key={level.id} data-active={selected === level.id} />
          ))}
        </div>
      </div>

      <div className="magic-route-confirm" aria-live="polite">
        <div>
          <small>Camino elegido</small>
          <strong>{selectedScene.destination}</strong>
          <span>{selectedLevel.details[0]}</span>
        </div>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => choose(selected)}
        >
          <span aria-hidden="true">✦</span>
          {pending === selected ? "Ñawi está viajando..." : "Confirmar este camino"}
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {error ? (
        <div className="magic-route-picker__notice">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      <p className="magic-route-picker__disclaimer">
        Los caminos orientan la experiencia y no equivalen a una evaluación psicopedagógica.
      </p>
    </section>
  );
}
