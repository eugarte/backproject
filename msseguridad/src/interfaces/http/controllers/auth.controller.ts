import { Request, Response } from 'express';
import {
  RefreshTokenUseCase,
  LogoutUserUseCase,
} from '@application/use-cases/auth';

export class AuthController {
  private refreshUseCase: RefreshTokenUseCase;
  private logoutUseCase: LogoutUserUseCase;

  constructor() {
    this.refreshUseCase = new RefreshTokenUseCase();
    this.logoutUseCase = new LogoutUserUseCase();
  }

  async register(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  async login(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.refreshUseCase.execute(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      await this.logoutUseCase.execute({
        userId: (req as any).user?.id,
        refreshToken: req.body.refreshToken,
        allSessions: req.body.allSessions,
      });
      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProfile(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }
}
