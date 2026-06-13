import {
  Controller,
  Post,
  Get,
  Body,
  Session,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from '@m04/services/auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, UserResponseDto } from '@m04/schemas';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { AuthenticatedRequest } from '@m04/interfaces/authenticated-request.interface';
import { Public } from '../interfaces/jwt.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user with email and password, creates a session',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Session() session?: Record<string, any>,
  ): Promise<AuthResponseDto> {
    const sessionObj = session || { id: 'mock-session-id' };
    const user = await this.authService.login(loginDto, sessionObj.id);

    // Store user ID in session
    sessionObj.userId = user.id;

    return {
      message: 'Login successful',
      user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Destroy the current session and logout the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@Session() session?: Record<string, any>): Promise<{ message: string }> {
    const sessionObj = session || { id: 'mock-session-id', destroy: () => {} };
    await this.authService.logout(sessionObj.id);
    if (typeof sessionObj.destroy === 'function') {
      sessionObj.destroy();
    }

    return {
      message: 'Logout successful',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get the currently authenticated user details',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user details',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async getCurrentUser(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    const user = await this.authService.getUserById(req.user.id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
