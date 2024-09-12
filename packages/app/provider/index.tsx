"use client";

import { TRPCProvider } from "./trpc";
import { SafeAreaProvider } from "./safe-area";
import { SolitoImageProvider } from "./solito-image";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider } from "./auth";
import { ThemeProvider } from "./theme";
import { PortalHost } from "@rn-primitives/portal";
import { Header } from "app/features/header";
import { ToastProvider } from "./toasts";

export function Provider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  return (
    <SafeAreaProvider>
      <SolitoImageProvider>
        {/* <AuthProvider initialSession={initialSession}> */}
        <TRPCProvider>
          <ThemeProvider>
            <ToastProvider>
              <Header />
              {children}
            </ToastProvider>
            <PortalHost />
          </ThemeProvider>
        </TRPCProvider>
        {/* </AuthProvider> */}
      </SolitoImageProvider>
    </SafeAreaProvider>
  );
}
