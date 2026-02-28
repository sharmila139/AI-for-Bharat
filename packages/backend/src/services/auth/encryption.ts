import crypto from 'crypto';

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export class EncryptionService {
  private algorithm: string = 'aes-256-gcm';
  private keyLength: number = 32; // 256 bits
  private ivLength: number = 16; // 128 bits
  private encryptionKey: Buffer;

  constructor() {
    // In production, this key should be stored in AWS Secrets Manager or KMS
    const keyString = process.env.ENCRYPTION_KEY || this.generateKey();
    this.encryptionKey = Buffer.from(keyString, 'hex');

    if (this.encryptionKey.length !== this.keyLength) {
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }
  }

  encrypt(plaintext: string): EncryptedData {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get the authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData: EncryptedData): string {
    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  encryptAadhaar(aadhaarNumber: string): EncryptedData {
    // Validate Aadhaar format (12 digits)
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new Error('Invalid Aadhaar number format');
    }

    return this.encrypt(aadhaarNumber);
  }

  decryptAadhaar(encryptedData: EncryptedData): string {
    const decrypted = this.decrypt(encryptedData);

    // Validate decrypted Aadhaar
    if (!/^\d{12}$/.test(decrypted)) {
      throw new Error('Decrypted data is not a valid Aadhaar number');
    }

    return decrypted;
  }

  encryptHealthRecord(healthData: object): EncryptedData {
    const jsonString = JSON.stringify(healthData);
    return this.encrypt(jsonString);
  }

  decryptHealthRecord(encryptedData: EncryptedData): object {
    const decrypted = this.decrypt(encryptedData);
    try {
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Decrypted data is not valid JSON');
    }
  }

  maskAadhaar(aadhaarNumber: string): string {
    // Mask Aadhaar number (show only last 4 digits)
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new Error('Invalid Aadhaar number format');
    }
    return `XXXX-XXXX-${aadhaarNumber.slice(-4)}`;
  }

  private generateKey(): string {
    // Generate a random 256-bit key
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  rotateKey(newKey: string): void {
    const newKeyBuffer = Buffer.from(newKey, 'hex');
    if (newKeyBuffer.length !== this.keyLength) {
      throw new Error('New encryption key must be 32 bytes (256 bits)');
    }
    this.encryptionKey = newKeyBuffer;
  }

  // Helper method to encrypt and store in database-friendly format
  encryptForStorage(plaintext: string): string {
    const encrypted = this.encrypt(plaintext);
    return JSON.stringify(encrypted);
  }

  // Helper method to decrypt from database-stored format
  decryptFromStorage(encryptedString: string): string {
    try {
      const encryptedData = JSON.parse(encryptedString) as EncryptedData;
      return this.decrypt(encryptedData);
    } catch (error) {
      throw new Error('Invalid encrypted data format');
    }
  }

  // Verify data integrity
  verifyIntegrity(encryptedData: EncryptedData): boolean {
    try {
      this.decrypt(encryptedData);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let encryptionServiceInstance: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService();
  }
  return encryptionServiceInstance;
}
