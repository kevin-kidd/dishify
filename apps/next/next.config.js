const { DefinePlugin } = require("webpack");
const million = require("million/compiler");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  iconPaths: {
    favicon: "/pwa/icons/favicon.ico",
    apple: "/pwa/icons/touch-icon-iphone-retina.png",
    android: "/pwa/icons/android-chrome-192x192.png",
  },
});

const boolVals = {
  true: true,
  false: false,
};

const disableBrowserLogs =
  boolVals[process.env.DISABLE_BROWSER_LOGS] ?? process.env.NODE_ENV === "production";

const enableMillionJS =
  boolVals[process.env.ENABLE_MILLION_JS] ?? process.env.NODE_ENV === "production";

const plugins = [withPWA, withBundleAnalyzer];

module.exports = () => {
  /** @type {import('next').NextConfig} */
  let config = {
    // Uncomment if you want to use Cloudflare's Paid Image Resizing w/ Next/Image
    images: {
      loader: "custom",
      loaderFile: "./cfImageLoader.js",
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    webpack: (config) => {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        // Transform all direct `react-native` imports to `react-native-web`
        "react-native$": "react-native-web",
      };
      config.resolve.extensions = [
        ".web.js",
        ".web.jsx",
        ".web.ts",
        ".web.tsx",
        ...config.resolve.extensions,
      ];

      config.plugins.push(
        new DefinePlugin({
          __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
        }),
      );

      return config;
    },
    reactStrictMode: false,
    transpilePackages: [
      "react-native-css-interop",
      "solito",
      "nativewind",
      "sonner-native",
      "@rn-primitives/slot",
      "@rn-primitives/separator",
      "@rn-primitives/portal",
      "@rn-primitives/popover",
      "@dishify/ui",
      "react-native-reanimated",
      "react-native-safe-area-context",
      "react-native-gesture-handler",
      "react-native-web",
      "@expo/html-elements",
      "react-camera-pro",
      "embla-carousel-react",
      "lucide-react-native",
      "moti",
      "react-native-circular-progress",
    ],
    experimental: {
      scrollRestoration: true,
      forceSwcTransforms: true,
      swcPlugins: [
        [
          "next-superjson-plugin",
          {
            excluded: [],
          },
        ],
      ],
    },
    compiler: {
      removeConsole: disableBrowserLogs,
    },
  };

  for (const plugin of plugins) {
    config = {
      ...config,
      ...plugin(config),
    };
  }

  const millionConfig = {
    auto: true,
    mute: true,
  };

  if (enableMillionJS) {
    return million.next(config, millionConfig);
  }
  return config;
};
