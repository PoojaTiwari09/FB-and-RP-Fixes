import { Response } from 'express';
import { ExportService } from '@/services/export.service';
import { ExportRequestDto, ExportResponseDto } from '@/schemas/export.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    createExport(dto: ExportRequestDto, req: AuthenticatedRequest): Promise<ExportResponseDto>;
    downloadExport(exportId: string, res: Response): Promise<void>;
}
