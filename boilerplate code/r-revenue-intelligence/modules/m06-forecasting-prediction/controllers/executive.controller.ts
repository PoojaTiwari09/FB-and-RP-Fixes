import { Controller, Get, Headers, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { M06ForecastingPredictionService } from '../services/m06.service';

const TenantHeader = 'X-Tenant-ID';

@Controller('api/v1/forecasting')
export class M06ExecutiveController {
  constructor(private readonly service: M06ForecastingPredictionService) {}

  @Get('executive/dashboard')
  async getExecutiveDashboard(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('region') region?: string,
    @Query('baseline') baseline?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');

    const validBaselines = ['avg_last_2', 'last_period', 'same_period_last_year', 'current'];
    if (baseline && baseline !== 'current' && !validBaselines.includes(baseline)) {
      throw new BadRequestException(`Invalid baseline. Must be one of: ${validBaselines.join(', ')}`);
    }

    const validRegions = ['Americas', 'EMEA', 'APAC', 'Company'];
    if (region && !validRegions.includes(region)) {
      throw new BadRequestException(`Invalid region. Must be one of: ${validRegions.join(', ')}`);
    }

    // Map baseline 'current' or undefined to undefined for service logic
    const mappedBaseline = baseline === 'current' ? undefined : baseline;

    return this.service.getExecutiveDashboard(tenantId, mappedBaseline, region);
  }
}
