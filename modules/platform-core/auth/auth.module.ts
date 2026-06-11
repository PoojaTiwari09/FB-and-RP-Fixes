import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlatformPrismaModule } from '../database/prisma.module';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PlatformPrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET', 'local-dev-secret'),
        signOptions: {
          expiresIn:
            cfg.get<string>('JWT_EXPIRES_IN') ??
            cfg.get<string>('JWT_ACCESS_TTL_SECONDS', '600'),
          issuer: cfg.get<string>('JWT_ISSUER', 'r-revenue-api'),
          audience: cfg.get<string>('API_AUDIENCE', 'r-revenue-api'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class PlatformAuthModule {}
