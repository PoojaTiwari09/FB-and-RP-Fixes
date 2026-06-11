import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface VocabularyRule {
  vocabId: string;
  incorrectTerm: string;
  correctTerm: string;
  language: string;
  isActive: boolean;
}

@Injectable()
export class VocabularyCorrectionService {
  private readonly logger = new Logger(VocabularyCorrectionService.name);
  private static mockRules: any[] = [];
  private static mockCorrections: any[] = [];

  constructor(private prisma: PrismaService) {}

  async createRule(
    tenantId: string, 
    incorrectTerm: string, 
    correctTerm: string, 
    language: string = 'en',
    category: string = 'Custom',
    mispronunciations: string[] = [],
    variations: string[] = []
  ) {
    const newRule = {
      id: Date.now().toString(), tenantid: tenantId,
      incorrectTerm,
      correctTerm,
      language,
      category,
      mispronunciations,
      variations,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    VocabularyCorrectionService.mockRules.push(newRule);

    try {
      const createdRule = await this.prisma.m02VocabularyCorrection.create({
        data: {
          tenantId,
          incorrectTerm,
          correctTerm,
          language,
          category,
          mispronunciations,
          variations,
          isActive: true,
        },
      });
      return createdRule;
    } catch (e: any) {
      this.logger.warn(`DB create failed, using in-memory mock: ${e.message}`);
      return newRule;
    }
  }

  async getRules(tenantId: string) {
    try {
      const dbRules = await this.prisma.m02VocabularyCorrection.findMany({
        where: { tenantid: tenantId },
        orderBy: { createdAt: 'desc' },
      });

      if (dbRules.length > 0) {
        return dbRules;
      }
    } catch (e: any) {
      this.logger.warn('DB get failed, using in-memory mock');
    }

    const mockRules = VocabularyCorrectionService.mockRules.filter((r: any) => r.tenantId === tenantId);
    return mockRules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteRule(id: string, tenantId: string) {
    try {
      return await this.prisma.m02VocabularyCorrection.delete({
        where: { id },
      });
    } catch (e: any) {
      this.logger.warn('DB delete failed, using in-memory mock');
      VocabularyCorrectionService.mockRules = VocabularyCorrectionService.mockRules.filter((r: any) => r.id !== id || r.tenantId !== tenantId);
      return { success: true };
    }
  }

  async getStats(tenantId: string) {
    try {
      const termsCount = await this.prisma.m02VocabularyCorrection.count({
        where: { tenantid: tenantId }
      });

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const correctionsThisMonth = await this.prisma.m02TranscriptCorrection.count({
        where: { tenantid: tenantId,
          appliedAt: { gte: firstDayOfMonth }
        }
      });

      const totalCalls = await this.prisma.m01Call.count({ where: { tenantid: tenantId } });
      const totalEnhanced = await this.prisma.m01Call.count({
        where: { tenantid: tenantId, correctionVersion: { gt: 0 } }
      });

      const enhancedPercent = totalCalls > 0 ? Math.round((totalEnhanced / totalCalls) * 100) : 0;

      return {
        termsCount,
        correctionsThisMonth,
        enhancedPercent
      };
    } catch (e: any) {
      this.logger.warn('DB stats failed, using in-memory mock');
      return {
        termsCount: VocabularyCorrectionService.mockRules.filter((r: any) => r.tenantId === tenantId).length,
        correctionsThisMonth: VocabularyCorrectionService.mockCorrections.length,
        enhancedPercent: VocabularyCorrectionService.mockCorrections.length > 0 ? 100 : 0
      };
    }
  }

  /**
   * TDD Appendix 16: Mis-transcription Mapping Rules
   */
  applyVocabularyCorrections(rawText: string, rules: VocabularyRule[]): { correctedText: string; appliedRules: { originalTerm: string, correctedTerm: string }[] } {
    if (!rawText) return { correctedText: rawText, appliedRules: [] };
    
    let correctedText = rawText;
    const appliedRules: { originalTerm: string, correctedTerm: string }[] = [];

    // Sort rules: longer incorrectTerm first to avoid partial replacement conflicts
    const sortedRules = [...rules]
      .filter((r) => r.isActive)
      .sort((a, b) => b.incorrectTerm.length - a.incorrectTerm.length);

    for (const rule of sortedRules) {
      const regex = new RegExp(`\\b${rule.incorrectTerm}\\b`, 'gi');
      const matches = correctedText.match(regex);
      if (matches) {
        matches.forEach(() => {
          appliedRules.push({
            originalTerm: rule.incorrectTerm,
            correctedTerm: rule.correctTerm
          });
        });
        correctedText = correctedText.replace(regex, rule.correctTerm);
      }
    }

    return { correctedText, appliedRules };
  }

  async correctTranscript(transcriptId: string, type: 'call' | 'email', tenantId: string) {
    this.logger.log(`Starting vocabulary correction for ${type} ${transcriptId}`);
    
    // 1. Fetch raw transcript
    let rawText = '';
    let currentVersion = 0;

    if (type === 'call') {
      const call = await this.prisma.m01Call.findUnique({ where: { id: transcriptId, tenantid: tenantId } });
      if (!call) throw new Error('Call not found');
      rawText = call.transcript || '';
      currentVersion = call.correctionVersion;
    } else {
      const email = await this.prisma.m02Email.findUnique({ where: { id: transcriptId, tenantid: tenantId } });
      if (!email) throw new Error('Email not found');
      rawText = email.body || '';
      currentVersion = email.correctionVersion;
    }

    if (!rawText) {
      this.logger.warn(`No raw text found for ${type} ${transcriptId}`);
      return;
    }

    // 2. Fetch rules
    const rawRules = await this.getRules(tenantId);
    const rules: VocabularyRule[] = rawRules.map((r: any) => ({
      vocabId: r.id,
      incorrectTerm: r.incorrectTerm,
      correctTerm: r.correctTerm,
      language: r.language,
      isActive: r.isActive
    }));

    // 3. Apply corrections
    const { correctedText, appliedRules } = this.applyVocabularyCorrections(rawText, rules);

    // 4. Save results
    if (appliedRules.length > 0) {
      this.logger.log(`Applied ${appliedRules.length} corrections to ${transcriptId}. Saving version ${currentVersion + 1}`);
      
      // Log corrections
      for (const applied of appliedRules) {
        await this.prisma.m02TranscriptCorrection.create({
          data: {
            tenantId,
            transcriptId,
            originalTerm: applied.originalTerm,
            correctedTerm: applied.correctedTerm,
          }
        });
      }

      // Update transcript
      if (type === 'call') {
        await this.prisma.m01Call.update({
          where: { id: transcriptId },
          data: {
            correctedTranscript: correctedText,
            correctionVersion: currentVersion + 1
          }
        });
      } else {
        await this.prisma.m02Email.update({
          where: { id: transcriptId },
          data: {
            correctedTranscript: correctedText,
            correctionVersion: currentVersion + 1
          }
        });
      }
    } else {
      this.logger.log(`No vocabulary corrections needed for ${transcriptId}`);
      // Still set correctedText to original if version is 0 to ensure downstream has a value
      if (currentVersion === 0) {
        if (type === 'call') {
          await this.prisma.m01Call.update({
            where: { id: transcriptId },
            data: { correctedTranscript: rawText }
          });
        } else {
          await this.prisma.m02Email.update({
            where: { id: transcriptId },
            data: { correctedTranscript: rawText }
          });
        }
      }
    }

    return correctedText || rawText;
  }
}
