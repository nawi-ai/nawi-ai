"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

import { BookSpread } from "@/components/reader/book-spread";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useNarration } from "@/components/reader/use-narration";
import { LEVELS } from "@/lib/reading-level";
import { pageOfParagraph, pagesFromStarts } from "@/lib/stories/pages";
import type { ReaderStory } from "@/lib/stories/public";
import type { SessionView } from "@/lib/sessions/views";

const SIZES = [20, 24, 28, 32];
const RATES = [
  { value: 0.8, label: "Lento" },
  { value: 0.95, label: "Normal" },
  { value: 1.1, label: "Ágil" },
];

export function ReaderView({ session, story }: { session: SessionView; story: ReaderStory }) {
  const narration = useNarration(story.paragraphs);
  const pages = pagesFromStarts(story.paragraphs, story.pageStarts);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(24);
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
    <article className="mx-auto max-w-3xl">
      <Button href="/cuentos" variant="ghost" className="px-3">
        Volver a la biblioteca
      </Button>
      <p className="mt-4 text-sm font-extrabold text-leaf">
        {level?.name} · {story.minutes} min
      </p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">{story.title}</h1>

      <BookSpread
        storyId={story.id}
        pages={pages}
        pageStarts={story.pageStarts}
        pageIndex={page}
        spokenParagraph={narration.status === "playing" ? narration.paragraphIndex : null}
        fontSize={size}
        onPage={turn}
      />

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Tamaño del texto">
        {SIZES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={size === option}
            className={`min-h-12 rounded-full px-4 font-extrabold ${size === option ? "bg-leaf text-white" : "bg-surface text-ink"}`}
            onClick={() => setSize(option)}
          >
            {option === 20 ? "A" : option === 24 ? "A+" : option === 28 ? "A++" : "A+++"}
            <span className="sr-only"> tamaño {option}</span>
          </button>
        ))}
      </div>

      {narration.voiceNote ? (
        <div className="mt-4">
          <Notice>{narration.voiceNote}</Notice>
        </div>
      ) : null}

      <div className="sticky bottom-3 mt-6 rounded-[28px] border border-line bg-surface/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap gap-2" aria-label="Velocidad de la narración">
          {RATES.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={narration.rate === option.value}
              className={`min-h-12 rounded-full px-4 font-extrabold ${narration.rate === option.value ? "bg-sky text-ink" : "text-muted"}`}
              onClick={() => narration.setRate(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
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
        <Button href={finishedHref} variant="sun" className="mt-3 w-full">
          Terminé de leer
        </Button>
      </div>
    </article>
  );
}
