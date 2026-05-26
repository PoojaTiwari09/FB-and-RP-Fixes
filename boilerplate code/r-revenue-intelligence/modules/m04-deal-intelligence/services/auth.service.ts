import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Session } from '@/entities';
import { LoginDto, RegisterDto, UserResponseDto } from '@/schemas';
import { UserRole } from '@/interfaces/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: registerDto.role || UserRole.USER,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    return this.toUserResponse(savedUser);
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Login user and create session
   */
  async login(loginDto: LoginDto, sessionId: string): Promise<UserResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Create or update session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const existingSession = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (existingSession) {
      existingSession.userId = user.id;
      existingSession.expiresAt = expiresAt;
      await this.sessionRepository.save(existingSession);
    } else {
      const session = this.sessionRepository.create({
        id: sessionId,
        userId: user.id,
        expiresAt,
        data: {},
      });
      await this.sessionRepository.save(session);
    }

    return this.toUserResponse(user);
  }

  /**
   * Logout user and destroy session
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionRepository.delete({ id: sessionId });
  }

  /**
   * Get user by session ID
   */
  async getUserBySession(sessionId: string): Promise<User | null> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.sessionRepository.delete({ id: sessionId });
      return null;
    }

    return session.user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Convert User entity to UserResponseDto
   */
  private toUserResponse(user: User): UserResponseDto {
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

  /**
   * Clean up expired sessions (can be called by a cron job)
   */
  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();
  }
}
