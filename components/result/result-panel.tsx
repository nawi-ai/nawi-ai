import Image from "next/image";

import { Button } from "@/components/ui/button";
import { MagicBackButton } from "@/components/ui/magic-back-button";
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
    <section className="magic-result-page">
      <div className="magic-result-page__stars" aria-hidden="true" />
      <MagicBackButton fallbackHref="/cuentos" ariaLabel="Volver a la pantalla anterior" />

      <article className="magic-result-card">
        <header className="magic-result-hero">
          <div className="magic-result-hero__nawi" aria-hidden="true">
            <span />
            <Image src="/nawi-mago.webp" alt="" width={1211} height={1299} sizes="240px" priority />
          </div>
          <div>
            <p>✦ Lectura terminada</p>
            <h1>¡Leíste con Ñawi!</h1>
            <span>{detail.story.title}</span>
          </div>
        </header>

        <dl className="magic-result-stats">
          <Stat label="Preguntas" value={String(session.totalQuestions ?? detail.questions.length)} />
          <Stat label="Aciertos" value={String(session.correctAnswers ?? 0)} />
          <Stat label="Puntaje de esta lectura" value={session.score === null ? "En revisión" : String(session.score)} />
        </dl>

        <div className="magic-result-note">
          <span aria-hidden="true">✦</span>
          <div>
            <p>El puntaje describe esta actividad y no mide tu capacidad lectora.</p>
            {session.pendingReview ? (
              <p>{session.pendingReview} respuesta quedó para conversarla con una persona adulta y no entra como error.</p>
            ) : null}
          </div>
        </div>

        <div className="magic-result-grid">
          {profile.length > 0 ? (
            <section className="magic-result-section">
              <small>Tu constelación</small>
              <h2>Tu comprensión en este cuento</h2>
              {profileNote ? <p>{profileNote}</p> : null}
              <ul>
                {profile.map((item) => (
                  <li key={item.skill}>
                    <span aria-hidden="true">✦</span>
                    <p>
                      <strong>{item.strength}. </strong>
                      {item.practicing > 0
                        ? "Seguimos practicándolo."
                        : item.alone > 0
                          ? "Lo lograste por tu cuenta."
                          : "Lo lograste con una pista."}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="magic-result-section">
            <small>Lo que descubriste</small>
            <h2>Lo que observamos</h2>
            {session.strengths.length > 0 ? (
              <ul>
                {session.strengths.map((strength) => <li key={strength}><span aria-hidden="true">✦</span><p>{strength}</p></li>)}
              </ul>
            ) : (
              <p>Hoy practicaste con calma. Eso también cuenta.</p>
            )}
            <ul>
              {breakdown.map((item) => (
                <li key={item.id}>
                  <span aria-hidden="true">✦</span>
                  <p>
                    <strong>{QUESTION_TYPE_LABEL[item.type]}: </strong>
                    {item.pendingReview ? "quedó para revisar" : item.correct ? "logrado" : "para seguir practicando"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="magic-result-next">
          <span aria-hidden="true">✦</span>
          <div>
            <small>La brújula de Ñawi</small>
            <h2>Siguiente paso</h2>
            <p>{session.recommendation}</p>
            {session.supportNote ? <p>{session.supportNote}</p> : null}
          </div>
        </section>

        <div className="magic-result-actions">
          <Button href={nextHref} className="magic-result-primary">
            {session.nextStoryId ? "Leer otro cuento" : "Ir a la biblioteca"}
          </Button>
          <Button href="/progreso" variant="secondary" className="magic-result-secondary">Ver mi progreso</Button>
        </div>
      </article>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
