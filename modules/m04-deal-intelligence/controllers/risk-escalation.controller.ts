import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { DealService } from '@/services/deal.service';
import { EscalateRiskDto, DeescalateRiskDto, RiskEscalationResponseDto } from '@/schemas/risk-escalation.dto';
import { AuthGuard } from '@/guards/auth.guard';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';

@ApiTags('Risk Escalation')
@Controller('deals/:dealId/risk')
@UseGuards(AuthGuard)
@ApiCookieAuth()
export class RiskEscalationController {
  constructor(private readonly dealService: DealService) {}

  @Post('escalate')
  @ApiOperation({
    summary: 'Escalate deal to high risk',
    description: 'Mark a deal as high risk with a reason',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Deal escalated to high risk successfully',
    type: RiskEscalationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async escalateRisk(
    @Param('dealId') dealId: string,
    @Body() dto: EscalateRiskDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskEscalationResponseDto> {
    await this.dealService.markAsHighRisk(dealId, dto.riskReason);
    
    const deal = await this.dealService.findById(dealId, req.user.id);

    return {
      id: deal.id,
      isHighRisk: deal.isHighRisk,
      riskReason: deal.riskReason,
      escalatedBy: req.user.id,
      escalatedAt: new Date(),
      message: 'Deal escalated to high risk successfully',
    };
  }

  @Post('deescalate')
  @ApiOperation({
    summary: 'De-escalate deal from high risk',
    description: 'Remove high risk status from a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Deal de-escalated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async deescalateRisk(
    @Param('dealId') dealId: string,
    @Body() dto: DeescalateRiskDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string; reason: string }> {
    await this.dealService.clearHighRisk(dealId);

    return {
      message: 'Deal de-escalated from high risk successfully',
      reason: dto.reason,
    };
  }
}
