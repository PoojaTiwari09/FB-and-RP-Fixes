import { Module } from '@nestjs/common';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';
import { M05AccountIntelligenceModule } from '../../../modules/m05-account-intelligence/m05-account-intelligence.module';

@Module({
  imports: [
    M02ConversationIntelligenceModule,
    M05AccountIntelligenceModule
  ],
})
export class AppModule {}
