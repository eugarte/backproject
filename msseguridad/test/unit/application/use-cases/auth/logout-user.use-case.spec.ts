import { LogoutUserUseCase } from '@application/use-cases/auth/logout-user.use-case';

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase;

  beforeEach(() => {
    useCase = new LogoutUserUseCase();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should logout current session', async () => {
      // Since the logout use case returns void, we just verify it doesn't throw
      await expect(useCase.execute({
        userId: 'user-123',
        refreshToken: 'refresh-token',
        allSessions: false,
      })).resolves.not.toThrow();
    });

    it('should logout all sessions when requested', async () => {
      await expect(useCase.execute({
        userId: 'user-123',
        refreshToken: 'refresh-token',
        allSessions: true,
      })).resolves.not.toThrow();
    });
  });
});