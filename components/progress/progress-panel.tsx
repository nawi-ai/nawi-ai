import { NawiCharacter } from "@/components/brand/nawi-character";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/lib/reading-level";
import type { ProgressView } from "@/lib/sessions/views";

export function ProgressPanel({ progress }: { progress: ProgressView }) {
  const level = LEVELS.find((item) => item.id === progress.preferredLevel);
  const completed = progress.sessions.filter((session) => session.status === "completed");
  const showChart = completed.length >= 2;

  if (progress.sessions.length === 0) {
    return (
      <section className="mx-auto max-w-xl rounded-[28px] border border-line bg-surface px-6 py-10 text-center">
        <NawiCharacter className="mx-auto h-36 w-36" />
        <h1 className="mt-2 text-3xl font-extrabold">¡Tu primera aventura te espera!</h1>
        <p className="mt-3 text-lg leading-8 text-muted">
          Cuando termines un cuento, aquí aparecerán tus lecturas.
        </p>
        <Button href="/niveles" className="mt-6">
          Comenzar a leer
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold md:text-4xl">Mi progreso</h1>
        <p className="mt-2 text-lg text-muted">
          {progress.completedCount} {progress.completedCount === 1 ? "cuento completado" : "cuentos completados"}
          {level ? ` · Nivel preferido: ${level.name}` : ""}
        </p>
      </header>

      {progress.pending ? (
        <section className="rounded-[28px] border border-line bg-sun/50 p-5">
          <h2 className="text-xl font-extrabold">Tienes una lectura empezada</h2>
          <p className="mt-1 text-base">{progress.pending.storyTitle}</p>
          <Button href={`/leer/${progress.pending.id}`} className="mt-4">
            Continuar
          </Button>
        </section>
      ) : null}

      {progress.profileNote ? (
        <section className="rounded-[28px] border border-line bg-surface p-5">
          <h2 className="text-xl font-extrabold">Tu perfil de comprensión</h2>
          <p className="mt-2 text-lg leading-8">{progress.profileNote}</p>
          <ul className="mt-4 space-y-2">
            {progress.skills.map((item) => (
              <li key={item.skill} className="rounded-2xl bg-canvas px-4 py-3 text-base leading-7">
                <span className="font-extrabold">{item.strength}. </span>
                {item.improving
                  ? "Vas mejorando."
                  : item.practicing > 0
                    ? "Todavía lo estamos practicando."
                    : item.alone > 0
                      ? "Lo logras por tu cuenta."
                      : "Lo lograste con una pista."}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showChart ? (
        <section aria-labelledby="grafico-titulo">
          <h2 id="grafico-titulo" className="text-xl font-extrabold">
            Puntajes guardados
          </h2>
          <p className="mt-1 text-sm text-muted">Cada barra es una lectura terminada. No es una tendencia.</p>
          <ul className="mt-4 space-y-3">
            {completed.map((session) => (
              <li key={session.id}>
                <div className="mb-1 flex justify-between text-sm font-bold">
                  <span>{session.storyTitle}</span>
                  <span>{session.score === null ? "En revisión" : session.score}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-line" role="img" aria-label={`${session.storyTitle}: ${session.score ?? "sin puntaje"} de 100`}>
                  <div
                    className="h-full rounded-full bg-leaf"
                    style={{ width: `${session.score ?? 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : completed.length === 1 ? (
        <section className="rounded-[28px] bg-surface p-5 shadow-sm">
          <h2 className="text-xl font-extrabold">Tu primera lectura terminada</h2>
          <p className="mt-2 text-lg">
            {completed[0]?.storyTitle}: {completed[0]?.score === null ? "en revisión" : `${completed[0]?.score} puntos`}
          </p>
          <p className="mt-2 text-sm text-muted">Con una sola lectura no mostramos una tendencia.</p>
        </section>
      ) : null}

      <section>
        <h2 className="text-xl font-extrabold">Últimas sesiones</h2>
        <ul className="mt-3 grid gap-3">
          {progress.sessions.map((session) => (
            <li key={session.id} className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-lg font-extrabold">{session.storyTitle}</p>
              <p className="text-sm text-muted">
                {session.status === "completed" ? "Terminada" : "En progreso"}
                {session.score !== null ? ` · ${session.score} puntos` : ""}
              </p>
              <Button
                href={session.status === "completed" ? `/resultado/${session.id}` : `/leer/${session.id}`}
                variant="ghost"
                className="mt-2 px-0"
              >
                {session.status === "completed" ? "Ver resultado" : "Seguir"}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {progress.recommendation ? (
        <section className="rounded-[28px] bg-leaf-soft p-5">
          <h2 className="text-xl font-extrabold">Para la próxima lectura</h2>
          <p className="mt-2 text-base leading-7">{progress.recommendation}</p>
          {progress.supportNote ? <p className="mt-2 text-base leading-7">{progress.supportNote}</p> : null}
          {progress.nextStory ? (
            <Button href={`/cuentos/${progress.nextStory.id}`} className="mt-4">
              Ver {progress.nextStory.title}
            </Button>
          ) : (
            <Button href="/cuentos" className="mt-4" variant="secondary">
              Ir a la biblioteca
            </Button>
          )}
        </section>
      ) : null}
    </div>
  );
}
