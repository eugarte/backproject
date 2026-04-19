export interface IEncryptionService {
  encrypt(value: string): string;
  decrypt(encryptedValue: string): string;
}
