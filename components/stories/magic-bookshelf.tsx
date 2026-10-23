"use client";

import Link from "next/link";
import { useState } from "react";

import { StoryArt } from "@/components/brand/story-art";

export type MagicBookItem = {
  id: string;
  levelName: string;
  minutes: number;
  status: "Nuevo" | "En progreso" | "Leído";
  summary: string;
  title: string;
};

export function MagicBookshelf({ books }: { books: MagicBookItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  function moveBook(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + books.length) % books.length);
  }

  return (
    <div className="magic-bookshelf">
      <button
        type="button"
        className="magic-bookshelf__arrow magic-bookshelf__arrow--left"
        onClick={() => moveBook(-1)}
        aria-label="Ver el libro anterior"
      >
        <span aria-hidden="true">←</span>
      </button>

      <div className="magic-bookshelf__books" aria-live="polite">
        {books.map((book, index) => (
          <article
            key={book.id}
            className="magic-book"
            data-book={(index % 3) + 1}
            data-active={index === activeIndex}
          >
            <Link className="magic-book__cover" href={`/cuentos/${book.id}`} aria-label={`Abrir ${book.title}`}>
              <span className="magic-book__spine" aria-hidden="true" />
              <span className="magic-book__corner magic-book__corner--top" aria-hidden="true">✦</span>
              <span className="magic-book__corner magic-book__corner--bottom" aria-hidden="true">✦</span>
              <span className="magic-book__status">{book.status}</span>
              <div className="magic-book__art">
                <StoryArt storyId={book.id} className="h-full w-full" />
              </div>
              <div className="magic-book__copy">
                <p>{book.levelName} · {book.minutes} min</p>
                <h3>{book.title}</h3>
                <span>{book.summary}</span>
              </div>
              <strong className="magic-book__open">Abrir libro <span aria-hidden="true">→</span></strong>
            </Link>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="magic-bookshelf__arrow magic-bookshelf__arrow--right"
        onClick={() => moveBook(1)}
        aria-label="Ver el siguiente libro"
      >
        <span aria-hidden="true">→</span>
      </button>

      <div className="magic-bookshelf__dots" aria-label="Elegir un libro">
        {books.map((book, index) => (
          <button
            key={book.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Ver ${book.title}`}
            aria-current={index === activeIndex ? "true" : undefined}
          />
        ))}
      </div>

      <div className="magic-bookshelf__wood" aria-hidden="true"><span /></div>
    </div>
  );
}
