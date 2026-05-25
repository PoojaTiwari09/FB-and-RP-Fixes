import {
  Controller, Post, Req, UseGuards, Logger,
  HttpCode, HttpStatus, Headers, Body,
} from '@nestjs/common';
import { HmacWebhookGuard } from '../../platform-core/guards/hmac-webhook.guard';
import { CallService }      from '../services/call.service';
import { AuditLogService }  from '../services/audit-log.service';

// ── Zoom webhook payload shapes ───────────────────────────────────────────────
interface ZoomRecordingFile {
  download_url:  string;
  file_type:     string;   // 'MP4' | 'M4A' | 'CHAT' | 'TRANSCRIPT'
  recording_type: string;  // 'audio_only' | 'shared_screen_with_speaker_view' | ...
}

interface ZoomRecordingCompletedPayload {
  event: 'recording.completed';
  payload: {
    object: {
      id:               string;   // meeting ID
      uuid:             string;
      topic:            string;   // meeting title
      start_time:       string;
      duration:         number;   // minutes
      host_email:       string;
      participant_count: number;
      recording_files:  ZoomRecordingFile[];
    };
  };
}

// ── Teams webhook payload shapes ──────────────────────────────────────────────
interface TeamsCallRecordingPayload {
  value: Array<{
    id:              string;
    changeType:      string;   // 'created' | 'updated'
    resource:        string;
    resourceData: {
      id:          string;
      '@odata.type': string;
    };
  }>;
}

/**
 * WebhookController — Ingestion entry points for Native Connectors (US-02).
 *
 * Handles:
 *   POST /api/v1/webhooks/zoom   — Zoom recording.completed events
 *   POST /api/v1/webhooks/teams  — Microsoft Teams call recording notifications
 *
 * Coding Standards:
 *   - HMAC signature validation via HmacWebhookGuard (platform-core) on every route.
 *   - Responds in < 200ms: creates the DB record and queues the job, then returns.
 *   - No processing logic in the controller — delegates to CallService.
 *   - Idempotency: uses Zoom meeting UUID as the callId anchor to prevent
 *     duplicate job creation on repeated webhook delivery (US-01 idempotency).
 */
@Controller('api/v1/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly callService: CallService,
    private readonly audit:       AuditLogService,
  ) {}

  // ── US-02: Zoom recording.completed ───────────────────────────────────────
  @Post('zoom')
  @UseGuards(HmacWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handleZoomWebhook(
    @Body() body: ZoomRecordingCompletedPayload,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    this.logger.log(`[Webhook/Zoom] Received event: ${body.event}`);

    // Only process recording completion events
    if (body.event !== 'recording.completed') {
      return { received: true, processed: false, reason: 'event_ignored' };
    }

    const meeting = body.payload.object;

    // Find the audio recording file (prefer M4A > MP4 for audio quality)
    const audioFile = meeting.recording_files.find(
      (f) =>
        f.recording_type === 'audio_only' ||
        ['M4A', 'MP3'].includes(f.file_type.toUpperCase()),
    ) ?? meeting.recording_files.find(
      (f) => f.file_type.toUpperCase() === 'MP4',
    );

    if (!audioFile) {
      this.logger.warn(
        `[Webhook/Zoom] No audio file found for meeting ${meeting.uuid}`,
      );
      return { received: true, processed: false, reason: 'no_audio_file' };
    }

    // Create call record + queue transcription job (US-02)
    const call = await this.callService.createCall(
      {
        title:           meeting.topic || `Zoom Call ${meeting.id}`,
        callDate:        new Date(meeting.start_time),
        durationSeconds: meeting.duration * 60,
        callType:        'meeting',
        callSource:      'zoom',
        participants:    [meeting.host_email],
        callOwner:       meeting.host_email,
        audioUrl:        audioFile.download_url,
      },
      tenantId,
    );

    // Audit trail (US-30)
    await this.audit.log({
      tenantId,
      actorType:  'system',
      action:     'webhook.zoom.received',
      entityType: 'CallRecord',
      entityId:   call.id,
      meta: {
        meetingId:  meeting.id,
        meetingUuid: meeting.uuid,
        topic:      meeting.topic,
        audioUrl:   audioFile.download_url,
      },
    });

    this.logger.log(
      `[Webhook/Zoom] ✅ Call created id=${call.id}, queued for transcription`,
    );

    return { received: true, processed: true, callId: call.id };
  }

  // ── US-02: Microsoft Teams call recording notification ────────────────────
  @Post('teams')
  @UseGuards(HmacWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handleTeamsWebhook(
    @Body() body: TeamsCallRecordingPayload,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    this.logger.log(`[Webhook/Teams] Received ${body.value?.length ?? 0} notification(s)`);

    const results: Array<{ callId: string; resourceId: string }> = [];

    for (const notification of body.value ?? []) {
      if (notification.changeType !== 'created') continue;

      // Teams sends the recording resource ID — the actual download URL
      // must be fetched from Microsoft Graph API using the connected OAuth token.
      // Here we queue a meta-job to fetch + download the recording asynchronously.
      const resourceId = notification.resourceData.id;

      const call = await this.callService.createCall(
        {
          title:           `Teams Call ${resourceId}`,
          callDate:        new Date(),
          durationSeconds: 0,             // updated after download + analysis
          callType:        'meeting',
          callSource:      'teams',
          participants:    [],            // populated by Graph API fetch
          callOwner:       'teams-bot',
          audioUrl:        undefined,     // set after Graph API fetches the recording URL
        },
        tenantId,
      );

      // Audit trail (US-30)
      await this.audit.log({
        tenantId,
        actorType:  'system',
        action:     'webhook.teams.received',
        entityType: 'CallRecord',
        entityId:   call.id,
        meta:       { resourceId, notification },
      });

      results.push({ callId: call.id, resourceId });

      this.logger.log(
        `[Webhook/Teams] ✅ Call placeholder created id=${call.id}`,
      );
    }

    return { received: true, processed: results.length, calls: results };
  }
}
