import Link from "next/link";

import { NawiCharacter } from "@/components/brand/nawi-character";
import { Button } from "@/components/ui/button";
import { QUESTION_TYPE_LABEL } from "@/lib/reading-level";
import { buildSkillProfile, profileSentence } from "@/lib/sessions/skills";
import type { SessionDetail, TypeBreakdown } from "@/lib/sessions/views";

export function ResultPanel({
  detail,
  breakdown,
}: {
  detail: SessionDetail;
  breakdown: TypeBreakdown[];
}) {
  const session = detail.session;
  const nextHref = session.nextStoryId ? `/cuentos/${session.nextStoryId}` : "/cuentos";
  const profile = buildSkillProfile(
    detail.questions.map((question) => ({
      skill: question.skill,
      attempts: detail.answers.filter((answer) => answer.questionId === question.id),
    })),
  );
  const profileNote = profileSentence(profile);

  return (
    <article className="mx-auto max-w-3xl rounded-[28px] border border-line bg-surface p-6 shadow-sm md:p-10">
      <div className="flex flex-col items-center text-center">
        <NawiCharacter className="h-36 w-36" />
        <p className="mt-2 text-sm font-extrabold text-leaf">Lectura terminada</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">¡Leíste con Ñawi!</h1>
        <p className="mt-3 max-w-xl text-lg leading-8 text-muted">{detail.story.title}</p>
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Preguntas" value={String(session.totalQuestions ?? detail.questions.length)} />
        <Stat label="Aciertos" value={String(session.correctAnswers ?? 0)} />
        <Stat
          label="Puntaje de esta lectura"
          value={session.score === null ? "En revisión" : String(session.score)}
        />
      </dl>
      <p className="mt-3 text-sm leading-6 text-muted">
        El puntaje es aciertos entre las preguntas que se pudieron revisar. Describe esta actividad
        y no es una medida de tu capacidad lectora.
      </p>
      {session.pendingReview ? (
        <p className="mt-2 text-sm leading-6 text-muted">
          {session.pendingReview} respuesta quedó para conversarla con una persona adulta y no entra
          como error.
        </p>
      ) : null}

      {profile.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xl font-extrabold">Tu comprensión en este cuento</h2>
          {profileNote ? <p className="mt-3 text-lg leading-8">{profileNote}</p> : null}
          <ul className="mt-4 space-y-2">
            {profile.map((item) => (
              <li key={item.skill} className="rounded-2xl bg-canvas px-4 py-3">
                <span className="font-extrabold">{item.strength}. </span>
                {item.practicing > 0
                  ? "Seguimos practicándolo."
                  : item.alone > 0
                    ? "Lo lograste por tu cuenta."
                    : "Lo lograste con una pista."}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xl font-extrabold">Lo que observamos</h2>
        {session.strengths.length > 0 ? (
          <ul className="mt-3 space-y-2 text-base leading-7">
            {session.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-base leading-7">Hoy practicaste con calma. Eso también cuenta.</p>
        )}
        <ul className="mt-4 space-y-2">
          {breakdown.map((item) => (
            <li key={item.id} className="rounded-2xl bg-canvas px-4 py-3">
              <span className="font-extrabold">{QUESTION_TYPE_LABEL[item.type]}: </span>
              {item.pendingReview ? "quedó para revisar" : item.correct ? "logrado" : "para seguir practicando"}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-3xl bg-leaf-soft p-4">
        <h2 className="text-xl font-extrabold">Siguiente paso</h2>
        <p className="mt-2 text-base leading-7">{session.recommendation}</p>
        {session.supportNote ? <p className="mt-2 text-base leading-7">{session.supportNote}</p> : null}
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href={nextHref}>{session.nextStoryId ? "Leer otro cuento" : "Volver a la biblioteca"}</Button>
        <Button href="/progreso" variant="secondary">
          Ver mi progreso
        </Button>
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href="/cuentos" className="font-extrabold text-leaf">
          Elegir desde la biblioteca
        </Link>
      </p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-canvas px-4 py-4">
      <dt className="text-sm font-bold text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-extrabold">{value}</dd>
    </div>
  );
}
