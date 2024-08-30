import { Provider } from "app/provider"
import { SplashScreen, Stack } from "expo-router"
import { useEffect } from "react"
import "./global.css"
import useHasMounted from "app/utils/hooks/useHasMounted"

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router"

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const hasMounted = useHasMounted()
  useEffect(() => {
    if (hasMounted) {
      SplashScreen.hideAsync()
    }
  }, [hasMounted])
  return (
    <Provider initialSession={null}>
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  )
}
