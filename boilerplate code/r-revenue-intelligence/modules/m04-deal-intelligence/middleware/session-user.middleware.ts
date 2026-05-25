import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';

@Injectable()
export class SessionUserMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Check if session exists and has userId
    if (req.session && req.session.id) {
      try {
        const user = await this.authService.getUserBySession(req.session.id);

        if (user) {
          // Attach user to request
          (req as any).user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
          };
        }
      } catch (error) {
        // Session validation failed, continue without user
        console.error('Session validation error:', error);
      }
    }

    next();
  }
}
