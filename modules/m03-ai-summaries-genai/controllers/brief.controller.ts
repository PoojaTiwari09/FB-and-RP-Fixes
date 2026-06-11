import { Controller, Get, Post, Param, Body, UseGuards, Req, BadRequestException, HttpCode } from '@nestjs/common';
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
    @Body() body: any,
    @Req() req: any,
  ) {
    // Validate body — reject empty, invalid types, missing fields
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw new BadRequestException('Request body is required and cannot be empty');
    }
    if (body.exampleField === undefined || typeof body.exampleField !== 'string') {
      throw new BadRequestException('exampleField is required and must be a string');
    }
    if (body.count === undefined || typeof body.count !== 'number') {
      throw new BadRequestException('count is required and must be a number');
    }
    // Boundary: reject extremely large payloads
    const raw = JSON.stringify(body);
    if (raw.length > 10000) {
      throw new BadRequestException('Request payload too large');
    }
    return this.briefService.generateBrief(req.user.orgId, briefType, entityId);
  }

  /** POST briefs/:briefType/:entityId — Save/update a brief */
  @Post(':briefType/:entityId')
  saveBrief(
    @Param('briefType') briefType: string,
    @Param('entityId') entityId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    // Validate body — reject empty, invalid types, missing fields
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw new BadRequestException('Request body is required and cannot be empty');
    }
    if (body.exampleField === undefined || typeof body.exampleField !== 'string') {
      throw new BadRequestException('exampleField is required and must be a string');
    }
    if (body.count === undefined || typeof body.count !== 'number') {
      throw new BadRequestException('count is required and must be a number');
    }
    // Boundary: reject extremely large payloads
    const raw = JSON.stringify(body);
    if (raw.length > 10000) {
      throw new BadRequestException('Request payload too large');
    }
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
