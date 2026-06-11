import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  loginDtoSchema,
  logoutDtoSchema,
  refreshDtoSchema,
  registerDtoSchema,
} from '@rri/shared-types';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async register(@Body() body: unknown) {
    const dto = registerDtoSchema.parse(body);
    const data = await this.authService.register({
      tenantName: dto.tenantName,
      tenantSlug: dto.tenantSlug,
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
    return { success: true, data };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() body: unknown) {
    const dto = loginDtoSchema.parse(body);
    const data = await this.authService.login({
      email: dto.email,
      password: dto.password,
      tenantSlug: dto.tenantSlug,
    });
    return { success: true, data };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async refresh(@Body() body: unknown) {
    const dto = refreshDtoSchema.parse(body);
    const data = await this.authService.refresh(dto.refreshToken);
    return { success: true, data };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Body() body: unknown) {
    const dto = logoutDtoSchema.parse(body ?? {});
    if (dto.refreshToken) {
      await this.authService.logout(dto.refreshToken, req.user.sub);
    } else {
      await this.authService.logoutAll(req.user.sub);
    }
    return { success: true, data: { message: 'Logged out successfully' } };
  }

  @Get('me')
  async me(@Req() req: any) {
    const data = await this.authService.getProfile(req.user.sub);
    return { success: true, data };
  }
}
