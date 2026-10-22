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
  const [leaf, setLeaf] = useState<{ page: number; direction: "next" | "prev" } | null>(null);
  const previous = useRef(pageIndex);

  useEffect(() => {
    if (previous.current === pageIndex) return;
    const direction = pageIndex > previous.current ? "next" : "prev";
    const from = previous.current;
    previous.current = pageIndex;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    setLeaf({ page: from, direction });
    const timer = window.setTimeout(() => setLeaf(null), 720);
    return () => window.clearTimeout(timer);
  }, [pageIndex]);

  const page = pages[pageIndex] ?? [];
  const start = pageStarts[pageIndex] ?? 0;

  return (
    <div className="mt-5">
      <div className="book-scene relative mx-auto max-w-2xl">
        <div className="absolute top-3 bottom-3 -left-2 w-3 rounded-l-2xl bg-[#2f684b] shadow-md" aria-hidden="true" />
        <div className="relative min-h-[28rem] overflow-hidden rounded-r-[28px] rounded-l-md border border-line bg-[#fffdf8] shadow-[8px_16px_40px_rgb(38_53_47_/_14%)]">
          <PageFace
            storyId={storyId}
            page={page}
            pageNumber={pageIndex + 1}
            total={pages.length}
            start={start}
            spokenParagraph={spokenParagraph}
            fontSize={fontSize}
          />
          {leaf ? (
            <div
              className={`book-leaf absolute inset-0 z-10 bg-[#fffdf8] ${leaf.direction === "next" ? "book-leaf-next" : "book-leaf-prev"}`}
              aria-hidden="true"
            >
              <PageFace
                storyId={storyId}
                page={pages[leaf.direction === "next" ? leaf.page : pageIndex] ?? []}
                pageNumber={(leaf.direction === "next" ? leaf.page : pageIndex) + 1}
                total={pages.length}
                start={pageStarts[leaf.direction === "next" ? leaf.page : pageIndex] ?? 0}
                spokenParagraph={null}
                fontSize={fontSize}
              />
            </div>
          ) : null}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 bottom-0 h-16 w-16 bg-[linear-gradient(135deg,transparent_50%,#f3efe4_50%)]"
          />
        </div>
      </div>
      <div className="mx-auto mt-4 flex max-w-2xl items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex min-h-12 items-center gap-1 rounded-full bg-surface px-4 font-extrabold text-leaf disabled:text-muted"
          onClick={() => onPage(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          <ChevronLeft aria-hidden="true" size={20} /> Anterior
        </button>
        <p className="text-sm font-extrabold text-muted" aria-live="polite">
          Página {pageIndex + 1} de {pages.length}
        </p>
        <button
          type="button"
          className="inline-flex min-h-12 items-center gap-1 rounded-full bg-surface px-4 font-extrabold text-leaf disabled:text-muted"
          onClick={() => onPage(pageIndex + 1)}
          disabled={pageIndex >= pages.length - 1}
        >
          Siguiente <ChevronRight aria-hidden="true" size={20} />
        </button>
      </div>
    </div>
  );
}

function PageFace({
  storyId,
  page,
  pageNumber,
  total,
  start,
  spokenParagraph,
  fontSize,
}: {
  storyId: string;
  page: string[];
  pageNumber: number;
  total: number;
  start: number;
  spokenParagraph: number | null;
  fontSize: number;
}) {
  return (
    <div className="flex h-full min-h-[28rem] flex-col bg-[linear-gradient(90deg,#f4efe3_0%,#fffdf8_7%,#fffdf8_100%)] px-6 py-5 sm:px-10">
      <StoryArt storyId={storyId} className="h-28 w-full rounded-2xl" />
      <div className="mt-4 flex-1 space-y-3" aria-label={`Página ${pageNumber} de ${total}`}>
        {page.map((paragraph, index) => {
          const absolute = start + index;
          const spoken = spokenParagraph === absolute;
          return (
            <p
              key={`${pageNumber}-${absolute}`}
              style={{ fontSize }}
              className={`leading-relaxed ${spoken ? "rounded-2xl bg-sun/70 px-3 py-2" : ""}`}
            >
              {paragraph}
            </p>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm font-extrabold text-muted">
        {pageNumber} / {total}
      </p>
    </div>
  );
}
