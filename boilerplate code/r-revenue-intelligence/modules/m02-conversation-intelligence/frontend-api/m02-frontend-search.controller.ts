import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M02FrontendSearchService } from './m02-frontend-search.service';
import {
  M02AiAskBodySchema,
  M02CreateStreamBodySchema,
  M02ExportBodySchema,
} from './m02-frontend-search.schema';

/** M02 Call Search — locked path: GET /api/search/calls */
@Controller('api/search')
@UseGuards(TenantGuard)
export class M02FrontendSearchController {
  constructor(private readonly svc: M02FrontendSearchService) {}

  @Get('calls')
  searchCalls(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    return this.svc.searchCalls(req.tenantId, query);
  }

  @Get('calls/:callId')
  getCallDrawer(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.getCallDrawer(req.tenantId, callId);
  }
}

@Controller('api/filters')
@UseGuards(TenantGuard)
export class M02FrontendFiltersController {
  constructor(private readonly svc: M02FrontendSearchService) {}

  @Get('options')
  getFilterOptions() {
    return this.svc.getFilterOptions();
  }
}

@Controller('api/calls')
@UseGuards(TenantGuard)
export class M02FrontendCallsActionsController {
  constructor(private readonly svc: M02FrontendSearchService) {}

  @Post('ai-ask')
  aiAsk(@Body() body: unknown, @Req() req: Record<string, string>) {
    const dto = M02AiAskBodySchema.parse(body);
    return this.svc.aiAsk(req.tenantId, dto);
  }

  @Post('export')
  startExport(@Body() body: unknown, @Req() req: Record<string, string>) {
    M02ExportBodySchema.parse(body);
    return this.svc.startExport(req.tenantId, body);
  }
}

@Controller('api/streams')
@UseGuards(TenantGuard)
export class M02FrontendStreamsController {
  constructor(private readonly svc: M02FrontendSearchService) {}

  @Post()
  createStream(@Body() body: unknown, @Req() req: Record<string, string>) {
    const dto = M02CreateStreamBodySchema.parse(body);
    return this.svc.createStream(req.tenantId, dto);
  }
}
