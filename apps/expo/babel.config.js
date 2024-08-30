module.exports = function (api) {
  api.cache.forever()
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: [
      [
        require.resolve("babel-plugin-module-resolver"),
        {
          root: ["../.."],
          alias: {
            app: "../../packages/app",
            "@dishify/api": "../../packages/api",
            "@dishify/ui": "../../packages/ui",
          },
          extensions: [".js", ".jsx", ".tsx", ".ios.js", ".android.js"],
        },
      ],
      require.resolve("expo-router/babel"),
      require.resolve("jotai/babel/plugin-react-refresh"),
      require.resolve("react-native-reanimated/plugin"),
    ],
  }
}
