import { Suspense } from "react";

import { LevelPicker } from "@/components/stories/level-picker";
import { LoadError } from "@/components/ui/load-error";
import { CardSkeleton } from "@/components/ui/skeleton";
import { settle } from "@/lib/api/http";
import { loadIdentity } from "@/lib/auth/identity";

export const metadata = { title: "Niveles" };

export default function NivelesPage() {
  return (
    <div className="magic-levels-page">
      <div className="magic-levels-page__stars" aria-hidden="true" />
      <div className="magic-levels-page__content">
        <header className="magic-levels-page__heading">
          <p>✦ El mapa de Ñawi</p>
          <h1>Elige tu camino de lectura</h1>
          <span>
            Toca un camino y Ñawi te mostrará qué aventura te espera. Podrás cambiarlo cuando quieras.
          </span>
        </header>
        <Suspense
          fallback={
            <div className="magic-levels-page__loading" aria-label="Cargando caminos de lectura">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          }
        >
          <Levels />
        </Suspense>
      </div>
    </div>
  );
}

async function Levels() {
  const result = await settle(() => loadIdentity(), "No pudimos cargar los niveles.");
  if (!result.ok) {
    if (result.reason === "setup" || result.reason === "missing") return null;
    return <LoadError message={result.message} />;
  }
  if (result.data.kind !== "reader") return null;
  return <LevelPicker current={result.data.preferredLevel} />;
}
