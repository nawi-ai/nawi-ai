import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StoryArt } from "@/components/brand/story-art";
import { StartReading } from "@/components/stories/start-reading";
import { Button } from "@/components/ui/button";
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
        <Link href="/cuentos"><span aria-hidden="true">←</span> Volver a la biblioteca</Link>
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
              <StoryArt storyId={story.id} className="h-full w-full" />
            </div>
            <h2>{card.title}</h2>
            <span>Una historia de Ñawi</span>
          </div>
          <div className="magic-story-preview__nawi" aria-hidden="true">
            <Image src="/nawi-mago.png" alt="" width={1211} height={1299} priority />
          </div>
          <div className="magic-story-preview__pedestal" aria-hidden="true"><span /></div>
        </section>

        <section className="magic-story-preview__details">
          <p className="magic-story-preview__eyebrow">✦ Un libro te ha elegido</p>
          <h1>{card.title}</h1>
          <p className="magic-story-preview__summary">{card.summary}</p>

          <div className="magic-story-facts" aria-label="Datos de la lectura">
            <div><strong>{card.minutes}</strong><span>minutos</span></div>
            <div><strong>{story.pageStarts.length}</strong><span>páginas</span></div>
            <div><strong>{card.skills.length}</strong><span>descubrimientos</span></div>
          </div>

          <div className="magic-story-skills">
            <p>En esta aventura descubrirás</p>
            <ul>
              {card.skills.map((skill, index) => (
                <li key={skill}><span>{index + 1}</span>{skill}</li>
              ))}
            </ul>
          </div>

          <div className="magic-story-guide">
            <span aria-hidden="true">✦</span>
            <p>
              Ñawi te acompañará con pistas y preguntas para pensar. Puedes responder escribiendo o usando tu voz.
            </p>
          </div>

          <div className="magic-story-preview__actions">
          {identity.kind === "reader" &&
          identity.preferredLevel !== null &&
          identity.preferredLevel !== story.level ? (
            <div className="magic-story-level-warning">
              <p>
                Este cuento es de {level?.name}. Tu biblioteca muestra los de{" "}
                {LEVELS.find((item) => item.id === identity.preferredLevel)?.name}.
              </p>
              <Button href="/cuentos">Volver a mis cuentos</Button>
            </div>
          ) : (
            <StartReading
              storyId={story.id}
              level={identity.kind === "reader" ? identity.preferredLevel : null}
            />
          )}
          </div>
          <p className="magic-story-preview__footnote">Cuando estés listo, la portada se abrirá y comenzará la historia.</p>
        </section>
      </article>
    </div>
  );
}
