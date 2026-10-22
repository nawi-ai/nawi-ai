import { Suspense } from "react";

import { LevelPicker } from "@/components/stories/level-picker";
import { LoadError } from "@/components/ui/load-error";
import { CardSkeleton } from "@/components/ui/skeleton";
import { settle } from "@/lib/api/http";
import { loadIdentity } from "@/lib/auth/identity";

export const metadata = { title: "Niveles" };

export default function NivelesPage() {
  return (
    <div>
      <h1 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-4xl">
        ¿Qué aventura quieres leer hoy?
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">
        Elige cómo quieres empezar. Dentro del cuento, Ñawi ajusta las preguntas según cómo vas comprendiendo. Puedes cambiar de nivel cuando quieras.
      </p>
      <div className="mt-8">
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-3">
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
