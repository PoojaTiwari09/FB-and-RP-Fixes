import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Public } from '../interfaces/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // refresh uses the global guard (requires valid JWT) — no @Public()
  @Post('refresh')
  refresh(@Req() req: any) {
    return this.authService.refreshToken(req.user.sub);
  }
}
