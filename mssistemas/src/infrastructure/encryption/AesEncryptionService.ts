import crypto from 'crypto';

export class AesEncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY || 'your-32-character-key-here!!';
    const ivString = process.env.ENCRYPTION_IV || 'your-16-char-iv';
    
    this.key = Buffer.from(keyString.padEnd(32, '!').slice(0, 32));
    this.iv = Buffer.from(ivString.padEnd(16, '!').slice(0, 16));
  }

  encrypt(text: string): string {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateSecureIV(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}