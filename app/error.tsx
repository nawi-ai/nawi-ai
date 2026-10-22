"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("nawi_page", error.digest ?? "error");
  }, [error]);

  return (
    <div className="mx-auto max-w-xl text-center">
      <h1 className="text-3xl font-extrabold">Algo se enredó</h1>
      <p className="mt-3 text-lg leading-8 text-muted">No pudimos mostrar esta página. Puedes intentarlo otra vez.</p>
      <Button className="mt-6" type="button" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
