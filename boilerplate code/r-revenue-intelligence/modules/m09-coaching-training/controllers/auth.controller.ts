import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { M09Repository } from '../repositories/m09.repository';
import { RegisterDto, LoginDto } from '../schemas/m09.schema';
import * as bcrypt from 'bcrypt';
import { Public } from './m09.controller';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly repository: M09Repository,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const existing = await this.repository.findUserByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.repository.createUser({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role,
      org_id: dto.org_id,
      manager_id: dto.manager_id,
      status: 'active',
    });

    const payload = { sub: user.id, email: user.email, role: user.role, org_id: user.org_id };
    return {
      success: true,
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        org_id: user.org_id,
      },
    };
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.repository.findUserByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, org_id: user.org_id };
    return {
      success: true,
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        org_id: user.org_id,
      },
    };
  }
}
