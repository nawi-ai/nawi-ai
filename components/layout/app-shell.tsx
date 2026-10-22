import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShell({
  children,
  note,
}: {
  children: React.ReactNode;
  note: string;
}) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-3"
      >
        Saltar al contenido
      </a>
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Logo />
        <nav aria-label="Principal" className="flex items-center gap-1 text-base font-extrabold">
          <Link className="rounded-full px-3 py-2 hover:bg-surface" href="/cuentos">
            Cuentos
          </Link>
          <Link className="rounded-full px-3 py-2 hover:bg-surface" href="/progreso">
            Progreso
          </Link>
        </nav>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-12 sm:px-6">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[1200px] space-y-2 px-4 pb-8 text-sm leading-6 text-muted sm:px-6">
        <p>{note}</p>
        <p>Ñawi acompaña la lectura. No reemplaza a un docente ni es una evaluación clínica.</p>
        <Link href="/acerca" className="inline-block font-extrabold text-leaf">
          Sobre esta experiencia
        </Link>
      </footer>
    </>
  );
}

export function ShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">
      <Skeleton className="h-12 w-40" />
      <Skeleton className="mt-8 h-64 w-full" />
    </div>
  );
}
