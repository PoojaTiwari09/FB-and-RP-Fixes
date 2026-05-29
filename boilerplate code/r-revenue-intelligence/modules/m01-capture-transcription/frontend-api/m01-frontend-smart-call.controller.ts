import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M01FrontendSmartCallService } from './m01-frontend-smart-call.service';

@Controller('api/smart-call')
@UseGuards(TenantGuard)
export class M01FrontendSmartCallController {
  constructor(private readonly svc: M01FrontendSmartCallService) {}

  @Get('contacts')
  listContacts(@Query() query: Record<string, string>) {
    return this.svc.listContacts(query);
  }

  @Get('contacts/:contactId/pre-call-brief')
  preCallBrief(@Param('contactId') contactId: string) {
    return this.svc.getPreCallBrief(contactId);
  }

  @Post('sessions/start')
  start(@Body() body: { contactId: string; taskId?: string }) {
    return this.svc.startSession(body);
  }

  @Post('sessions/:sessionId/end')
  end(@Param('sessionId') sessionId: string) {
    return this.svc.endSession(sessionId);
  }

  @Get('sessions/:sessionId/summary')
  summary(@Param('sessionId') sessionId: string) {
    return this.svc.getSummary(sessionId);
  }

  @Get('sessions/:sessionId/transcript')
  transcript(@Param('sessionId') sessionId: string) {
    return this.svc.getTranscript(sessionId);
  }
}
