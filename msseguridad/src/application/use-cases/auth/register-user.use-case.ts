import { User, UserStatus } from '../../../domain/entities/user';
import { UserRepository } from '../../../domain/repositories/user-repository.interface';
import { Email } from '../../../domain/value-objects/email';
import { Password } from '../../../domain/value-objects/password';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

interface Result<T> {
  isSuccess(): boolean;
  isFailure(): boolean;
  getValue(): T | null;
  getError(): Error | null;
}

class SuccessResult<T> implements Result<T> {
  constructor(private value: T) {}
  isSuccess(): boolean { return true; }
  isFailure(): boolean { return false; }
  getValue(): T { return this.value; }
  getError(): null { return null; }
}

class FailureResult<T> implements Result<T> {
  constructor(private error: Error) {}
  isSuccess(): boolean { return false; }
  isFailure(): boolean { return true; }
  getValue(): null { return null; }
  getError(): Error { return this.error; }
}

interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

interface RegisterOutput {
  id: string;
  email: string;
  status: string;
}

export class RegisterUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: RegisterInput): Promise<Result<RegisterOutput>> {
    try {
      // Validate passwords match
      if (input.password !== input.confirmPassword) {
        return new FailureResult(new Error('Passwords do not match'));
      }

      // Validate email
      let email: Email;
      try {
        email = Email.create(input.email.trim());
      } catch (error: any) {
        return new FailureResult(new Error(error.message || 'Invalid email format'));
      }

      // Validate password
      try {
        Password.create(input.password);
      } catch (error: any) {
        return new FailureResult(new Error(error.message || 'Password is too weak'));
      }

      // Check if user exists
      const existingUser = await this.userRepository.findByEmail(email.getValue());
      if (existingUser) {
        return new FailureResult(new Error('Email already registered'));
      }

      // Hash password using bcrypt
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Create user
      const user = new User();
      user.id = uuidv4();
      user.email = email.getValue().toLowerCase();
      user.passwordHash = passwordHash;
      user.status = UserStatus.PENDING;
      user.failedAttempts = 0;
      user.failedMfaAttempts = 0;
      user.mfaEnabled = false;
      user.emailVerificationToken = uuidv4().replace(/-/g, '');
      user.roles = [];

      const savedUser = await this.userRepository.save(user);

      return new SuccessResult({
        id: savedUser.id,
        email: savedUser.email,
        status: savedUser.status,
      });
    } catch (error: any) {
      return new FailureResult(new Error(error.message || 'Registration failed'));
    }
  }
}