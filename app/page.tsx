import { Suspense } from "react";

import { NawiCharacter } from "@/components/brand/nawi-character";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { settle } from "@/lib/api/http";
import { getHomeState } from "@/lib/sessions/service";

export default function HomePage() {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <section>
        <p className="text-sm font-extrabold uppercase tracking-wide text-leaf">Experiencia educativa</p>
        <div className="mt-4">
          <Logo large />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-[36px]">
          ¡Hola! ¿Leemos una aventura?
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
          Descubre cuentos, escucha historias y demuestra todo lo que comprendes.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/niveles">Comenzar a leer</Button>
          <Button href="/progreso" variant="secondary">
            Mi progreso
          </Button>
        </div>
      </section>
      <div className="flex justify-center">
        <NawiCharacter className="h-64 w-64 md:h-80 md:w-80" />
      </div>
      <div className="md:col-span-2">
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <Resume />
        </Suspense>
      </div>
    </div>
  );
}

async function Resume() {
  const result = await settle(() => getHomeState(), "No pudimos recuperar tu lectura.");
  if (!result.ok) {
    if (result.reason === "setup" || result.reason === "missing") return null;
    return <LoadError message={result.message} />;
  }
  const state = result.data;
  if (state.identity.kind !== "reader" || !state.pending) return null;
  const href = state.pending.hasAnswers
    ? `/sesion/${state.pending.id}/preguntas`
    : `/leer/${state.pending.id}`;
  return (
    <section className="rounded-[28px] border border-line bg-surface p-5 shadow-sm">
      <h2 className="text-xl font-extrabold">Puedes continuar tu lectura</h2>
      <p className="mt-1 text-lg">{state.pending.storyTitle}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button href={href}>Continuar</Button>
        <Button href="/niveles" variant="secondary">
          Empezar otra
        </Button>
      </div>
    </section>
  );
}
