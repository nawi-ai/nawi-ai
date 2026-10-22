"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { NawiCharacter } from "@/components/brand/nawi-character";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ApiClientError, apiRequest } from "@/lib/api/browser";

export function SetupPanel({
  message,
  remoteConfigured,
}: {
  message: string;
  remoteConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"demo" | "remote" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(path: string, mode: "demo" | "remote") {
    setPending(mode);
    setError(null);
    try {
      await apiRequest(path, { method: "POST" });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No pudimos continuar.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="grid items-center gap-8 rounded-[28px] border border-line bg-surface p-6 shadow-sm md:grid-cols-[1.2fr_0.8fr] md:p-10">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-wide text-leaf">Configuración</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
          Ñawi todavía no puede guardar en la nube
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" disabled={pending !== null} onClick={() => run("/api/auth/demo", "demo")}>
            {pending === "demo" ? "Preparando..." : "Usar demostración local"}
          </Button>
          {remoteConfigured ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending !== null}
              onClick={() => run("/api/auth/remote", "remote")}
            >
              {pending === "remote" ? "Probando..." : "Reintentar Supabase"}
            </Button>
          ) : null}
        </div>
        {error ? (
          <div className="mt-4">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : null}
        <p className="mt-6 text-sm leading-6 text-muted">
          La demostración local no es un guardado remoto. Sirve para recorrer la aplicación en este servidor.
        </p>
      </div>
      <div className="flex justify-center">
        <NawiCharacter />
      </div>
    </section>
  );
}
