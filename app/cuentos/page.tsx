import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { MagicBookshelf, type MagicBookItem } from "@/components/stories/magic-bookshelf";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/load-error";
import { settle } from "@/lib/api/http";
import { LEVELS } from "@/lib/reading-level";
import { getProgress } from "@/lib/sessions/service";
import { listStoryCardsForLevel } from "@/lib/stories/catalog";
import type { StoryState } from "@/lib/sessions/views";

export const metadata = { title: "Cuentos" };

export default function CuentosPage() {
  return (
    <div className="magic-library-page">
      <div className="magic-library-page__stars" aria-hidden="true" />
      <div className="magic-library-page__content">
        <nav className="magic-library-nav" aria-label="Biblioteca">
          <Link href="/niveles"><span aria-hidden="true">←</span> Cambiar camino</Link>
          <Link href="/progreso">Mi progreso <span aria-hidden="true">✦</span></Link>
        </nav>

        <header className="magic-library-hero">
          <div className="magic-library-hero__copy">
            <p>✦ La biblioteca encantada</p>
            <h1>Elige el libro que te llama</h1>
            <span>
              Cada portada esconde una aventura. Acércate, descubre su magia y abre la que más te intrigue.
            </span>
          </div>
          <div className="magic-library-hero__nawi" aria-hidden="true">
            <span />
            <Image src="/nawi-mago.png" alt="" width={1211} height={1299} priority />
          </div>
        </header>

        <div className="magic-library-page__shelf">
        <Suspense
          fallback={
            <div className="magic-library-loading" aria-label="Abriendo la biblioteca">
              <span />
              <span />
              <span />
            </div>
          }
        >
          <Library />
        </Suspense>
        </div>
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
      <div className="magic-library-empty">
        {loadMessage ? <LoadError message={loadMessage} /> : null}
        <p className="text-lg leading-8">Elige un nivel para ver sus cuentos.</p>
        <Button href="/niveles" className="mt-4">
          Elegir nivel
        </Button>
      </div>
    );
  }

  if (stories.length === 0) {
    return <p className="magic-library-empty">Todavía no hay cuentos en {level?.name ?? "este nivel"}.</p>;
  }

  const books: MagicBookItem[] = stories.map((story) => {
    const state = states.find((item) => item.storyId === story.id);
    const storyLevel = LEVELS.find((item) => item.id === story.level);
    const status = state?.status === "completed"
      ? "Leído"
      : state?.status === "in_progress"
        ? "En progreso"
        : "Nuevo";

    return {
      id: story.id,
      levelName: storyLevel?.name ?? "Historia mágica",
      minutes: story.minutes,
      status,
      summary: story.summary,
      title: story.title,
    };
  });

  return (
    <div className="magic-library">
      {loadMessage ? <LoadError message={loadMessage} /> : null}
      <div className="magic-library__heading">
        <div>
          <small>Tu estante de lectura</small>
          <h2>{level?.name ?? "Historias mágicas"}</h2>
        </div>
        <span>{stories.length} libros esperando</span>
      </div>

      <MagicBookshelf books={books} />
      <p className="magic-library__change">
        ¿Buscas otros libros? <Link href="/niveles">Explorar otro camino <span aria-hidden="true">→</span></Link>
      </p>
    </div>
  );
}
