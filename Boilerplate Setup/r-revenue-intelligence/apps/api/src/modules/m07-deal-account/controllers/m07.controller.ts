import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../../platform-core/guards/tenant.guard';
import { M07DealAccountService } from '../services/m07.service';

@Controller('api/v1/deal-management')
@UseGuards(TenantGuard)
export class M07DealAccountController {
  constructor(private readonly service: M07DealAccountService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
