import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from '@m04/services/export.service';
import { ExportRequestDto, ExportResponseDto } from '@m04/schemas/export.dto';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { AuthenticatedRequest } from '@m04/interfaces/authenticated-request.interface';

@ApiTags('Exports')
@Controller('exports')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiCookieAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @ApiOperation({
    summary: 'Create export',
    description: 'Create a new export in CSV, Excel, or PDF format',
  })
  @ApiResponse({
    status: 201,
    description: 'Export created successfully',
    type: ExportResponseDto,
  })
  async createExport(
    @Body() dto: ExportRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ExportResponseDto> {
    return this.exportService.createExport(dto, req.user.id);
  }

  @Get('download/:exportId')
  @ApiOperation({
    summary: 'Download export',
    description: 'Download an export file',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Export file downloaded successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Export not found or expired',
  })
  async downloadExport(
    @Param('exportId') exportId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { filePath, mimeType } = await this.exportService.getExportFile(exportId);

    const ext = mimeType === 'text/csv' ? 'csv' : mimeType === 'application/pdf' ? 'pdf' : 'xlsx';
    const fileName = `export-${exportId}.${ext}`;
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.download(filePath, fileName);
  }
}
