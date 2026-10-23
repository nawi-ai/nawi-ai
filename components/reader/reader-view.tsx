"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

import { BookSpread } from "@/components/reader/book-spread";
import { Button } from "@/components/ui/button";
import { MagicBackButton } from "@/components/ui/magic-back-button";
import { Notice } from "@/components/ui/notice";
import { useNarration } from "@/components/reader/use-narration";
import { LEVELS } from "@/lib/reading-level";
import { pageOfParagraph, pagesFromStarts } from "@/lib/stories/pages";
import type { ReaderStory } from "@/lib/stories/public";
import type { SessionView } from "@/lib/sessions/views";

const SIZES = [
  { value: 18, label: "A" },
  { value: 20, label: "A+" },
  { value: 22, label: "A++" },
  { value: 24, label: "A+++" },
];
const RATES = [
  { value: 0.8, label: "Lento" },
  { value: 0.95, label: "Normal" },
  { value: 1.1, label: "Ágil" },
];

export function ReaderView({ session, story }: { session: SessionView; story: ReaderStory }) {
  const narration = useNarration(story.paragraphs);
  const pages = pagesFromStarts(story.paragraphs, story.pageStarts);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const level = LEVELS.find((item) => item.id === session.readingLevel);
  const spokenPage = pageOfParagraph(story.pageStarts, narration.paragraphIndex);

  useEffect(() => {
    if (narration.status !== "playing") return;
    setPage(spokenPage);
  }, [narration.status, spokenPage]);

  function turn(next: number) {
    const clamped = Math.min(pages.length - 1, Math.max(0, next));
    setPage(clamped);
    narration.jumpTo(story.pageStarts[clamped] ?? 0);
  }
  const finishedHref =
    session.status === "completed"
      ? `/resultado/${session.id}`
      : `/sesion/${session.id}/preguntas`;

  return (
    <article className="magic-reader-page">
      <header className="magic-reader-page__header">
        <MagicBackButton
          fallbackHref={`/cuentos/${story.id}`}
          ariaLabel="Volver a la información del cuento"
        />
        <div>
          <p>{level?.name} · {story.minutes} min</p>
          <h1>{story.title}</h1>
        </div>
        <span aria-hidden="true">✦</span>
      </header>

      <BookSpread
        storyId={story.id}
        pages={pages}
        pageStarts={story.pageStarts}
        pageIndex={page}
        spokenParagraph={narration.status === "playing" ? narration.paragraphIndex : null}
        fontSize={size}
        onPage={turn}
      />

      <div className="magic-reader-tools">
        <div className="magic-reader-tools__type" aria-label="Tamaño del texto">
          <span>Tamaño de lectura</span>
          <div>
        {SIZES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={size === option.value}
            onClick={() => setSize(option.value)}
          >
            {option.label}
            <span className="sr-only">, tamaño {option.value}</span>
          </button>
        ))}
          </div>
        </div>

        <div className="magic-reader-tools__rate" aria-label="Velocidad de la narración">
          <span>Ritmo de Ñawi</span>
          <div>
            {RATES.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={narration.rate === option.value}
                onClick={() => narration.setRate(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {narration.voiceNote ? (
        <div className="mt-4">
          <Notice>{narration.voiceNote}</Notice>
        </div>
      ) : null}

      <div className="magic-reader-audio">
        <div className="magic-reader-audio__buttons">
          <Button
            type="button"
            onClick={() => {
              const start = narration.finished ? 0 : (story.pageStarts[page] ?? 0);
              if (narration.finished) setPage(0);
              narration.play(start);
            }}
            disabled={narration.status === "playing"}
          >
            <Play aria-hidden="true" size={18} /> Escuchar cuento
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={narration.pause}
            disabled={narration.status !== "playing"}
          >
            <Pause aria-hidden="true" size={18} /> Pausar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={narration.resume}
            disabled={narration.status !== "paused"}
          >
            Reanudar
          </Button>
        </div>
        <Button href={finishedHref} variant="sun" className="magic-reader-audio__finish">
          Terminé de leer
        </Button>
      </div>
    </article>
  );
}
