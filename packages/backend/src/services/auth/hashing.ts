import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class HashingService {
  private saltRounds: number = 12; // bcrypt cost factor

  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  hashAadhaar(aadhaarNumber: string): string {
    // Validate Aadhaar format
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new Error('Invalid Aadhaar number format');
    }

    // Use SHA-256 for one-way hashing (cannot be reversed)
    return crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
  }

  hashPhoneNumber(phoneNumber: string): string {
    // Validate phone number format
    if (!/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    return crypto.createHash('sha256').update(phoneNumber).digest('hex');
  }

  hashEmail(email: string): string {
    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();
    return crypto.createHash('sha256').update(normalizedEmail).digest('hex');
  }

  // HMAC-based hashing for additional security
  hmacHash(data: string, secret?: string): string {
    const secretKey = secret || process.env.HMAC_SECRET || 'default-secret-key';
    return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
  }

  // Verify HMAC hash
  verifyHmacHash(data: string, hash: string, secret?: string): boolean {
    const computedHash = this.hmacHash(data, secret);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }

  // Hash PII data with salt for storage
  async hashPII(piiData: string): Promise<string> {
    try {
      // Use bcrypt for PII that might need verification later
      return await bcrypt.hash(piiData, this.saltRounds);
    } catch (error) {
      console.error('Error hashing PII:', error);
      throw new Error('Failed to hash PII data');
    }
  }

  // Verify hashed PII
  async verifyPII(piiData: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(piiData, hash);
    } catch (error) {
      console.error('Error verifying PII:', error);
      return false;
    }
  }

  // One-way hash for anonymization (cannot be reversed)
  anonymizeData(data: string): string {
    // Use SHA-256 for irreversible anonymization
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate a secure random token
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash with pepper (application-level secret)
  hashWithPepper(data: string): string {
    const pepper = process.env.HASH_PEPPER || 'default-pepper';
    const dataWithPepper = data + pepper;
    return crypto.createHash('sha256').update(dataWithPepper).digest('hex');
  }

  // Verify hash with pepper
  verifyHashWithPepper(data: string, hash: string): boolean {
    const computedHash = this.hashWithPepper(data);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }

  // Hash for deduplication (consistent hashing)
  deduplicationHash(data: string): string {
    // Use SHA-256 for consistent hashing across instances
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Mask sensitive data for logging
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + data.slice(-visibleChars);
  }
}

// Singleton instance
let hashingServiceInstance: HashingService | null = null;

export function getHashingService(): HashingService {
  if (!hashingServiceInstance) {
    hashingServiceInstance = new HashingService();
  }
  return hashingServiceInstance;
}
