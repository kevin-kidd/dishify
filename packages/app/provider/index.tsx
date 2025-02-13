"use client";

import { TRPCProvider } from "./trpc/index.web";
import { SafeAreaProvider } from "./safe-area";
import { SolitoImageProvider } from "./solito-image";
import { ThemeProvider } from "./theme";
import { PortalHost } from "@rn-primitives/portal";
import { ToastProvider } from "./toasts";

export function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SafeAreaProvider>
      <SolitoImageProvider>
        <TRPCProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
            <PortalHost />
          </ThemeProvider>
        </TRPCProvider>
      </SolitoImageProvider>
    </SafeAreaProvider>
  );
}
