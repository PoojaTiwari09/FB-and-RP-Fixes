import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { M09FrontendAuthGuard } from './m09-frontend-auth.guard';
import { M09FrontendTrainingsService } from './m09-frontend-trainings.service';

@Controller('api/trainings')
@UseGuards(M09FrontendAuthGuard)
export class M09FrontendTrainingsController {
  constructor(private readonly svc: M09FrontendTrainingsService) {}

  @Get()
  list(@Query('status') status: string, @Req() req: any) {
    return this.svc.listTrainings(req.user.id, req.orgId, status);
  }

  @Get(':trainingId/setup')
  getSetup(@Param('trainingId') trainingId: string, @Req() req: any) {
    return this.svc.getTraining(trainingId, req.orgId);
  }

  @Get(':trainingId')
  getTraining(@Param('trainingId') trainingId: string, @Req() req: any) {
    return this.svc.getTraining(trainingId, req.orgId);
  }

  @Post(':trainingId/sessions')
  start(
    @Param('trainingId') trainingId: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return this.svc.startSession(trainingId, body, req.user.id, req.orgId);
  }

  @Get(':trainingId/sessions/:sessionId')
  getSession(
    @Param('trainingId') trainingId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.svc.getSession(trainingId, sessionId, req.orgId);
  }

  @Post(':trainingId/sessions/:sessionId/messages')
  sendMessage(
    @Param('trainingId') trainingId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return this.svc.sendMessage(trainingId, sessionId, body, req.orgId);
  }

  @Patch(':trainingId/sessions/:sessionId/pause')
  pause(
    @Param('trainingId') trainingId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.svc.pauseSession(trainingId, sessionId, req.orgId);
  }

  @Patch(':trainingId/sessions/:sessionId/resume')
  resume(
    @Param('trainingId') trainingId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.svc.resumeSession(trainingId, sessionId, req.orgId);
  }

  @Post(':trainingId/sessions/:sessionId/end')
  end(
    @Param('trainingId') trainingId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.svc.endSession(trainingId, sessionId, req.orgId);
  }

  @Get(':trainingId/sessions/:sessionId/results')
  results(
    @Param('trainingId') trainingId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.svc.getResults(trainingId, sessionId, req.orgId);
  }
}
