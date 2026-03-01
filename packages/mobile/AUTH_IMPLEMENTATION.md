# Authentication Implementation

## Overview

The authentication system for RuralConnect AI implements a phone number + OTP based authentication flow with JWT token management. This document describes the implementation details and how to use the authentication system.

## Architecture

### Backend (packages/backend/src/api/auth.ts)

The backend provides the following API endpoints:

1. **POST /api/auth/send-otp** - Send OTP to phone number
2. **POST /api/auth/verify-otp** - Verify OTP and return JWT tokens
3. **POST /api/auth/profile** - Create/update user profile
4. **POST /api/auth/refresh** - Refresh access token
5. **POST /api/auth/logout** - Logout user

### Mobile App (packages/mobile/src)

The mobile app implements three authentication screens:

1. **PhoneInputScreen** - User enters 10-digit phone number
2. **OTPVerificationScreen** - User enters 6-digit OTP
3. **ProfileSetupScreen** - User completes profile (name, village, occupation, etc.)

## Authentication Flow

### 1. Phone Number Entry

```
User enters phone number → Validates 10 digits → Sends OTP via backend
```

**Features:**
- Input validation (10 digits)
- Loading state while sending OTP
- Error handling for network issues
- Country code prefix (+91 for India)

### 2. OTP Verification

```
User enters OTP → Verifies with backend → Returns JWT tokens + user data
```

**Features:**
- 6-digit OTP input
- Auto-submit when 6 digits entered
- Resend OTP with 60-second countdown
- Loading state during verification
- Error handling for invalid/expired OTP

### 3. Profile Setup

```
User fills profile → Submits to backend → Navigates to main app
```

**Features:**
- Required fields: Name, Village, Occupation
- Optional fields: Age, Gender, Language
- Dropdown selectors for occupation, gender, language
- Skip option for quick access
- Loading state during submission

## Token Management

### JWT Tokens

The system uses two types of tokens:

1. **Access Token** - Short-lived (15 minutes), used for API authentication
2. **Refresh Token** - Long-lived (30 days), used to refresh access tokens

### Token Storage

Tokens are stored securely using AsyncStorage:

```typescript
@ruralconnect:access_token  // Access token
@ruralconnect:refresh_token // Refresh token
@ruralconnect:user_data     // User profile data
```

### Automatic Token Refresh

The auth service automatically refreshes expired access tokens using the refresh token. This happens transparently when making API calls.

## API Integration

### Backend API (Mock Implementation)

The current backend implementation uses in-memory storage for development. In production, you should:

1. **Replace OTP storage** with Redis (with TTL)
2. **Replace user storage** with PostgreSQL
3. **Replace token storage** with Redis
4. **Integrate SMS service** (Twilio or AWS SNS) for sending OTP
5. **Use proper JWT signing** with jsonwebtoken library

### Mobile API Configuration

Update the API base URL in `packages/mobile/src/services/auth/auth-service.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'  // Android emulator
  : 'https://api.ruralconnect.app'; // Production
```

For iOS simulator, use `http://localhost:3000/api` or your machine's IP address.

## Usage Examples

### Check Authentication Status

```typescript
import { isAuthenticated } from './services/auth/auth-service';

const checkAuth = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    // User is logged in
  } else {
    // User needs to log in
  }
};
```

### Get User Data

```typescript
import { getUserData } from './services/auth/auth-service';

const loadUserProfile = async () => {
  const user = await getUserData();
  if (user) {
    console.log('User:', user.name, user.village);
  }
};
```

### Logout

```typescript
import { logout } from './services/auth/auth-service';

const handleLogout = async () => {
  await logout();
  // Navigate to login screen
};
```

## Security Considerations

### Current Implementation (Development)

- Mock OTP generation (logged to console)
- In-memory storage (data lost on restart)
- Simple token generation (not cryptographically secure)

### Production Requirements

1. **OTP Delivery**
   - Integrate Twilio or AWS SNS for SMS delivery
   - Implement rate limiting (max 3 OTP requests per hour)
   - Add OTP expiry (5 minutes)

2. **Token Security**
   - Use jsonwebtoken library with RS256 algorithm
   - Store private keys securely (AWS Secrets Manager)
   - Implement token rotation
   - Add token blacklisting for logout

3. **Data Encryption**
   - Encrypt sensitive data at rest (AES-256-GCM)
   - Use HTTPS for all API calls
   - Implement certificate pinning in mobile app

4. **Rate Limiting**
   - Limit OTP requests per phone number
   - Limit login attempts per IP
   - Implement CAPTCHA for suspicious activity

## Testing

### Manual Testing

1. Start the backend server
2. Run the mobile app
3. Enter a 10-digit phone number
4. Check console for OTP (in development)
5. Enter the OTP
6. Complete profile setup
7. Verify navigation to main app

### OTP for Testing

In development mode, the OTP is logged to the backend console:

```
[AUTH] OTP for 9876543210: 123456
```

## Error Handling

The authentication system handles the following errors:

1. **Invalid phone number** - Must be 10 digits
2. **OTP not found** - OTP expired or never sent
3. **Invalid OTP** - Wrong OTP entered
4. **Network errors** - Connection issues
5. **Token expired** - Automatic refresh attempted
6. **Profile creation failed** - Validation errors

All errors are displayed to the user with clear, actionable messages.

## Future Enhancements

1. **Voice Input** - Support for voice-based phone number entry
2. **Biometric Auth** - Fingerprint/Face ID for quick login
3. **Social Login** - Google/Facebook authentication
4. **Multi-factor Auth** - Additional security layer
5. **Password Option** - Alternative to OTP for offline scenarios
6. **Account Recovery** - Forgot password/phone number flow

## Related Files

### Backend
- `packages/backend/src/api/auth.ts` - Authentication API

### Mobile
- `packages/mobile/src/screens/auth/PhoneInputScreen.tsx` - Phone input screen
- `packages/mobile/src/screens/auth/OTPVerificationScreen.tsx` - OTP verification screen
- `packages/mobile/src/screens/auth/ProfileSetupScreen.tsx` - Profile setup screen
- `packages/mobile/src/services/auth/auth-service.ts` - Authentication service
- `packages/mobile/src/config/api.ts` - API client configuration

## Support

For issues or questions about the authentication system, please refer to:
- Design document: `.kiro/specs/ruralconnect-ai/design.md`
- Requirements: `.kiro/specs/ruralconnect-ai/requirements.md`
- Tasks: `.kiro/specs/ruralconnect-ai/tasks.md`
