import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { BriefService } from '../services/brief.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('api/v1/ai-summaries-genai/briefs')
@UseGuards(AuthGuard)
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Get(':briefType/:entityId')
  getBrief(
    @Param('briefType') briefType: string,
    @Param('entityId') entityId: string,
    @Req() req: any,
  ) {
    return this.briefService.getBrief(req.user.orgId, briefType, entityId);
  }

  @Post(':briefType/:entityId/generate')
  generateBrief(
    @Param('briefType') briefType: string,
    @Param('entityId') entityId: string,
    @Req() req: any,
  ) {
    return this.briefService.generateBrief(req.user.orgId, briefType, entityId);
  }
}

/** Legacy path used by Vite UI before cutover. */
@Controller('api/ai-summaries')
@UseGuards(AuthGuard)
export class BriefCompatController {
  constructor(private readonly briefService: BriefService) {}

  @Post(':typeBrief/:entityId')
  generateLegacy(
    @Param('typeBrief') typeBrief: string,
    @Param('entityId') entityId: string,
    @Req() req: any,
  ) {
    const briefType = typeBrief.replace(/-brief$/i, '');
    return this.briefService.generateBrief(req.user.orgId, briefType, entityId);
  }
}
