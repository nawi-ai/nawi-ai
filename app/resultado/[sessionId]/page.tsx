import { Suspense } from "react";

import { ResultPanel } from "@/components/result/result-panel";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { settle } from "@/lib/api/http";
import { breakdownFor, getSessionDetail } from "@/lib/sessions/service";

export default function ResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-3xl" />}>
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
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-extrabold">No encontramos ese resultado</h1>
        <Button href="/progreso" className="mt-6">
          Ver mi progreso
        </Button>
      </div>
    );
  }
  if (!result.ok) return <LoadError message={result.message} />;
  if (result.data.session.status !== "completed") {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-extrabold">Esta lectura todavía no termina</h1>
        <p className="mt-3 text-lg leading-8 text-muted">
          El resultado aparece cuando las preguntas quedan guardadas. No hay un puntaje antes de eso.
        </p>
        <Button href={`/sesion/${result.data.session.id}/preguntas`} className="mt-6">
          Seguir con las preguntas
        </Button>
      </div>
    );
  }
  return <ResultPanel detail={result.data} breakdown={breakdownFor(result.data)} />;
}
