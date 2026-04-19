import { RegisterUserUseCase } from '../../../../src/application/use-cases/auth/register-user.use-case';
import { UserRepository } from '../../../../src/domain/repositories/user-repository.interface';
import { User } from '../../../../src/domain/entities/user';

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

    it('should successfully register new user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockImplementation((user: User) => Promise.resolve({ ...user, id: 'new-id' }));

      const result = await useCase.execute(validInput);

      expect(result.isSuccess()).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.email).toBe('newuser@example.com');
    });

    it('should fail when email already exists', async () => {
      const existingUser = new User();
      existingUser.id = 'existing-id';
      existingUser.email = 'newuser@example.com';

      userRepository.findByEmail.mockResolvedValue(existingUser);

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()?.message).toBe('Email already registered');
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when passwords do not match', async () => {
      const result = await useCase.execute({
        ...validInput,
        confirmPassword: 'DifferentP@ssw0rd123',
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()?.message).toContain('Passwords do not match');
    });

    it('should fail with invalid email format', async () => {
      const result = await useCase.execute({
        ...validInput,
        email: 'invalid-email',
      });

      expect(result.isFailure()).toBe(true);
    });

    it('should fail with weak password', async () => {
      const result = await useCase.execute({
        ...validInput,
        password: 'weak',
        confirmPassword: 'weak',
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()?.message).toContain('Password');
    });

    it('should trim and lowercase email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockImplementation((user: User) => Promise.resolve(user));

      await useCase.execute({
        ...validInput,
        email: '  NewUser@EXAMPLE.COM  ',
      });

      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.email).toBe('newuser@example.com');
    });

    it('should hash password before saving', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockImplementation((user: User) => Promise.resolve(user));

      await useCase.execute(validInput);

      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.passwordHash).toContain('argon2id');
      expect(savedUser.passwordHash).not.toBe(validInput.password);
    });

    it('should assign default role to new user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockImplementation((user: User) => Promise.resolve(user));

      await useCase.execute(validInput);

      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.roles).toBeDefined();
    });

    it('should generate email verification token', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockImplementation((user: User) => Promise.resolve(user));

      await useCase.execute(validInput);

      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.emailVerificationToken).toBeDefined();
      expect(savedUser.emailVerificationToken).toHaveLength(32);
    });

    it('should set user status to pending', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockImplementation((user: User) => Promise.resolve(user));

      await useCase.execute(validInput);

      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.status).toBe('pending');
    });
  });
});
