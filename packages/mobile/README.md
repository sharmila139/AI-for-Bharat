# RuralConnect AI - Mobile Application

React Native mobile application for RuralConnect AI, empowering rural communities through AI-driven insights.

## Features

- **Offline-First Architecture**: Core features work without internet connectivity
- **Multi-Language Support**: 15+ Indian languages with voice interface
- **Low-End Device Optimization**: Runs smoothly on devices with 1GB RAM
- **TypeScript**: Full type safety with strict mode enabled
- **Modular Architecture**: Clean separation of concerns

## Tech Stack

- **Framework**: React Native 0.72.6
- **Language**: TypeScript 5.1+ (Strict Mode)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation 6
- **Local Database**: Realm
- **Testing**: Jest + React Native Testing Library

## Prerequisites

- Node.js >= 18.0.0
- Yarn >= 1.22.0
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- JDK 11 or higher

## Installation

From the monorepo root:

```bash
# Install dependencies
yarn install

# Install mobile dependencies
cd packages/mobile
yarn install
```

## Running the App

### Android

```bash
# Start Metro bundler
yarn start

# In another terminal, run Android app
yarn android
```

### iOS (macOS only)

```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Start Metro bundler
yarn start

# In another terminal, run iOS app
yarn ios
```

## Development

### Project Structure

```
packages/mobile/
├── android/              # Android native code
├── ios/                  # iOS native code (to be added)
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   ├── services/         # API and business logic
│   ├── database/         # Realm database schemas
│   ├── config/           # Configuration files
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript type definitions
├── App.tsx               # Root component
├── index.js              # Entry point
├── metro.config.js       # Metro bundler configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

### Available Scripts

- `yarn start` - Start Metro bundler
- `yarn android` - Run on Android device/emulator
- `yarn ios` - Run on iOS device/simulator
- `yarn test` - Run Jest tests
- `yarn lint` - Run ESLint
- `yarn type-check` - Run TypeScript type checking
- `yarn clean` - Clean build artifacts

### TypeScript Configuration

The project uses strict TypeScript configuration with:
- Strict null checks
- No implicit any
- Strict function types
- No unused locals/parameters
- No implicit returns

### Path Aliases

The following path aliases are configured:

- `@/*` - src directory
- `@components/*` - src/components
- `@screens/*` - src/screens
- `@services/*` - src/services
- `@database/*` - src/database
- `@config/*` - src/config
- `@utils/*` - src/utils
- `@types/*` - src/types

### Metro Bundler Configuration

The Metro bundler is configured for monorepo support:
- Watches all files in the monorepo
- Supports symlinks for yarn workspaces
- Includes shared packages from `@ruralconnect/shared`

## Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage
```

## Building for Production

### Android

```bash
# Generate release APK
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### iOS

```bash
# Open Xcode
open ios/RuralConnectAI.xcworkspace

# Select "Product" > "Archive" in Xcode
```

## Performance Optimization

- **App Size**: Target <50MB initial download
- **Memory**: Limit usage to <200MB during operation
- **Startup**: First contentful paint within 1500ms
- **Offline**: Core features work without connectivity

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear Metro cache
yarn start --reset-cache
```

### Android Build Issues

```bash
# Clean Android build
cd android
./gradlew clean
cd ..
```

### Dependency Issues

```bash
# Clean and reinstall
yarn clean
rm -rf node_modules
yarn install
```

## Contributing

1. Follow the TypeScript strict mode guidelines
2. Write tests for new features
3. Use the configured path aliases
4. Follow the existing code structure
5. Run `yarn lint` and `yarn type-check` before committing

## License

MIT
