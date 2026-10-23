"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { StoryArt } from "@/components/brand/story-art";

export function BookSpread({
  storyId,
  pages,
  pageStarts,
  pageIndex,
  spokenParagraph,
  fontSize,
  onPage,
}: {
  storyId: string;
  pages: string[][];
  pageStarts: readonly number[];
  pageIndex: number;
  spokenParagraph: number | null;
  fontSize: number;
  onPage: (index: number) => void;
}) {
  const [turn, setTurn] = useState<{ direction: "next" | "prev"; key: number } | null>(null);
  const previous = useRef(pageIndex);

  useEffect(() => {
    if (previous.current === pageIndex) return;
    const direction = pageIndex > previous.current ? "next" : "prev";
    previous.current = pageIndex;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frame = window.requestAnimationFrame(() => {
      setTurn({ direction, key: pageIndex });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pageIndex]);

  const page = pages[pageIndex] ?? [];
  const start = pageStarts[pageIndex] ?? 0;
  const atStart = pageIndex === 0;
  const atEnd = pageIndex >= pages.length - 1;

  return (
    <section className="magic-reader-book" aria-label={`Libro abierto, página ${pageIndex + 1} de ${pages.length}`}>
      <div className="magic-reader-book__stage">
        <button
          type="button"
          className="magic-reader-book__arrow magic-reader-book__arrow--prev"
          onClick={() => onPage(pageIndex - 1)}
          disabled={atStart || turn !== null}
          aria-label="Ir a la página anterior"
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        <div className="magic-reader-book__cover" aria-hidden="true" />
        <div className="magic-reader-book__spread">
          <IllustrationPage
            storyId={storyId}
            pageNumber={pageIndex + 1}
          />
          <span className="magic-reader-book__spine" aria-hidden="true" />
          <TextPage
            page={page}
            pageNumber={pageIndex + 1}
            total={pages.length}
            start={start}
            spokenParagraph={spokenParagraph}
            fontSize={fontSize}
          />

          {turn ? <TurningLeaf key={turn.key} direction={turn.direction} onDone={() => setTurn(null)} /> : null}
        </div>

        <button
          type="button"
          className="magic-reader-book__arrow magic-reader-book__arrow--next"
          onClick={() => onPage(pageIndex + 1)}
          disabled={atEnd || turn !== null}
          aria-label="Ir a la página siguiente"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="magic-reader-book__progress" aria-live="polite">
        <span>Página {pageIndex + 1} de {pages.length}</span>
        <div aria-hidden="true">
          {pages.map((_, index) => <i key={index} data-active={index === pageIndex} />)}
        </div>
      </div>
    </section>
  );
}

function IllustrationPage({
  storyId,
  pageNumber,
}: {
  storyId: string;
  pageNumber: number;
}) {
  return (
    <div className="magic-reader-book__page magic-reader-book__page--art">
      <span className="magic-reader-book__corner magic-reader-book__corner--left" aria-hidden="true">✦</span>
      <div className="magic-reader-book__illustration">
        <span className="magic-reader-book__illustration-glow" aria-hidden="true" />
        <StoryArt
          storyId={storyId}
          sceneIndex={pageNumber - 1}
          variant="scene"
          className="h-full w-full"
          sizes="(max-width: 760px) 42vw, 560px"
          priority
        />
      </div>
    </div>
  );
}

function TextPage({
  page,
  pageNumber,
  total,
  start,
  spokenParagraph,
  fontSize,
}: {
  page: string[];
  pageNumber: number;
  total: number;
  start: number;
  spokenParagraph: number | null;
  fontSize: number;
}) {
  return (
    <div className="magic-reader-book__page magic-reader-book__page--text">
      <span className="magic-reader-book__corner magic-reader-book__corner--right" aria-hidden="true">✦</span>
      <div
        className="magic-reader-book__paragraphs"
        aria-label={`Texto de la página ${pageNumber} de ${total}`}
        style={{ "--reader-font-size": `${fontSize}px` } as React.CSSProperties}
      >
        {page.map((paragraph, index) => {
          const absolute = start + index;
          const spoken = spokenParagraph === absolute;
          return (
            <p key={`${pageNumber}-${absolute}`} data-spoken={spoken}>
              {paragraph}
            </p>
          );
        })}
      </div>
      <span className="magic-reader-book__folio">{pageNumber}</span>
    </div>
  );
}

function TurningLeaf({
  direction,
  onDone,
}: {
  direction: "next" | "prev";
  onDone: () => void;
}) {
  return (
    <div
      className={`magic-reader-book__turn magic-reader-book__turn--${direction}`}
      aria-hidden="true"
      onAnimationEnd={onDone}
    >
      <span className="magic-reader-book__turn-paper">
        <i>✦</i>
      </span>
    </div>
  );
}
