export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email.toLowerCase().trim();
  }

  /**
   * Create a new Email value object with validation
   */
  static create(email: string): Email {
    const trimmed = email.trim();
    
    if (!trimmed || trimmed.length === 0) {
      throw new Error('Email is required');
    }
    
    if (!Email.isValid(trimmed)) {
      throw new Error('Invalid email format');
    }
    return new Email(trimmed);
  }

  private static isValid(email: string): boolean {
    // More comprehensive email validation
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) return false;
    
    // Additional checks for edge cases
    if (email.startsWith('.')) return false; // starts with dot
    if (email.endsWith('.')) return false; // ends with dot
    if (email.includes('..')) return false; // consecutive dots
    
    return true;
  }

  getValue(): string {
    return this.value;
  }

  /**
   * Get the domain part of the email (e.g., "example.com" from "user@example.com")
   */
  getDomain(): string {
    const parts = this.value.split('@');
    return parts[1] || '';
  }

  /**
   * Get the local part of the email (e.g., "user" from "user@example.com")
   */
  getLocalPart(): string {
    const parts = this.value.split('@');
    return parts[0] || '';
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
