import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StoryArt } from "@/components/brand/story-art";
import { StartReading } from "@/components/stories/start-reading";
import { MagicBackButton } from "@/components/ui/magic-back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { loadIdentity } from "@/lib/auth/identity";
import { LEVELS } from "@/lib/reading-level";
import { getStory, getStoryCard, listStories } from "@/lib/stories/catalog";

export function generateStaticParams() {
  return listStories().map((story) => ({ id: story.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = getStory(id);
  return { title: story?.title ?? "Cuento" };
}

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="magic-story-page">
      <div className="magic-story-page__stars" aria-hidden="true" />
      <Suspense fallback={<Skeleton className="magic-story-loading" />}>
        <StoryDetail params={params} />
      </Suspense>
    </div>
  );
}

async function StoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = getStory(id);
  if (!story) notFound();
  const card = getStoryCard(story.id);
  if (!card) notFound();
  const identity = await loadIdentity();
  const level = LEVELS.find((item) => item.id === card.level);

  return (
    <div className="magic-story-page__content">
      <nav className="magic-story-nav" aria-label="Antes de leer">
        <MagicBackButton fallbackHref="/cuentos" ariaLabel="Volver a la biblioteca" />
        <Link href="/progreso">Mi progreso <span aria-hidden="true">✦</span></Link>
      </nav>

      <article className="magic-story-preview">
        <section className="magic-story-preview__visual" aria-label={`Portada de ${card.title}`}>
          <div className="magic-story-preview__orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="magic-story-cover">
            <span className="magic-story-cover__spine" aria-hidden="true" />
            <span className="magic-story-cover__spark magic-story-cover__spark--top" aria-hidden="true">✦</span>
            <span className="magic-story-cover__spark magic-story-cover__spark--bottom" aria-hidden="true">✦</span>
            <p>{level?.name} · {card.minutes} min</p>
            <div className="magic-story-cover__art">
              <StoryArt
                storyId={story.id}
                className="h-full w-full"
                sizes="(max-width: 760px) 78vw, 420px"
                priority
              />
            </div>
            <h2>{card.title}</h2>
            <span>Una historia de Ñawi</span>
          </div>
          <div className="magic-story-preview__nawi" aria-hidden="true">
            <Image src="/nawi-mago.webp" alt="" width={1211} height={1299} sizes="240px" priority />
          </div>
          <div className="magic-story-preview__pedestal" aria-hidden="true"><span /></div>
        </section>

        <section className="magic-story-preview__details">
          <div className="magic-story-preview__thread" aria-hidden="true">
            <span /><span /><span />
          </div>

          <div className="magic-story-preview__heading">
            <p className="magic-story-preview__eyebrow">✦ Esta historia te está llamando</p>
            <h1>{card.title}</h1>
            <p className="magic-story-preview__summary">{card.summary}</p>
          </div>

          <ul className="magic-story-runes" aria-label="Cómo será esta aventura">
            <li><span aria-hidden="true">◷</span><strong>{card.minutes} min</strong><small>de aventura</small></li>
            <li><span aria-hidden="true">⌁</span><strong>{story.pageStarts.length} escenas</strong><small>por descubrir</small></li>
            <li><span aria-hidden="true">✦</span><strong>Con Ñawi</strong><small>a tu lado</small></li>
          </ul>

          <div className="magic-story-trail">
            <p>Sigue las luces y descubrirás…</p>
            <ul>
              {card.skills.map((skill) => (
                <li key={skill}><span aria-hidden="true">✦</span>{skill}</li>
              ))}
            </ul>
          </div>

          <p className="magic-story-whisper">
            <span aria-hidden="true">☾</span>
            Si una pista se esconde, Ñawi te ayudará a encontrarla con preguntas y con su voz.
          </p>

          <div className="magic-story-preview__actions">
            {identity.kind === "reader" &&
            identity.preferredLevel !== null &&
            identity.preferredLevel !== story.level ? (
              <div className="magic-story-level-warning">
                <p>
                  Este cuento es de {level?.name}. Tu biblioteca muestra los de{" "}
                  {LEVELS.find((item) => item.id === identity.preferredLevel)?.name}.
                </p>
              </div>
            ) : (
              <StartReading
                storyId={story.id}
                level={identity.kind === "reader" ? identity.preferredLevel : null}
              />
            )}
          </div>
          <p className="magic-story-preview__footnote">Cruza el umbral y deja que el libro se abra.</p>
        </section>
      </article>
    </div>
  );
}
