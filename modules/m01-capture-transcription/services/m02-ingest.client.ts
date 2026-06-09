import { Injectable, Logger } from '@nestjs/common';

export interface M02IngestEnvelope {
  tenantId: string;
  callId: string;
  transcriptId?: string;
  sourcePlatform?: string;
  occurredAt?: string;
}

/**
 * HTTP bridge: M01 → M02 when APIs run as separate processes (decentralised modules).
 */
@Injectable()
export class M02IngestClient {
  private readonly logger = new Logger(M02IngestClient.name);

  private get baseUrl(): string {
    return (process.env.M02_API_URL || 'http://localhost:3002').replace(/\/$/, '');
  }

  async notifyTranscriptionCompleted(payload: M02IngestEnvelope): Promise<void> {
    const url = `${this.baseUrl}/api/v1/conversation-intelligence/ingest/from-transcription`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const key = process.env.INTERNAL_SERVICE_KEY;
    if (key) headers['x-service-key'] = key;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenantId: payload.tenantId,
          callId: payload.callId,
          transcriptId: payload.transcriptId,
          sourcePlatform: payload.sourcePlatform || 'm01-capture-transcription',
          occurredAt: payload.occurredAt || new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(
          `M02 ingest failed (${res.status}) for call ${payload.callId}: ${text}`,
        );
        return;
      }

      this.logger.log(`M02 ingest OK for call ${payload.callId}`);
    } catch (err: any) {
      this.logger.warn(
        `M02 ingest unreachable for call ${payload.callId}: ${err?.message || err}`,
      );
    }
  }
}
