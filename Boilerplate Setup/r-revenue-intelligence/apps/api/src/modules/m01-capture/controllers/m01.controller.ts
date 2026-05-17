import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../../platform-core/guards/tenant.guard';
import { M01CaptureService } from '../services/m01.service';

@Controller('api/v1/ingestion')
@UseGuards(TenantGuard)
export class M01CaptureController {
  constructor(private readonly service: M01CaptureService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
