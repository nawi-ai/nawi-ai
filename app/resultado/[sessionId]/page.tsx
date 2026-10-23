import Image from "next/image";
import { Suspense } from "react";

import { ResultPanel } from "@/components/result/result-panel";
import { Button } from "@/components/ui/button";
import { MagicBackButton } from "@/components/ui/magic-back-button";
import { settle } from "@/lib/api/http";
import { breakdownFor, getSessionDetail } from "@/lib/sessions/service";

export default function ResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense fallback={<ResultStatus loading />}>
      <ResultLoader params={params} />
    </Suspense>
  );
}

async function ResultLoader({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const result = await settle(() => getSessionDetail(sessionId), "No pudimos mostrar el resultado.");
  if (!result.ok && result.reason === "setup") return null;
  if (!result.ok && result.reason === "missing") {
    return (
      <ResultStatus
        eyebrow="La constelación no aparece"
        title="No encontramos ese resultado"
        description="Puede que esta aventura todavía no haya comenzado o que el enlace ya no esté disponible."
        href="/progreso"
        action="Ver mi progreso"
      />
    );
  }
  if (!result.ok) {
    return (
      <ResultStatus
        eyebrow="Las estrellas se escondieron"
        title="No pudimos mostrar el resultado"
        description={result.message}
        href="/progreso"
        action="Volver a mi progreso"
      />
    );
  }
  if (result.data.session.status !== "completed") {
    return (
      <ResultStatus
        eyebrow="Tu constelación sigue formándose"
        title="Esta lectura todavía no termina"
        description="El resultado aparecerá cuando guardes tus respuestas. Ñawi te espera en el último desafío."
        href={`/sesion/${result.data.session.id}/preguntas`}
        action="Seguir con las preguntas"
      />
    );
  }
  return <ResultPanel detail={result.data} breakdown={breakdownFor(result.data)} />;
}

function ResultStatus({
  eyebrow,
  title,
  description,
  href,
  action,
  loading = false,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  href?: string;
  action?: string;
  loading?: boolean;
}) {
  return (
    <section className="magic-result-page magic-result-status-page" aria-busy={loading || undefined}>
      <div className="magic-result-page__stars" aria-hidden="true" />
      <MagicBackButton fallbackHref="/progreso" ariaLabel="Volver a la pantalla anterior" />
      <article className={`magic-result-status${loading ? " magic-result-status--loading" : ""}`}>
        <div className="magic-result-status__nawi" aria-hidden="true">
          <span />
          <Image src="/nawi-mago.webp" alt="" width={1211} height={1299} sizes="240px" priority />
        </div>
        <div className="magic-result-status__copy">
          <p>{loading ? "✦ Leyendo las estrellas" : `✦ ${eyebrow}`}</p>
          <h1>{loading ? "Ñawi prepara tu constelación…" : title}</h1>
          <span>
            {loading
              ? "Un momento: estamos reuniendo las pistas de tu aventura."
              : description}
          </span>
          {!loading && href && action ? (
            <Button href={href} className="magic-result-status__action">
              {action} <span aria-hidden="true">→</span>
            </Button>
          ) : (
            <i aria-hidden="true" />
          )}
        </div>
      </article>
    </section>
  );
}
