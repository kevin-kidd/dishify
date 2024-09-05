"use client";

import { TRPCProvider } from "./trpc";
import { SafeAreaProvider } from "./safe-area";
import { SolitoImageProvider } from "./solito-image";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider } from "./auth";
import { ThemeProvider } from "./theme";
import { isWeb } from "@tamagui/constants";
import { Toaster } from "burnt/web";
import { StylesProvider } from "./styles";
import { PortalHost } from "@rn-primitives/portal";

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
          {/* <StylesProvider> */}
          <ThemeProvider>
            {children}
            {isWeb && <Toaster position="bottom-right" />}
            <PortalHost />
          </ThemeProvider>
          {/* </StylesProvider> */}
        </TRPCProvider>
        {/* </AuthProvider> */}
      </SolitoImageProvider>
    </SafeAreaProvider>
  );
}
