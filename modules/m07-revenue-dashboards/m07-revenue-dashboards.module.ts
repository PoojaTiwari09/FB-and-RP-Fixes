import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { M07DealAccountController } from './controllers/m07.controller';
import { M07TestController } from './controllers/m07-test.controller';
import { M07DealAccountService } from './services/m07.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [M07DealAccountController, M07TestController],
  providers: [M07DealAccountService, JwtStrategy],
  exports: [M07DealAccountService],
})
export class M07RevenueDashboardsModule {}
