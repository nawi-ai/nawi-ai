import Image from "next/image";

import { Button } from "@/components/ui/button";
import { MagicBackButton } from "@/components/ui/magic-back-button";
import { LEVELS } from "@/lib/reading-level";
import type { ProgressView } from "@/lib/sessions/views";

export function ProgressPanel({ progress }: { progress: ProgressView }) {
  const level = LEVELS.find((item) => item.id === progress.preferredLevel);
  const completed = progress.sessions.filter((session) => session.status === "completed");
  const showChart = completed.length >= 2;

  if (progress.sessions.length === 0) {
    return (
      <section className="magic-progress-page magic-progress-page--empty">
        <div className="magic-progress-page__stars" aria-hidden="true" />
        <MagicBackButton fallbackHref="/cuentos" ariaLabel="Volver a la biblioteca" />
        <div className="magic-progress-empty">
          <div className="magic-progress-empty__nawi" aria-hidden="true">
            <Image src="/nawi-mago.webp" alt="" width={1211} height={1299} sizes="230px" priority />
          </div>
          <p>✦ Tu diario mágico</p>
          <h1>¡Tu primera aventura te espera!</h1>
          <span>Cuando termines un cuento, aquí aparecerán tus lecturas y descubrimientos.</span>
          <Button href="/niveles" className="magic-progress-button">Comenzar a leer</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="magic-progress-page">
      <div className="magic-progress-page__stars" aria-hidden="true" />
      <MagicBackButton fallbackHref="/cuentos" ariaLabel="Volver a la biblioteca" />

      <div className="magic-progress-shell">
        <header className="magic-progress-hero">
          <div>
            <p>✦ Tu diario mágico de lectura</p>
            <h1>Mi progreso</h1>
            <span>
              {progress.completedCount} {progress.completedCount === 1 ? "cuento completado" : "cuentos completados"}
              {level ? ` · Camino: ${level.name}` : ""}
            </span>
          </div>
          <div className="magic-progress-hero__nawi" aria-hidden="true">
            <span />
            <Image src="/nawi-mago.webp" alt="" width={1211} height={1299} sizes="230px" priority />
          </div>
        </header>

        <div className="magic-progress-layout">
          <div className="magic-progress-main">
            {progress.pending ? (
              <section className="magic-progress-card magic-progress-card--pending">
                <small>Una historia te está esperando</small>
                <h2>Tienes una lectura empezada</h2>
                <p>{progress.pending.storyTitle}</p>
                <Button href={`/leer/${progress.pending.id}`} className="magic-progress-button">
                  Continuar la aventura <span aria-hidden="true">→</span>
                </Button>
              </section>
            ) : null}

            {progress.profileNote ? (
              <section className="magic-progress-card">
                <small>Constelación de habilidades</small>
                <h2>Tu perfil de comprensión</h2>
                <p className="magic-progress-card__lead">{progress.profileNote}</p>
                {progress.levelNote ? <p>{progress.levelNote}</p> : null}
                <ul className="magic-progress-skills">
                  {progress.skills.map((item) => (
                    <li key={item.skill}>
                      <span aria-hidden="true">✦</span>
                      <p>
                        <strong>{item.strength}. </strong>
                        {item.improving
                          ? "Vas mejorando."
                          : item.practicing > 0
                            ? "Todavía lo estamos practicando."
                            : item.alone > 0
                              ? "Lo logras por tu cuenta."
                              : "Lo lograste con una pista."}
                        {bandLabel(progress.mastery.find((mastery) => mastery.skill === item.skill)?.band)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {showChart ? (
              <section className="magic-progress-card" aria-labelledby="grafico-titulo">
                <small>Huella de tus aventuras</small>
                <h2 id="grafico-titulo">Puntajes guardados</h2>
                <p className="magic-progress-card__note">Cada barra es una lectura terminada. No es una tendencia.</p>
                <ul className="magic-progress-chart">
                  {completed.map((session) => (
                    <li key={session.id}>
                      <div><span>{session.storyTitle}</span><strong>{session.score === null ? "En revisión" : session.score}</strong></div>
                      <div role="img" aria-label={`${session.storyTitle}: ${session.score ?? "sin puntaje"} de 100`}>
                        <i style={{ width: `${session.score ?? 0}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : completed.length === 1 ? (
              <section className="magic-progress-card">
                <small>Primera estrella conseguida</small>
                <h2>Tu primera lectura terminada</h2>
                <p className="magic-progress-card__lead">
                  {completed[0]?.storyTitle}: {completed[0]?.score === null ? "en revisión" : `${completed[0]?.score} puntos`}
                </p>
                <p className="magic-progress-card__note">Con una sola lectura no mostramos una tendencia.</p>
              </section>
            ) : null}

            <section className="magic-progress-card">
              <small>Bitácora reciente</small>
              <h2>Últimas sesiones</h2>
              <ul className="magic-progress-sessions">
                {progress.sessions.map((session) => (
                  <li key={session.id}>
                    <span aria-hidden="true">✦</span>
                    <div>
                      <p>{session.storyTitle}</p>
                      <small>
                        {session.status === "completed" ? "Terminada" : "En progreso"}
                        {session.score !== null ? ` · ${session.score} puntos` : ""}
                      </small>
                    </div>
                    <Button
                      href={session.status === "completed" ? `/resultado/${session.id}` : `/leer/${session.id}`}
                      variant="ghost"
                      className="magic-progress-session-link"
                    >
                      {session.status === "completed" ? "Ver resultado" : "Seguir"}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="magic-progress-aside">
            <span className="magic-progress-aside__orb" aria-hidden="true">✦</span>
            <small>La brújula de Ñawi</small>
            <h2>{progress.recommendation ? "Tu próxima aventura" : "Cada lectura deja una estrella"}</h2>
            {progress.recommendation ? (
              <>
                <p>{progress.recommendation}</p>
                {progress.supportNote ? <p>{progress.supportNote}</p> : null}
                {progress.nextStory ? (
                  <Button href={`/cuentos/${progress.nextStory.id}`} className="magic-progress-button">
                    Ver {progress.nextStory.title}
                  </Button>
                ) : (
                  <Button href="/cuentos" className="magic-progress-button">Ir a la biblioteca</Button>
                )}
              </>
            ) : (
              <p>Completa un cuento y aquí aparecerá una recomendación preparada para ti.</p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

function bandLabel(band: "unknown" | "support" | "steady" | "stretch" | undefined) {
  if (band === "support") return " Conviene apoyarla.";
  if (band === "stretch") return " Ya puede un reto.";
  if (band === "steady") return " Va estable.";
  return "";
}
