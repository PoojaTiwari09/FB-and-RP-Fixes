import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../../platform-core/guards/tenant.guard';
import { M08ExecutionService } from '../services/m08.service';

@Controller('api/v1/execution')
@UseGuards(TenantGuard)
export class M08ExecutionController {
  constructor(private readonly service: M08ExecutionService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
