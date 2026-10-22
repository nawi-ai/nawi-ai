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
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <StoryDetail params={params} />
    </Suspense>
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
    <article className="grid items-start gap-6 md:grid-cols-[1.1fr_0.9fr]">
      <StoryArt storyId={story.id} className="h-64 w-full" />
      <div>
        <p className="text-sm font-extrabold text-leaf">
          {level?.name} · {card.minutes} min
        </p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">{card.title}</h1>
        <p className="mt-4 text-lg leading-8">{card.summary}</p>
        <h2 className="mt-6 text-xl font-extrabold">Vamos a practicar</h2>
        <ul className="mt-2 space-y-1 text-base leading-7">
          {card.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
        <p className="mt-4 text-base leading-7 text-muted">
          Si una respuesta no sale, Ñawi da pistas y otra pregunta para pensarla. Si vas comprendiendo, aparece un reto. La respuesta abierta también se puede decir en voz alta.
        </p>
        <div className="mt-6">
          {identity.kind === "reader" &&
          identity.preferredLevel !== null &&
          identity.preferredLevel !== story.level ? (
            <div className="flex flex-col gap-3">
              <p className="text-base leading-7">
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
      </div>
    </article>
  );
}
