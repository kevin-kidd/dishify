const million = require("million/compiler")
const { withExpo } = require("@expo/next-adapter")
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  sw: "service-worker.js",
  swcMinify: true,
})

const boolVals = {
  true: true,
  false: false,
}

const disableBrowserLogs =
  boolVals[process.env.DISABLE_BROWSER_LOGS] ?? process.env.NODE_ENV === "production"

const enableMillionJS =
  boolVals[process.env.ENABLE_MILLION_JS] ?? process.env.NODE_ENV === "production"

// Enabling might cause FOUC on page refreshes
const optimizeCss = true

const plugins = [withPWA, withExpo, withBundleAnalyzer]

module.exports = () => {
  /** @type {import('next').NextConfig} */
  let config = {
    // Uncomment if you want to use Cloudflare's Paid Image Resizing w/ Next/Image
    // images: {
    //   loader: 'custom',
    //   loaderFile: './cfImageLoader.js',
    // },
    // Using Solito image loader without Cloudflare's Paid Image Resizing
    images: {},
    typescript: {
      ignoreBuildErrors: true,
    },
    transpilePackages: [
      "react-native",
      "react-native-web",
      "solito",
      "moti",
      "app",
      "react-native-reanimated",
      "nativewind",
      "react-native-gesture-handler",
      "react-native-svg",
      "expo-linking",
      "expo-constants",
      "expo-modules-core",
      "react-native-safe-area-context",
      "react-native-circular-progress",
      "react-native-css-interop",
      "burnt",
      "@rn-primitives/slot",
      "@rn-primitives/separator",
      "glin-profanity",
    ],
    experimental: {
      optimizeCss,
      forceSwcTransforms: true,
      scrollRestoration: true,
      webpackBuildWorker: true,
    },
    compiler: {
      removeConsole: disableBrowserLogs,
    },
  }

  for (const plugin of plugins) {
    config = {
      ...config,
      ...plugin(config),
    }
  }

  const millionConfig = {
    auto: true,
    mute: true,
  }

  if (enableMillionJS) {
    return million.next(config, millionConfig)
  }
  return config
}
