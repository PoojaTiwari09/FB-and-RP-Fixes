import { M01CaptureTranscriptionService } from '../services/m01.service';
export declare class M01CaptureTranscriptionController {
    private readonly service;
    constructor(service: M01CaptureTranscriptionService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}
