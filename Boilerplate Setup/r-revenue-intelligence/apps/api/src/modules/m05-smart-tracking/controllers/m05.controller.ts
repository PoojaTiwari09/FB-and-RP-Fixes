import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../../platform-core/guards/tenant.guard';
import { M05SmartTrackingService } from '../services/m05.service';

@Controller('api/v1/smart-tracking')
@UseGuards(TenantGuard)
export class M05SmartTrackingController {
  constructor(private readonly service: M05SmartTrackingService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
