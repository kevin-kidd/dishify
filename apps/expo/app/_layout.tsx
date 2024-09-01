import { Provider } from "app/provider";
import { SplashScreen, Stack } from "expo-router";
import { useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import "./global.css";
import useHasMounted from "app/utils/hooks/useHasMounted";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  integrations: [
    new Sentry.ReactNativeTracing({
      // Pass instrumentation to be used as `routingInstrumentation`
      routingInstrumentation,
      enableNativeFramesTracking: !isRunningInExpoGo(),
    }),
  ],
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const ref = useNavigationContainerRef();
  const hasMounted = useHasMounted();
  useEffect(() => {
    if (hasMounted) {
      SplashScreen.hideAsync();
    }
  }, [hasMounted]);
  useEffect(() => {
    if (ref) {
      routingInstrumentation.registerNavigationContainer(ref);
    }
  }, [ref]);
  return (
    <Provider initialSession={null}>
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
}

export default Sentry.wrap(RootLayout);
