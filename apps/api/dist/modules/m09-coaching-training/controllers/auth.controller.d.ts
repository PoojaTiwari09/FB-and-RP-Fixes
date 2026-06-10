import { JwtService } from '@nestjs/jwt';
import { M09Repository } from '../repositories/m09.repository';
import { RegisterDto, LoginDto } from '../schemas/m09.schema';
export declare class AuthController {
    private readonly repository;
    private readonly jwtService;
    constructor(repository: M09Repository, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            org_id: any;
        };
    }>;
    login(dto: LoginDto): Promise<{
        success: boolean;
        token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            org_id: any;
        };
    }>;
}
