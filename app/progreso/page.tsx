import { Suspense } from "react";

import { ProgressPanel } from "@/components/progress/progress-panel";
import { LoadError } from "@/components/ui/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { settle } from "@/lib/api/http";
import { getProgress } from "@/lib/sessions/service";

export const metadata = { title: "Progreso" };

export default function ProgresoPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full" />}>
      <ProgressLoader />
    </Suspense>
  );
}

async function ProgressLoader() {
  const result = await settle(() => getProgress(), "No pudimos cargar tu progreso.");
  if (!result.ok) {
    if (result.reason === "setup" || result.reason === "missing") return null;
    return <LoadError message={result.message} />;
  }
  return <ProgressPanel progress={result.data} />;
}
