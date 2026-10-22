import Link from "next/link";
import { Suspense } from "react";

import { StoryArt } from "@/components/brand/story-art";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/load-error";
import { CardSkeleton } from "@/components/ui/skeleton";
import { settle } from "@/lib/api/http";
import { LEVELS } from "@/lib/reading-level";
import { getProgress } from "@/lib/sessions/service";
import { listStoryCardsForLevel } from "@/lib/stories/catalog";
import type { StoryState } from "@/lib/sessions/views";

export const metadata = { title: "Cuentos" };

export default function CuentosPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold md:text-4xl">Elige tu próxima aventura</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">
        Aquí aparecen los cuentos del nivel que elegiste.
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
          <Library />
        </Suspense>
      </div>
    </div>
  );
}

async function Library() {
  const progress = await settle(
    () => getProgress(),
    "No pudimos cargar tu historial. Los cuentos siguen aquí.",
  );
  const states: StoryState[] = progress.ok ? progress.data.storyStates : [];
  const loadMessage = progress.ok || progress.reason !== "error" ? null : progress.message;
  const preferred = progress.ok ? progress.data.preferredLevel : null;
  const level = LEVELS.find((item) => item.id === preferred);
  const stories = preferred === null ? [] : listStoryCardsForLevel(preferred);

  if (preferred === null) {
    return (
      <div>
        {loadMessage ? <LoadError message={loadMessage} /> : null}
        <p className="text-lg leading-8">Elige un nivel para ver sus cuentos.</p>
        <Button href="/niveles" className="mt-4">
          Elegir nivel
        </Button>
      </div>
    );
  }

  if (stories.length === 0) {
    return <p className="text-lg">Todavía no hay cuentos en {level?.name ?? "este nivel"}.</p>;
  }

  return (
    <div>
      {loadMessage ? <LoadError message={loadMessage} /> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {stories.map((story) => {
          const state = states.find((item) => item.storyId === story.id);
          const level = LEVELS.find((item) => item.id === story.level);
          return (
            <article key={story.id} className="flex flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-sm">
              <StoryArt storyId={story.id} />
              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm font-extrabold text-leaf">
                  {level?.name} · {story.minutes} min
                  {state?.status === "completed" ? " · Leído" : ""}
                  {state?.status === "in_progress" ? " · En progreso" : ""}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight">{story.title}</h2>
                <p className="mt-2 flex-1 text-base leading-7 text-muted">{story.summary}</p>
                <Button href={`/cuentos/${story.id}`} className="mt-5">
                  Leer cuento
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        ¿Quieres otro nivel? <Link href="/niveles" className="font-extrabold text-leaf">Cambiar nivel</Link>
      </p>
    </div>
  );
}
