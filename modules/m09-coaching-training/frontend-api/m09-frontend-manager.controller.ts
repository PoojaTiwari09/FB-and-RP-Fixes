import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { M09FrontendAuthGuard } from './m09-frontend-auth.guard';
import { M09FrontendTrainingsService } from './m09-frontend-trainings.service';

/** Manager routes — `Figma_Coaching-AI-Trainer_Rep_and_Manager1 (2).txt` Part 2 */
@Controller('api/manager/trainings')
@UseGuards(M09FrontendAuthGuard)
export class M09FrontendManagerController {
  constructor(private readonly svc: M09FrontendTrainingsService) {}

  @Get()
  dashboard(@Req() req: any) {
    return this.svc.getManagerDashboard(req.orgId);
  }

  @Post('create')
  create(@Body() body: unknown, @Req() req: any) {
    return this.svc.createManagerTraining(body, req.orgId);
  }

  @Post(':trainingId/reassign')
  reassign(
    @Param('trainingId') trainingId: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return this.svc.reassignTraining(trainingId, body, req.orgId);
  }
}
