import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Suspense } from "react";

import { AppShell, ShellSkeleton } from "@/components/layout/app-shell";
import { SetupPanel } from "@/components/layout/setup-panel";
import { MagicCursor } from "@/components/ui/magic-cursor";
import { AppError } from "@/lib/api/http";
import { loadIdentity } from "@/lib/auth/identity";
import { isRemotePersistenceConfigured } from "@/lib/env.server";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ñawi",
    template: "%s · Ñawi",
  },
  description: "Tu compa de lectura IA. Cuentos cortos, narración y comprensión para niños.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans text-ink antialiased">
        <MagicCursor />
        <Suspense fallback={<ShellSkeleton />}>
          <Frame>{children}</Frame>
        </Suspense>
      </body>
    </html>
  );
}

async function Frame({ children }: { children: React.ReactNode }) {
  const identity = await readIdentity();
  if (identity.kind === "failed") {
    return (
      <AppShell note={identity.message}>
        <SetupPanel message={identity.message} remoteConfigured={identity.remoteConfigured} />
      </AppShell>
    );
  }

  const note =
    identity.kind === "reader"
      ? identity.persistenceNote
      : "Sin configuración remota, Ñawi puede continuar en una demostración local. Ese modo no guarda en la nube.";

  return (
    <AppShell note={note}>
      {identity.kind === "setup" ? (
        <SetupPanel message={identity.message} remoteConfigured={identity.remoteConfigured} />
      ) : (
        children
      )}
    </AppShell>
  );
}

async function readIdentity() {
  try {
    return await loadIdentity();
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    return {
      kind: "failed" as const,
      message: error.message,
      remoteConfigured: isRemotePersistenceConfigured(),
    };
  }
}
