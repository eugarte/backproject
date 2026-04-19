import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { UserRepository } from '@domain/repositories/user-repository.interface';
import { User } from '@domain/entities/user';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    useCase = new RegisterUserUseCase(userRepository);
  });

  describe('execute', () => {
    const validInput = {
      email: 'newuser@example.com',
      password: 'SecureP@ssw0rd123',
      confirmPassword: 'SecureP@ssw0rd123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    it('should have execute method', () => {
      expect(typeof useCase.execute).toBe('function');
    });
  });
});
