import { Suspense } from "react";

import { MagicWelcome } from "@/components/home/magic-welcome";
import { settle } from "@/lib/api/http";
import { getHomeState } from "@/lib/sessions/service";

export default function HomePage() {
  return (
    <Suspense fallback={<MagicWelcome enterHref="/niveles" />}>
      <WelcomeWithReaderState />
    </Suspense>
  );
}

async function WelcomeWithReaderState() {
  const result = await settle(() => getHomeState(), "No pudimos recuperar tu lectura.");
  const pending = result.ok ? result.data.pending : null;
  const enterHref = pending
    ? pending.hasAnswers
      ? `/sesion/${pending.id}/preguntas`
      : `/leer/${pending.id}`
    : "/niveles";

  return <MagicWelcome enterHref={enterHref} />;
}
