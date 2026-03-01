const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for monorepo setup
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

// Get the project root (monorepo root)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  // Watch all files in the monorepo
  watchFolders: [workspaceRoot],

  resolver: {
    // Enable symlinks for yarn workspaces
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],

    // Support for shared packages in monorepo
    extraNodeModules: {
      '@ruralconnect/shared': path.resolve(workspaceRoot, 'packages/shared'),
    },

    // Asset extensions
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ttf', 'otf', 'woff', 'woff2'],

    // Source extensions
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
