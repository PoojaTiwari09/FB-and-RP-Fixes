import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { AiExtractorService } from '../services/ai-extractor.service';

@Controller('api/v1/ai-extractor')
@UseGuards(TenantGuard)
export class AiExtractorController {
  constructor(private readonly svc: AiExtractorService) {}

  @Get('fields')
  listFields(@Req() req: Record<string, string>) {
    return this.svc.listFields(req.tenantId);
  }

  @Post('fields')
  createField(@Body() body: Record<string, unknown>, @Req() req: Record<string, string>) {
    return this.svc.createField(req.tenantId, body);
  }

  @Patch('fields/:id')
  updateField(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.updateField(req.tenantId, id, body);
  }

  @Delete('fields/:id')
  deleteField(@Param('id') id: string, @Req() req: Record<string, string>) {
    return this.svc.deleteField(req.tenantId, id);
  }

  @Post('fields/:id/toggle')
  toggleField(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean },
    @Req() req: Record<string, string>,
  ) {
    return this.svc.toggleField(req.tenantId, id, !!body.isActive);
  }

  @Post('fields/:id/test')
  testField(
    @Param('id') id: string,
    @Body() body: { callId: string },
    @Req() req: Record<string, string>,
  ) {
    return this.svc.testField(req.tenantId, id, body.callId);
  }

  @Get('calls/:callId/results')
  getResults(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.getCallResults(req.tenantId, callId);
  }

  @Post('calls/:callId/extract')
  runExtract(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.runExtraction(req.tenantId, callId);
  }
}
