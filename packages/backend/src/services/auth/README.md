# Authentication & User Management Module

Complete authentication system for RuralConnect AI with phone-based OTP authentication, JWT tokens, encryption, and user management.

## Features

### 1. OTP Authentication (`otp-service.ts`)
- Phone number validation (Indian format: +91XXXXXXXXXX)
- 6-digit OTP generation using cryptographically secure random numbers
- SMS delivery via AWS SNS
- 10-minute OTP expiry
- Maximum 3 verification attempts
- OTP storage in DynamoDB with TTL

### 2. JWT Token Management (`jwt-service.ts`)
- Access tokens: 15-minute expiry
- Refresh tokens: 30-day expiry
- Token generation with user payload
- Token verification and validation
- Refresh token storage in DynamoDB
- Token revocation support

### 3. Token Refresh (`token-refresh.ts`)
- Automatic token refresh mechanism
- 5-minute threshold for proactive refresh
- Old token revocation after refresh
- Token expiry time calculation
- Validation and auto-refresh flow

### 4. User Profile Management (`user-profile.ts`)
- Create, read, update, delete user profiles
- Phone number-based user lookup
- Profile validation
- Last login tracking
- GDPR-compliant data anonymization

### 5. Encryption (`encryption.ts`)
- AES-256-GCM encryption for sensitive data
- Random IV generation for each encryption
- Authentication tag for data integrity
- Aadhaar number encryption
- Health record encryption
- Data masking utilities

### 6. Hashing (`hashing.ts`)
- Bcrypt password hashing (12 rounds)
- SHA-256 one-way hashing for PII
- HMAC-based hashing with secrets
- Aadhaar, phone, and email hashing
- Data anonymization utilities
- Secure token generation

### 7. Rate Limiting (`rate-limiter.ts`)
- 1000 requests per hour per user
- Sliding window rate limiting
- DynamoDB-based rate limit storage
- Automatic window reset
- Custom rate limits for specific endpoints
- Retry-after headers

### 8. Account Deletion (`account-deletion.ts`)
- 30-day grace period before deletion
- Comprehensive data anonymization
- Multi-table data cleanup
- GDPR compliance
- Deletion request cancellation
- Scheduled deletion processing

### 9. Unified Auth Service (`auth-service.ts`)
- Complete authentication flow
- Login initiation with OTP
- OTP verification and token generation
- Token refresh
- Logout with token revocation
- Rate limiting integration

## Property-Based Tests

All authentication services include property-based tests using fast-check:

### Property 1: Authentication Round Trip
- Token generation and verification preserve user identity
- Refresh tokens maintain authentication state

### Property 2: Encryption Round Trip
- Decryption always returns original plaintext
- Different IVs produce different ciphertexts
- Aadhaar and health record encryption/decryption

### Property 3: Token Refresh Mechanism
- Refreshed tokens are always valid
- Old refresh tokens are invalidated after use
- User identity preserved through refresh

### Property 4: JWT Token Expiry
- Newly generated tokens are not expired
- Expiry time is correctly calculated
- Time until expiry is accurate

## Usage Examples

### Complete Authentication Flow

```typescript
import { AuthService } from './services/auth';

const authService = new AuthService();

// 1. Initiate login
const loginResult = await authService.initiateLogin({
  phoneNumber: '+919876543210',
});

// 2. Verify OTP and login
const verifyResult = await authService.verifyAndLogin({
  phoneNumber: '+919876543210',
  otp: '123456',
});

// 3. Use access token for API requests
const { accessToken, refreshToken } = verifyResult.data;

// 4. Refresh token when needed
const refreshResult = await authService.refreshToken(refreshToken);

// 5. Logout
await authService.logout(refreshToken);
```

### Encryption

```typescript
import { getEncryptionService } from './services/auth';

const encryption = getEncryptionService();

// Encrypt Aadhaar
const encrypted = encryption.encryptAadhaar('123456789012');

// Decrypt Aadhaar
const decrypted = encryption.decryptAadhaar(encrypted);

// Encrypt health record
const healthData = { diagnosis: 'Fever', medications: ['Paracetamol'] };
const encryptedHealth = encryption.encryptHealthRecord(healthData);
const decryptedHealth = encryption.decryptHealthRecord(encryptedHealth);
```

### Hashing

```typescript
import { getHashingService } from './services/auth';

const hashing = getHashingService();

// Hash Aadhaar (one-way)
const aadhaarHash = hashing.hashAadhaar('123456789012');

// Hash password
const passwordHash = await hashing.hashPassword('myPassword123');

// Verify password
const isValid = await hashing.verifyPassword('myPassword123', passwordHash);
```

### Rate Limiting

```typescript
import { getRateLimiter } from './services/auth';

const rateLimiter = getRateLimiter();

// Check rate limit
const result = await rateLimiter.checkRateLimit(userId);

if (!result.allowed) {
  console.log(`Rate limit exceeded. Retry after ${result.retryAfter} seconds`);
}
```

## Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1

# DynamoDB Tables
OTP_TABLE=ruralconnect-otp
REFRESH_TOKEN_TABLE=ruralconnect-refresh-tokens
USER_PROFILES_TABLE=ruralconnect-users
RATE_LIMIT_TABLE=ruralconnect-rate-limits
DELETION_REQUEST_TABLE=ruralconnect-deletion-requests

# JWT Secrets (store in AWS Secrets Manager in production)
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Encryption Key (store in AWS KMS in production)
ENCRYPTION_KEY=your-256-bit-hex-key

# Hashing Secrets
HMAC_SECRET=your-hmac-secret
HASH_PEPPER=your-hash-pepper

# External Services
DATA_GOV_IN_API_KEY=your-api-key
```

## Security Best Practices

1. **Secrets Management**: Store all secrets in AWS Secrets Manager or KMS
2. **Token Storage**: Never store tokens in localStorage (use httpOnly cookies)
3. **Rate Limiting**: Implement rate limiting on all authentication endpoints
4. **HTTPS Only**: Always use HTTPS in production
5. **Input Validation**: Validate all user inputs
6. **Audit Logging**: Log all authentication events
7. **Regular Key Rotation**: Rotate encryption keys and JWT secrets regularly
8. **MFA**: Consider adding multi-factor authentication for sensitive operations

## Testing

Run property-based tests:

```bash
npm test -- auth.property.test.ts
```

Run all authentication tests:

```bash
npm test -- __tests__/auth
```

## DynamoDB Table Schemas

### OTP Table
- Primary Key: `phoneNumber` (String)
- Attributes: `otp`, `createdAt`, `expiresAt`, `attempts`, `verified`
- TTL: `expiresAt`

### Refresh Token Table
- Primary Key: `refreshToken` (String)
- Attributes: `userId`, `phoneNumber`, `createdAt`, `expiresAt`, `revoked`
- TTL: `expiresAt`

### User Profiles Table
- Primary Key: `userId` (String)
- GSI: `phoneNumber-index` on `phoneNumber`
- Attributes: `name`, `email`, `dateOfBirth`, `gender`, `location`, etc.

### Rate Limit Table
- Primary Key: `identifier` (String)
- Attributes: `requestCount`, `windowStart`, `windowEnd`, `blocked`
- TTL: `ttl`

## License

MIT
