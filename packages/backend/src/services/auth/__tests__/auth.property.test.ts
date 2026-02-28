import * as fc from 'fast-check';
import { OTPService } from '../otp-service';
import { JWTService } from '../jwt-service';
import { TokenRefreshService } from '../token-refresh';
import { EncryptionService } from '../encryption';

describe('Authentication Property Tests', () => {
  describe('Property 1: Authentication Round Trip', () => {
    it('should successfully complete authentication flow for any valid phone number', () => {
      fc.assert(
        fc.property(
          // Generate valid Indian phone numbers
          fc.integer({ min: 6000000000, max: 9999999999 }).map(num => `+91${num}`),
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          async (phoneNumber, userId) => {
            const jwtService = new JWTService();

            // Step 1: Generate tokens for authenticated user
            const tokens = jwtService.generateTokens({
              userId,
              phoneNumber,
              role: 'user',
            });

            // Step 2: Verify access token
            const verifiedPayload = jwtService.verifyAccessToken(tokens.accessToken);

            // Property: Verified payload should match original data
            expect(verifiedPayload).not.toBeNull();
            expect(verifiedPayload?.userId).toBe(userId);
            expect(verifiedPayload?.phoneNumber).toBe(phoneNumber);

            // Step 3: Verify refresh token
            const refreshPayload = await jwtService.verifyRefreshToken(tokens.refreshToken);

            // Property: Refresh token should be valid and match user
            expect(refreshPayload).not.toBeNull();
            expect(refreshPayload?.userId).toBe(userId);
            expect(refreshPayload?.phoneNumber).toBe(phoneNumber);

            // Property: Round trip preserves user identity
            return (
              verifiedPayload?.userId === userId &&
              verifiedPayload?.phoneNumber === phoneNumber &&
              refreshPayload?.userId === userId &&
              refreshPayload?.phoneNumber === phoneNumber
            );
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should maintain authentication state through token refresh', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 15 }),
          async (userId, phoneNumber) => {
            const jwtService = new JWTService();
            const tokenRefreshService = new TokenRefreshService();

            // Generate initial tokens
            const initialTokens = jwtService.generateTokens({
              userId,
              phoneNumber: `+91${phoneNumber}`,
            });

            // Refresh tokens
            const refreshResult = await tokenRefreshService.refreshTokens(
              initialTokens.refreshToken
            );

            // Property: Refresh should succeed
            expect(refreshResult.success).toBe(true);

            if (refreshResult.success && refreshResult.accessToken) {
              // Verify new access token
              const newPayload = jwtService.verifyAccessToken(refreshResult.accessToken);

              // Property: User identity preserved after refresh
              expect(newPayload?.userId).toBe(userId);
              expect(newPayload?.phoneNumber).toBe(`+91${phoneNumber}`);

              return newPayload?.userId === userId;
            }

            return false;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });
  });

  describe('Property 2: Encryption Round Trip', () => {
    it('should decrypt to original plaintext for any input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (plaintext) => {
            const encryptionService = new EncryptionService();

            // Encrypt
            const encrypted = encryptionService.encrypt(plaintext);

            // Decrypt
            const decrypted = encryptionService.decrypt(encrypted);

            // Property: Decryption should return original plaintext
            return decrypted === plaintext;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should handle Aadhaar encryption/decryption correctly', () => {
      fc.assert(
        fc.property(
          // Generate valid 12-digit Aadhaar numbers
          fc.integer({ min: 100000000000, max: 999999999999 }).map(num => num.toString()),
          (aadhaarNumber) => {
            const encryptionService = new EncryptionService();

            // Encrypt Aadhaar
            const encrypted = encryptionService.encryptAadhaar(aadhaarNumber);

            // Decrypt Aadhaar
            const decrypted = encryptionService.decryptAadhaar(encrypted);

            // Property: Decrypted Aadhaar matches original
            return decrypted === aadhaarNumber;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should handle health record encryption/decryption correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            patientId: fc.string(),
            diagnosis: fc.string(),
            medications: fc.array(fc.string()),
            timestamp: fc.date().map(d => d.toISOString()),
          }),
          (healthRecord) => {
            const encryptionService = new EncryptionService();

            // Encrypt health record
            const encrypted = encryptionService.encryptHealthRecord(healthRecord);

            // Decrypt health record
            const decrypted = encryptionService.decryptHealthRecord(encrypted);

            // Property: Decrypted record matches original
            return JSON.stringify(decrypted) === JSON.stringify(healthRecord);
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should produce different ciphertexts for same plaintext (due to random IV)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            const encryptionService = new EncryptionService();

            // Encrypt same plaintext twice
            const encrypted1 = encryptionService.encrypt(plaintext);
            const encrypted2 = encryptionService.encrypt(plaintext);

            // Property: Different IVs should produce different ciphertexts
            const differentCiphertexts = encrypted1.encrypted !== encrypted2.encrypted;
            const differentIVs = encrypted1.iv !== encrypted2.iv;

            // But both should decrypt to same plaintext
            const decrypted1 = encryptionService.decrypt(encrypted1);
            const decrypted2 = encryptionService.decrypt(encrypted2);
            const samePlaintext = decrypted1 === plaintext && decrypted2 === plaintext;

            return differentCiphertexts && differentIVs && samePlaintext;
          }
        ),
        { numRuns: 50, seed: 42 }
      );
    });
  });

  describe('Property 3: Token Refresh Mechanism', () => {
    it('should always provide valid tokens after refresh', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 15 }),
          async (userId, phoneNumber) => {
            const jwtService = new JWTService();
            const tokenRefreshService = new TokenRefreshService();

            // Generate initial tokens
            const initialTokens = jwtService.generateTokens({
              userId,
              phoneNumber: `+91${phoneNumber}`,
            });

            // Refresh tokens
            const refreshResult = await tokenRefreshService.refreshTokens(
              initialTokens.refreshToken
            );

            if (!refreshResult.success) {
              return false;
            }

            // Property: New access token should be valid
            const newAccessPayload = jwtService.verifyAccessToken(refreshResult.accessToken!);
            const accessTokenValid = newAccessPayload !== null;

            // Property: New refresh token should be valid
            const newRefreshPayload = await jwtService.verifyRefreshToken(
              refreshResult.refreshToken!
            );
            const refreshTokenValid = newRefreshPayload !== null;

            // Property: User identity preserved
            const identityPreserved =
              newAccessPayload?.userId === userId &&
              newRefreshPayload?.userId === userId;

            return accessTokenValid && refreshTokenValid && identityPreserved;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should invalidate old refresh token after use', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 15 }),
          async (userId, phoneNumber) => {
            const jwtService = new JWTService();
            const tokenRefreshService = new TokenRefreshService();

            // Generate initial tokens
            const initialTokens = jwtService.generateTokens({
              userId,
              phoneNumber: `+91${phoneNumber}`,
            });

            // Refresh tokens (this should revoke old refresh token)
            const refreshResult = await tokenRefreshService.refreshTokens(
              initialTokens.refreshToken
            );

            if (!refreshResult.success) {
              return false;
            }

            // Try to use old refresh token again
            const secondRefreshResult = await tokenRefreshService.refreshTokens(
              initialTokens.refreshToken
            );

            // Property: Old refresh token should be invalid
            return secondRefreshResult.success === false;
          }
        ),
        { numRuns: 50, seed: 42 }
      );
    });
  });

  describe('Property 4: JWT Token Expiry', () => {
    it('should correctly identify expired tokens', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 15 }),
          (userId, phoneNumber) => {
            const jwtService = new JWTService();

            // Generate tokens
            const tokens = jwtService.generateTokens({
              userId,
              phoneNumber: `+91${phoneNumber}`,
            });

            // Property: Newly generated token should not be expired
            const isExpired = jwtService.isTokenExpired(tokens.accessToken);

            return isExpired === false;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should decode token and extract expiry time', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 15 }),
          (userId, phoneNumber) => {
            const jwtService = new JWTService();
            const tokenRefreshService = new TokenRefreshService();

            // Generate tokens
            const tokens = jwtService.generateTokens({
              userId,
              phoneNumber: `+91${phoneNumber}`,
            });

            // Get expiry time
            const expiryTime = tokenRefreshService.getTokenExpiryTime(tokens.accessToken);

            // Property: Expiry time should be in the future
            const now = new Date();
            const expiryInFuture = expiryTime && expiryTime > now;

            // Property: Expiry should be approximately 15 minutes from now
            const fifteenMinutes = 15 * 60 * 1000;
            const timeDiff = expiryTime ? expiryTime.getTime() - now.getTime() : 0;
            const approximatelyFifteenMinutes = Math.abs(timeDiff - fifteenMinutes) < 5000; // 5 second tolerance

            return expiryInFuture && approximatelyFifteenMinutes;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should correctly calculate time until expiry', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 15 }),
          (userId, phoneNumber) => {
            const jwtService = new JWTService();
            const tokenRefreshService = new TokenRefreshService();

            // Generate tokens
            const tokens = jwtService.generateTokens({
              userId,
              phoneNumber: `+91${phoneNumber}`,
            });

            // Get time until expiry
            const timeUntilExpiry = tokenRefreshService.getTimeUntilExpiry(tokens.accessToken);

            // Property: Time until expiry should be positive
            const isPositive = timeUntilExpiry !== null && timeUntilExpiry > 0;

            // Property: Should be approximately 15 minutes (900000 ms)
            const fifteenMinutes = 15 * 60 * 1000;
            const approximatelyCorrect =
              timeUntilExpiry !== null && Math.abs(timeUntilExpiry - fifteenMinutes) < 5000;

            return isPositive && approximatelyCorrect;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });
  });
});
