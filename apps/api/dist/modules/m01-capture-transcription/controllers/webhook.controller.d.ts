import { CallService } from '../services/call.service';
import { AuditLogService } from '../services/audit-log.service';
interface ZoomRecordingFile {
    download_url: string;
    file_type: string;
    recording_type: string;
}
interface ZoomRecordingCompletedPayload {
    event: 'recording.completed';
    payload: {
        object: {
            id: string;
            uuid: string;
            topic: string;
            start_time: string;
            duration: number;
            host_email: string;
            participant_count: number;
            recording_files: ZoomRecordingFile[];
        };
    };
}
interface TeamsCallRecordingPayload {
    value: Array<{
        id: string;
        changeType: string;
        resource: string;
        resourceData: {
            id: string;
            '@odata.type': string;
        };
    }>;
}
export declare class WebhookController {
    private readonly callService;
    private readonly audit;
    private readonly logger;
    constructor(callService: CallService, audit: AuditLogService);
    handleZoomWebhook(body: ZoomRecordingCompletedPayload, tenantId: string): Promise<{
        received: boolean;
        processed: boolean;
        reason: string;
        callId?: undefined;
    } | {
        received: boolean;
        processed: boolean;
        callId: string;
        reason?: undefined;
    }>;
    handleTeamsWebhook(body: TeamsCallRecordingPayload, tenantId: string): Promise<{
        received: boolean;
        processed: number;
        calls: {
            callId: string;
            resourceId: string;
        }[];
    }>;
}
export {};
