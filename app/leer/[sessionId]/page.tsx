import { Suspense } from "react";

import { ReaderView } from "@/components/reader/reader-view";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { settle } from "@/lib/api/http";
import { getSessionDetail } from "@/lib/sessions/service";

export default function ReaderPage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
      <ReaderLoader params={params} />
    </Suspense>
  );
}

async function ReaderLoader({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const result = await settle(() => getSessionDetail(sessionId), "No pudimos abrir el cuento.");
  if (!result.ok && result.reason === "setup") return null;
  if (!result.ok && result.reason === "missing") {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-extrabold">No encontramos esa lectura</h1>
        <p className="mt-3 text-lg text-muted">Puede que el enlace sea de otra persona o que ya no exista.</p>
        <Button href="/cuentos" className="mt-6">
          Ir a la biblioteca
        </Button>
      </div>
    );
  }
  if (!result.ok) return <LoadError message={result.message} />;
  return <ReaderView session={result.data.session} story={result.data.story} />;
}
