import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.db.oneOrNone<{
      id: string; email: string; password_hash: string;
      full_name: string; role: string; is_active: boolean;
    }>(`SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1`, [email]);

    if (!user || !user.is_active) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, roles: [user.role], name: user.full_name };
    return { access_token: this.jwtService.sign(payload), user: { id: user.id, name: user.full_name, role: user.role } };
  }

  async refreshToken(userId: string) {
    const user = await this.db.one<{ id: string; email: string; role: string; full_name: string }>(
      `SELECT id, email, role, full_name FROM users WHERE id = $1`, [userId],
    );
    const payload = { sub: user.id, email: user.email, roles: [user.role], name: user.full_name };
    return { access_token: this.jwtService.sign(payload) };
  }
}
