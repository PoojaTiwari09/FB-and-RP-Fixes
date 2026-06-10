import { CallService } from '../services/call.service';
export declare class UploadController {
    private readonly svc;
    constructor(svc: CallService);
    uploadAudio(file: any, req: any): Promise<{
        id: string;
        tenantId: string;
        title: string;
        callDate: Date;
        durationSeconds: number;
        callType: string;
        callSource: string;
        participants: string[];
        callOwner: string;
        accountId: string | null;
        opportunityId: string | null;
        audioUrl: string | null;
        transcriptStatus: string;
        failureReason: string | null;
        skipReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
