const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo + monorepo setup
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */

// Get the project root (monorepo root)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Enable symlinks for yarn workspaces
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Support for shared packages in monorepo
config.resolver.extraNodeModules = {
  '@ruralconnect/shared': path.resolve(workspaceRoot, 'packages/shared'),
};

module.exports = config;
