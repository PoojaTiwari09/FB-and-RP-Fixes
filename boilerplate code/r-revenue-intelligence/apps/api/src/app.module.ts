import { Module } from '@nestjs/common';
import { M05AccountIntelligenceModule } from '../../../modules/m05-account-intelligence/m05-account-intelligence.module';

@Module({
  imports: [
    M05AccountIntelligenceModule
  ],
})
export class AppModule {}
