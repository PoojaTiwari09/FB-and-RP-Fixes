import { UserRole } from '@/interfaces/user-role.enum';
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt: Date | null;
}
export declare class AuthResponseDto {
    message: string;
    user: UserResponseDto;
}
