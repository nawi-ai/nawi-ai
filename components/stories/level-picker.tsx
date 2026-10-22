"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ApiClientError, apiRequest } from "@/lib/api/browser";
import { LEVELS, type ReadingLevel } from "@/lib/reading-level";

export function LevelPicker({ current }: { current: ReadingLevel | null }) {
  const router = useRouter();
  const [pending, setPending] = useState<ReadingLevel | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {LEVELS.map((level) => (
          <article
            key={level.id}
            className="flex flex-col rounded-[28px] border border-line bg-surface p-5 shadow-sm"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sun text-2xl font-extrabold"
              aria-hidden="true"
            >
              {level.id}
            </div>
            <h2 className="mt-4 text-2xl font-extrabold">{level.name}</h2>
            <p className="mt-1 text-sm font-extrabold text-leaf">{level.difficulty}</p>
            <p className="mt-3 flex-1 text-base leading-7 text-muted">{level.description}</p>
            <ul className="mt-4 space-y-1 text-base">
              {level.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full"
              type="button"
              variant={current === level.id ? "sun" : "primary"}
              disabled={pending !== null}
              aria-pressed={current === level.id}
              onClick={() => choose(level.id)}
            >
              {pending === level.id ? "Guardando..." : "Elegir este nivel"}
            </Button>
          </article>
        ))}
      </div>
      {error ? (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
      <p className="mt-6 text-sm leading-6 text-muted">
        Estos niveles orientan la experiencia. No equivalen a una evaluación psicopedagógica.
      </p>
    </div>
  );
}
