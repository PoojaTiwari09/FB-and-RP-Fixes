import { Module } from '@nestjs/common';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';

@Module({
  imports: [
    M02ConversationIntelligenceModule
  ],
})
export class AppModule {}
