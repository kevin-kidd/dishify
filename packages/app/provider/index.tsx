import { TRPCProvider } from "./trpc"
import { SafeAreaProvider } from "./safe-area"
import { SolitoImageProvider } from "./solito-image"
import { Session } from "@supabase/supabase-js"
import { AuthProvider } from "./auth"
import { ThemeProvider } from "./theme"
import { isWeb } from "@tamagui/constants"
import { Toaster } from "burnt/web"

export function Provider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: Session | null
}) {
  return (
    <SafeAreaProvider>
      <SolitoImageProvider>
        <AuthProvider initialSession={initialSession}>
          <TRPCProvider>
            <ThemeProvider>
              {children}
              {isWeb && <Toaster position="bottom-right" />}
            </ThemeProvider>
          </TRPCProvider>
        </AuthProvider>
      </SolitoImageProvider>
    </SafeAreaProvider>
  )
}
