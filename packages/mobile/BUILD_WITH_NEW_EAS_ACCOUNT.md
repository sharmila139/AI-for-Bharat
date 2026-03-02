# Building with a New EAS Account

## Why This Works

Each EAS account gets its own free tier allowance:
- 30 Android builds per month
- 30 iOS builds per month

By using a different account, you get a fresh set of builds.

## Step-by-Step Guide

### 1. Log Out of Current Account

```bash
cd packages/mobile
eas logout
```

### 2. Log In with New Account

```bash
eas login
```

You'll be prompted to:
- Enter email and password, OR
- Use browser-based login

**Note**: You can create a new Expo account at https://expo.dev/signup

### 3. Update Project Configuration

You have two options:

#### Option A: Create New EAS Project (Recommended)

```bash
eas build:configure
```

This will:
- Create a new project ID for the new account
- Update `app.json` with the new project ID
- Generate new build credentials

#### Option B: Manually Update app.json

Edit `packages/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "NEW_PROJECT_ID_HERE"
      }
    }
  }
}
```

Or remove the `projectId` field entirely and let EAS create one during the first build.

### 4. Generate New Keystore (First Build Only)

On your first build with the new account, EAS will ask:

```
? Generate a new Android Keystore? (Y/n)
```

Choose **Yes** to generate new credentials.

**Important**: Save these credentials! You'll need them for future builds and app updates.

### 5. Build Your APK

```bash
eas build --platform android --profile preview
```

### 6. Download Your APK

After the build completes (15-20 minutes):

1. Go to https://expo.dev/accounts/[YOUR_NEW_ACCOUNT]/projects/ruralconnect-ai/builds
2. Click on the completed build
3. Click "Download" to get your APK
4. Install on your device:
   ```bash
   adb install path/to/downloaded.apk
   ```

## Important Considerations

### Keystore Management

**CRITICAL**: Each EAS account will generate different signing keys.

- Apps signed with different keys are treated as different apps by Android
- You cannot update an app installed with one keystore using an APK signed with a different keystore
- Users would need to uninstall and reinstall

**For Production**: Stick with one account and keystore for the entire app lifecycle.

**For Testing**: Using different accounts is fine since you're just testing.

### Switching Back to Original Account

To switch back to your original account:

```bash
eas logout
eas login  # Use original credentials
```

Then update `app.json` back to the original project ID:
```json
"projectId": "c573e2e5-a47e-4843-be3e-a28e3183fae5"
```

## Alternative: Use Multiple Email Addresses

You can create multiple Expo accounts using:
- Different email addresses
- Gmail aliases (e.g., yourname+test1@gmail.com, yourname+test2@gmail.com)
- Temporary email services

Each account gets its own free tier.

## Current Configuration

Your current project is configured with:
- **Project ID**: `c573e2e5-a47e-4843-be3e-a28e3183fae5`
- **Account**: `sarath_0103`
- **Keystore**: `chinnu-build-v1`

## Quick Command Summary

```bash
# Switch to new account
cd packages/mobile
eas logout
eas login

# Create new project or update config
eas build:configure

# Build
eas build --platform android --profile preview

# Check build status
eas build:list

# Download APK from web dashboard
# https://expo.dev
```

## Troubleshooting

### "Project not found"
- Run `eas build:configure` to create a new project
- Or update the `projectId` in `app.json`

### "Invalid credentials"
- Make sure you're logged in: `eas whoami`
- Log in again: `eas login`

### "Keystore already exists"
- This is fine, EAS will use the existing keystore
- Or generate a new one if prompted

## Cost Comparison

| Plan | Price | Android Builds | iOS Builds |
|------|-------|----------------|------------|
| Free | $0 | 30/month | 30/month |
| Production | $29/month | 30/month | 30/month |
| Enterprise | Custom | Unlimited | Unlimited |

**Note**: Multiple free accounts is allowed by Expo for personal/testing use.

## Recommendation

For immediate testing:
1. Create a new Expo account (or use an existing alternate account)
2. Build with the new account
3. Test your APK
4. Switch back to original account for production builds

This is the fastest way to get your APK built right now!
