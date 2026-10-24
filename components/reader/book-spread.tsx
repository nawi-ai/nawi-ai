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
  const [turn, setTurn] = useState<{
    direction: "next" | "prev";
    from: number;
    to: number;
    key: number;
  } | null>(null);
  const [loadingPage, setLoadingPage] = useState<number | null>(null);
  const previous = useRef(pageIndex);
  const loadedScenes = useRef(new Set<number>([pageIndex]));
  const loadRequest = useRef(0);

  useEffect(() => {
    if (previous.current === pageIndex) return;
    const from = previous.current;
    const direction = pageIndex > from ? "next" : "prev";
    previous.current = pageIndex;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frame = window.requestAnimationFrame(() => {
      setTurn({ direction, from, to: pageIndex, key: pageIndex });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pageIndex]);

  useEffect(() => {
    const nearby = [pageIndex - 1, pageIndex + 1].filter(
      (index) => index >= 0 && index < pages.length && !loadedScenes.current.has(index),
    );

    for (const index of nearby) {
      const image = new window.Image();
      image.decoding = "async";
      image.src = sceneSource(storyId, index);
      image.onload = () => loadedScenes.current.add(index);
    }
  }, [pageIndex, pages.length, storyId]);

  const page = pages[pageIndex] ?? [];
  const start = pageStarts[pageIndex] ?? 0;
  const atStart = pageIndex === 0;
  const atEnd = pageIndex >= pages.length - 1;

  function requestPage(nextPage: number) {
    if (nextPage < 0 || nextPage >= pages.length || turn || loadingPage !== null) return;

    if (loadedScenes.current.has(nextPage)) {
      onPage(nextPage);
      return;
    }

    const request = loadRequest.current + 1;
    loadRequest.current = request;
    setLoadingPage(nextPage);

    const image = new window.Image();
    image.decoding = "async";
    image.src = sceneSource(storyId, nextPage);
    image.onload = () => {
      if (loadRequest.current !== request) return;
      loadedScenes.current.add(nextPage);
      setLoadingPage(null);
      onPage(nextPage);
    };
    image.onerror = () => {
      if (loadRequest.current !== request) return;
      setLoadingPage(null);
      onPage(nextPage);
    };
  }

  return (
    <section className="magic-reader-book" aria-label={`Libro abierto, página ${pageIndex + 1} de ${pages.length}`}>
      <div className="magic-reader-book__stage" aria-busy={loadingPage !== null}>
        <button
          type="button"
          className="magic-reader-book__arrow magic-reader-book__arrow--prev"
          onClick={() => requestPage(pageIndex - 1)}
          disabled={atStart || turn !== null || loadingPage !== null}
          aria-label="Ir a la página anterior"
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        <div className="magic-reader-book__cover" aria-hidden="true" />
        <div className="magic-reader-book__spread">
          <IllustrationPage
            key={`art-${pageIndex}`}
            storyId={storyId}
            pageNumber={pageIndex + 1}
          />
          <span className="magic-reader-book__spine" aria-hidden="true" />
          <TextPage
            key={`text-${pageIndex}`}
            page={page}
            pageNumber={pageIndex + 1}
            total={pages.length}
            start={start}
            spokenParagraph={spokenParagraph}
            fontSize={fontSize}
          />

          {turn ? (
            <TurningLeaf
              key={turn.key}
              direction={turn.direction}
              from={turn.from}
              to={turn.to}
              storyId={storyId}
              pages={pages}
              pageStarts={pageStarts}
              fontSize={fontSize}
              onDone={() => setTurn(null)}
            />
          ) : null}

          {loadingPage !== null ? (
            <span className="magic-reader-book__loading" aria-hidden="true">✦</span>
          ) : null}
        </div>

        <button
          type="button"
          className="magic-reader-book__arrow magic-reader-book__arrow--next"
          onClick={() => requestPage(pageIndex + 1)}
          disabled={atEnd || turn !== null || loadingPage !== null}
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
  from,
  to,
  storyId,
  pages,
  pageStarts,
  fontSize,
  onDone,
}: {
  direction: "next" | "prev";
  from: number;
  to: number;
  storyId: string;
  pages: string[][];
  pageStarts: readonly number[];
  fontSize: number;
  onDone: () => void;
}) {
  const front = direction === "next" ? (
    <TextPage
      page={pages[from] ?? []}
      pageNumber={from + 1}
      total={pages.length}
      start={pageStarts[from] ?? 0}
      spokenParagraph={null}
      fontSize={fontSize}
    />
  ) : (
    <IllustrationPage storyId={storyId} pageNumber={from + 1} />
  );
  const back = direction === "next" ? (
    <IllustrationPage storyId={storyId} pageNumber={to + 1} />
  ) : (
    <TextPage
      page={pages[to] ?? []}
      pageNumber={to + 1}
      total={pages.length}
      start={pageStarts[to] ?? 0}
      spokenParagraph={null}
      fontSize={fontSize}
    />
  );

  return (
    <div
      className={`magic-reader-book__turn magic-reader-book__turn--${direction}`}
      aria-hidden="true"
      onAnimationEnd={onDone}
    >
      <div className="magic-reader-book__turn-face magic-reader-book__turn-face--front">
        {front}
      </div>
      <div className="magic-reader-book__turn-face magic-reader-book__turn-face--back">
        {back}
      </div>
    </div>
  );
}

function sceneSource(storyId: string, pageIndex: number) {
  return `/stories/${storyId}/scene-${String(pageIndex + 1).padStart(2, "0")}.webp`;
}
