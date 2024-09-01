import type { ConfigContext, ExpoConfig } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
  owner: process.env.EXPO_PUBLIC_EAS_OWNER,
  plugins: ["expo-router"],
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  platforms: ["ios", "android"],
  name: "Dishify",
  slug: "dishify",
  updates: {
    url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_EAS_PROJECT_ID}`, // TODO: fill in ID for updates url
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
});
