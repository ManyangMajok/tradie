const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch workspace packages outside the app directory
config.watchFolders = [monorepoRoot];

// Resolve packages from the app first, then the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force a single instance of react and react-native across all workspace packages.
//
// Why this is needed: pnpm installs a separate react-native peer copy inside
// packages/ui/node_modules for the member-app's older SDK context. Metro walks
// into that directory and loads the wrong version (0.76.x), which corrupts the
// TurboModule registry and causes PlatformConstants not found at runtime.
//
// extraNodeModules does NOT fix this — it is a fallback and loses to local
// node_modules. resolveRequest intercepts BEFORE directory walking, forcing
// all react/react-native requires to resolve from the app root.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName === 'react-native' ||
    moduleName.startsWith('react-native/')
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, 'index.js') },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
