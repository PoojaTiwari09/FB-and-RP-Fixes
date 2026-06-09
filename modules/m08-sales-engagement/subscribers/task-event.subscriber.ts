import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { M08TaskService } from '../services/task.service';

@Injectable()
export class M08TaskEventSubscriber {
  constructor(@Inject(M08TaskService) private readonly taskService: M08TaskService) {}

  @OnEvent('call.transcription.completed')
  async onCallTranscriptionCompleted(payload: Record<string, unknown>) {
    await this.taskService.handleCallTranscriptionCompleted(payload as {
      tenantId: string;
      eventId: string;
      callId: string;
      summary: string;
      userId: string;
    });
  }
}
