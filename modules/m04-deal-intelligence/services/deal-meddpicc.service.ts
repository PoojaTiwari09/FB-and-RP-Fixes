import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface MeddpiccAnalysisResult {
  score: number;
  matchedCategories: string[];
  contacts: number;
  aiNextStep: string;
  categoryAnswers: Record<string, string | null>;
}

@Injectable()
export class DealMeddpiccService {
  private readonly logger = new Logger(DealMeddpiccService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all CallRecord transcripts linked to a HubSpot deal ID.
   * Uses CallRecord.opportunityId as the external deal mapping.
   */
  async findTranscriptsForDeal(dealExternalId: string): Promise<string[]> {
    const records = await this.prisma.call.findMany({
      where: { dealId: dealExternalId },
    });

    const texts = records
      .map((r) => r.transcriptText)
      .filter((t): t is string => !!t && t.length > 0);

    this.logger.log(`Found ${texts.length} transcript(s) for deal ${dealExternalId}`);
    return texts;
  }

  /**
   * Find or compute MEDDPICC data for a deal.
   * If stored in DB, return it; otherwise return null (caller computes + stores).
   */
  async findStoredMeddpicc(dealExternalId: string) {
    // Queries stored MEDDPICC analysis from database
    return this.prisma.dealMeddpicc.findFirst({
      where: { dealExternalId },
    });
  }

  /**
   * Upsert MEDDPICC analysis result for a deal.
   */
  async upsertMeddpicc(
    dealExternalId: string,
    tenantId: string,
    result: MeddpiccAnalysisResult,
  ) {
    const existing = await this.prisma.dealMeddpicc.findFirst({
      where: { dealExternalId },
    });

    const payload = {
      tenantid: tenantId,
      dealExternalId,
      score: result.score,
      metrics: result.categoryAnswers.metrics || null,
      economicBuyer: result.categoryAnswers.economicBuyer || null,
      decisionCriteria: result.categoryAnswers.decisionCriteria || null,
      decisionProcess: result.categoryAnswers.decisionProcess || null,
      identifyPain: result.categoryAnswers.identifyPain || null,
      champion: result.categoryAnswers.champion || null,
      matchedCategories: result.matchedCategories,
      contactCount: result.contacts,
      aiNextStep: result.aiNextStep,
    };

    if (existing) {
      this.logger.log(`Updating DealMeddpicc for ${dealExternalId}`);
      return this.prisma.dealMeddpicc.update({
        where: { id: existing.id },
        data: payload,
      });
    }

    this.logger.log(`Creating DealMeddpicc for ${dealExternalId}`);
    return this.prisma.dealMeddpicc.create({ data: payload });
  }
}
