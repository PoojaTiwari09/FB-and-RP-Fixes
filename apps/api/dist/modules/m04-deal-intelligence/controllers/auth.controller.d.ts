import { AuthService } from '@/services/auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, UserResponseDto } from '@/schemas';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<UserResponseDto>;
    login(loginDto: LoginDto, session: Record<string, any>): Promise<AuthResponseDto>;
    logout(session: Record<string, any>): Promise<{
        message: string;
    }>;
    getCurrentUser(req: AuthenticatedRequest): Promise<UserResponseDto>;
}
