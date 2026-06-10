import { CallService } from '../services/call.service';
export declare class M01FrontendUploadController {
    private readonly svc;
    constructor(svc: CallService);
    upload(file: any, req: Record<string, string>): Promise<{
        callId: string;
        status: string;
        message: string;
    }>;
}
