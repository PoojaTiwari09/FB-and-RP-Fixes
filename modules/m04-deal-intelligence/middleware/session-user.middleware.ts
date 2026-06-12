import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@m04/services/auth.service';

@Injectable()
export class SessionUserMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Check if session exists and has userId
    if (req.session && req.session.id) {
      try {
        const user = await this.authService.getUserBySession(req.session.id);

        if (user) {
          let roleVal = String(user.role).toUpperCase();
          if (roleVal === 'SALES_REP') {
            roleVal = 'USER';
          }
          // Attach user to request
          (req as any).user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: roleVal,
            isActive: user.isActive,
          };
        }
      } catch (error) {
        // Session validation failed, continue without user
        console.error('Session validation error:', error);
      }
    }

    // Dev/API smoke: allow demo headers when no session (aligns with M01/M03 patterns)
    if (!(req as any).user && req.headers['x-user-id']) {
      let roleVal = String(req.headers['x-user-role'] || req.headers['x-role'] || 'MANAGER').toUpperCase();
      if (roleVal === 'SALES_REP') {
        roleVal = 'USER';
      }
      (req as any).user = {
        id: String(req.headers['x-user-id']),
        email: String(req.headers['x-email'] || 'dev@m04.local'),
        firstName: 'Dev',
        lastName: 'User',
        role: roleVal,
        isActive: true,
      };
    }

    next();
  }
}
