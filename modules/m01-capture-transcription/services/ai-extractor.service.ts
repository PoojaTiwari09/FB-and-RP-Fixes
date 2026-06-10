import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { TranscriptRepository } from '../repositories/transcript.repository';

import { extractCustomField } from './custom-field-extraction';



@Injectable()

export class AiExtractorService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly transcripts: TranscriptRepository,

  ) {}



  private fieldDelegate() {

    return (this.prisma as any).aiExtractionField;

  }



  private resultDelegate() {

    return (this.prisma as any).aiExtractionResult;

  }



  async listFields(tenantId: string) {

    const d = this.fieldDelegate();

    if (!d?.findMany) return [];

    return d.findMany({

      where: { tenantId },

      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],

    });

  }



  async createField(tenantId: string, body: Record<string, unknown>) {

    const d = this.fieldDelegate();

    if (!d?.create) throw new NotFoundException('AiExtractionField model unavailable');

    return d.create({

      data: {

        tenantId,

        question: String(body.question ?? ''),

        fieldLabel: String(body.fieldLabel ?? ''),

        fieldName: String(body.fieldName ?? 'field'),

        dataType: String(body.dataType ?? 'text'),

        enumOptions: Array.isArray(body.enumOptions) ? body.enumOptions : [],

        extractionHint: body.extractionHint ? String(body.extractionHint) : null,

        crmObject: body.crmObject ? String(body.crmObject) : null,

        crmField: body.crmField ? String(body.crmField) : null,

        isActive: false,

      },

    });

  }



  async updateField(tenantId: string, id: string, body: Record<string, unknown>) {

    await this.getField(tenantId, id);

    const d = this.fieldDelegate();

    return d.update({

      where: { id },

      data: {

        ...(body.question !== undefined && { question: String(body.question) }),

        ...(body.fieldLabel !== undefined && { fieldLabel: String(body.fieldLabel) }),

        ...(body.fieldName !== undefined && { fieldName: String(body.fieldName) }),

        ...(body.dataType !== undefined && { dataType: String(body.dataType) }),

        ...(body.enumOptions !== undefined && {

          enumOptions: Array.isArray(body.enumOptions) ? body.enumOptions : [],

        }),

        ...(body.extractionHint !== undefined && {

          extractionHint: body.extractionHint ? String(body.extractionHint) : null,

        }),

        ...(body.crmObject !== undefined && {

          crmObject: body.crmObject ? String(body.crmObject) : null,

        }),

        ...(body.crmField !== undefined && {

          crmField: body.crmField ? String(body.crmField) : null,

        }),

      },

    });

  }



  async deleteField(tenantId: string, id: string) {

    await this.getField(tenantId, id);

    const d = this.fieldDelegate();

    await d.delete({ where: { id } });

    return { success: true };

  }



  async toggleField(tenantId: string, id: string, isActive: boolean) {

    await this.getField(tenantId, id);

    const d = this.fieldDelegate();

    return d.update({ where: { id }, data: { isActive: !!isActive } });

  }



  async getField(tenantId: string, id: string) {

    const d = this.fieldDelegate();

    const row = await d.findFirst({ where: { id, tenantId } });

    if (!row) throw new NotFoundException(`Field ${id} not found`);

    return row;

  }



  async getCallResults(tenantId: string, callId: string) {

    const d = this.resultDelegate();

    if (!d?.findMany) return [];

    return d.findMany({

      where: { tenantId, callId },

      include: { field: true },

    });

  }



  /** Run extraction for all active fields on a call and persist results. */

  async runExtraction(tenantId: string, callId: string) {

    const { fullText, utterances } = await this.loadTranscript(callId, tenantId);



    const d = this.fieldDelegate();

    const fields = await d.findMany({

      where: { tenantId, isActive: true },

      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],

    });



    for (const field of fields) {

      await this.extractAndSave(tenantId, callId, field, fullText, utterances);

    }



    return this.getCallResults(tenantId, callId);

  }



  async testField(tenantId: string, fieldId: string, callId: string) {

    const field = await this.getField(tenantId, fieldId);

    const { fullText, utterances } = await this.loadTranscript(callId, tenantId);

    const saved = await this.extractAndSave(tenantId, callId, field, fullText, utterances);



    return {

      fieldId,

      fieldName: field.fieldName,

      extractedValue: saved.extractedValue,

      rawEvidence: saved.rawEvidence,

      evidenceTimestampMs: saved.evidenceTimestampMs,

      confidenceScore: saved.confidenceScore,

    };

  }



  private async loadTranscript(callId: string, tenantId: string) {

    const transcript = await this.transcripts.findByCallId(callId, tenantId);

    if (!transcript) {

      throw new BadRequestException(

        `Call ${callId} has no transcript yet — wait for transcription to complete`,

      );

    }



    const utterances = (transcript.utterances ?? []).map((u: any) => ({

      text: u.text,

      startMs: u.startMs,

      speaker: u.speaker,

    }));



    return { fullText: transcript.fullText ?? '', utterances };

  }



  private async extractAndSave(

    tenantId: string,

    callId: string,

    field: any,

    fullText: string,

    utterances: { text: string; startMs: number; speaker: string }[],

  ) {

    const out = extractCustomField(

      {

        question: field.question,

        fieldLabel: field.fieldLabel,

        fieldName: field.fieldName,

        dataType: field.dataType,

        extractionHint: field.extractionHint,

        enumOptions: field.enumOptions,

      },

      fullText,

      utterances,

    );



    const d = this.resultDelegate();

    if (!d?.upsert) {

      throw new NotFoundException('AiExtractionResult model unavailable');

    }



    return d.upsert({

      where: {

        fieldId_callId: { fieldId: field.id, callId },

      },

      create: {

        tenantId,

        fieldId: field.id,

        callId,

        extractedValue: out.extractedValue,

        rawEvidence: out.rawEvidence,

        evidenceTimestampMs: out.evidenceTimestampMs,

        confidenceScore: out.confidenceScore,

        isManualOverride: false,

      },

      update: {

        extractedValue: out.extractedValue,

        rawEvidence: out.rawEvidence,

        evidenceTimestampMs: out.evidenceTimestampMs,

        confidenceScore: out.confidenceScore,

        extractedAt: new Date(),

        isManualOverride: false,

      },

      include: { field: true },

    });

  }

}


