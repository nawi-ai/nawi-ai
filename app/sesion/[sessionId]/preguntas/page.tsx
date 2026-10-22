import { Suspense } from "react";

import { QuizView } from "@/components/quiz/quiz-view";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { settle } from "@/lib/api/http";
import { getSessionDetail } from "@/lib/sessions/service";

export default function QuestionsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-2xl" />}>
      <QuestionsLoader params={params} />
    </Suspense>
  );
}

async function QuestionsLoader({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const result = await settle(() => getSessionDetail(sessionId), "No pudimos abrir las preguntas.");
  if (!result.ok && result.reason === "setup") return null;
  if (!result.ok && result.reason === "missing") {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-extrabold">No encontramos esa lectura</h1>
        <Button href="/cuentos" className="mt-6">
          Ir a la biblioteca
        </Button>
      </div>
    );
  }
  if (!result.ok) return <LoadError message={result.message} />;
  if (result.data.session.status === "completed") {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-extrabold">Esta lectura ya terminó</h1>
        <Button href={`/resultado/${result.data.session.id}`} className="mt-6">
          Ver el resultado
        </Button>
      </div>
    );
  }
  return <QuizView detail={result.data} />;
}
