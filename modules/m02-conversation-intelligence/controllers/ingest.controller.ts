import {
  Body,
  Controller,
  Headers,
  Post,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConversationIngestService,
  TranscriptionIngestPayload,
} from '../services/ingest.service';

/**
 * Service-to-service ingest from M01 after transcription completes.
 * Protected by optional x-service-key when INTERNAL_SERVICE_KEY is set.
 */
@Controller('api/v1/conversation-intelligence/ingest')
export class ConversationIngestController {
  constructor(private readonly ingest: ConversationIngestService) {}

  @Post('from-transcription')
  fromTranscription(
    @Body() body: TranscriptionIngestPayload,
    @Headers('x-service-key') serviceKey?: string,
  ) {
    const expected = process.env.INTERNAL_SERVICE_KEY;
    if (expected && serviceKey !== expected) {
      throw new UnauthorizedException('Invalid or missing x-service-key');
    }

    if (!body?.tenantId || !body?.callId) {
      throw new BadRequestException('tenantId and callId are required');
    }

    return this.ingest.ingestFromTranscription(body);
  }
}
