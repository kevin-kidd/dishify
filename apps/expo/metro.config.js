// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("@expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// // Add import aliases
// config.resolver.alias = {
//   "~": path.resolve(projectRoot, "src"),
// };

// Add the additional `cjs` extension to the resolver
config.resolver.sourceExts.push("cjs");

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

config.transformer = { ...config.transformer, unstable_allowRequireContext: true };

module.exports = withNativeWind(config, {
  input: "./app/global.css",
  configPath: "./tailwind.config.ts",
});

const sentryConfig = getSentryExpoConfig(__dirname);

module.exports = sentryConfig;
