"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export function LoadError({ message }: { message: string }) {
  const router = useRouter();
  return (
    <Notice tone="error">
      <p>{message}</p>
      <Button className="mt-4" type="button" onClick={() => router.refresh()}>
        Reintentar
      </Button>
    </Notice>
  );
}
