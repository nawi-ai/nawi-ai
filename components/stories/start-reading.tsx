"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ApiClientError, apiRequest } from "@/lib/api/browser";
import type { ReadingLevel } from "@/lib/reading-level";

export function StartReading({
  storyId,
  level,
}: {
  storyId: string;
  level: ReadingLevel | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!level) {
      router.push("/niveles");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const data = await apiRequest<{ session: { id: string } }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ storyId, readingLevel: level }),
      });
      router.push(`/leer/${data.session.id}`);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No pudimos abrir el cuento.");
      setPending(false);
    }
  }

  return (
    <div className="magic-start-reading">
      <div className="magic-start-reading__buttons">
        <Button type="button" disabled={pending} onClick={start} className="magic-start-reading__primary">
          <span aria-hidden="true">✦</span>
          {pending ? "Abriendo el libro..." : level ? "Abrir y empezar a leer" : "Elige tu camino"}
          <span aria-hidden="true">→</span>
        </Button>
        <Button href="/cuentos" variant="secondary" className="magic-start-reading__secondary">
          Volver a la biblioteca
        </Button>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
