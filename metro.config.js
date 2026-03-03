const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Ensure Metro can resolve modules from project node_modules (avoids "Unable to resolve expo-router/entry")
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Don't use Watchman (optional file watcher). Metro falls back to Node watchers.
config.resolver.useWatchman = false;

module.exports = withNativeWind(config, { input: './global.css' });