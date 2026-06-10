import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { User, Session } from '@/entities';
import { LoginDto, RegisterDto, UserResponseDto } from '@/schemas';
export declare class AuthService {
    private readonly userRepository;
    private readonly sessionRepository;
    constructor(userRepository: Repository<User>, sessionRepository: Repository<Session>);
    register(registerDto: RegisterDto): Promise<UserResponseDto>;
    validateUser(email: string, password: string): Promise<User | null>;
    login(loginDto: LoginDto, sessionId: string): Promise<UserResponseDto>;
    logout(sessionId: string): Promise<void>;
    getUserBySession(sessionId: string): Promise<User | null>;
    getUserById(userId: string): Promise<User>;
    private toUserResponse;
    cleanupExpiredSessions(): Promise<void>;
}
