import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateThemeAnalysisDto {
  businessQuestion: string;
  filters: any;
}

@Injectable()
export class ThemeAnalysesService {
  constructor(private readonly prisma: PrismaService) {}

  async createAnalysis(tenantId: string, userId: string, dto: CreateThemeAnalysisDto) {
    if (!dto.businessQuestion) {
      throw new BadRequestException('Business question is required');
    }

    return {
      success: true,
      analysisId: 'mock-123',
      status: 'queued',
      message: 'Theme analysis job has been queued. (Fallback Mode)',
    };
  }

  async getAnalysis(tenantId: string, id: string) {
    return {
      analysisId: id,
      tenantId,
      businessQuestion: 'What are the main objections for pricing?',
      filters: {},
      status: 'completed',
      callCountAnalyzed: 150,
      createdAt: new Date(),
      themes: [
        {
          themeId: 't1',
          name: 'Pricing Pushback',
          summary: 'Customers are expressing concern over the recent price increase, asking for legacy discounts.',
          callCount: 45,
          accountCount: 30,
          associatedRevenue: 150000.00,
        },
        {
          themeId: 't2',
          name: 'Integration Requests',
          summary: 'Frequent requests for native integration with popular CRMs like Salesforce and HubSpot.',
          callCount: 28,
          accountCount: 25,
          associatedRevenue: 85000.00,
        },
      ],
    };
  }

  private async simulateProcessing(analysisId: string, tenantId: string) {
    // no-op
  }
}
