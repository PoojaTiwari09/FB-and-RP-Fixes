import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface UpsertNextStepsData {
  nextSteps: string[];
}

/**
 * NextStepsRepository — manages the nextSteps array on a Transcript.
 *
 * US-11: Next Steps can be AI-generated (via patchAiFields) or manually
 * added/edited/deleted by the user through these methods.
 *
 * The `nextSteps` field is a `String[]` on the Transcript model — each element
 * is one action item. Manual CRUD appends to / removes from this array.
 *
 * Coding Standards:
 *   - Golden Rule #9: every query filters by tenantId.
 *   - No raw SQL — Prisma ORM only.
 */
@Injectable()
export class NextStepsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Get current next steps for a call ─────────────────────────────────
  async findByCallId(callId: string, tenantId: string): Promise<string[]> {
    const transcript = await this.prisma.transcript.findFirst({
      where:  { callId, tenantid: tenantId },
      select: { nextSteps: true },
    });
    return transcript?.nextSteps ?? [];
  }

  // ── Add a single next step (appends to array) ─────────────────────────
  async addNextStep(
    callId:   string,
    tenantId: string,
    step:     string,
  ): Promise<string[]> {
    const current = await this.findByCallId(callId, tenantId);

    const updated = await this.prisma.transcript.updateMany({
      where: { callId, tenantid: tenantId },
      data:  { nextSteps: [...current, step] },
    });

    if (updated.count === 0) {
      throw new NotFoundException(
        `Transcript for call ${callId} not found or access denied`,
      );
    }

    return [...current, step];
  }

  // ── Update a specific next step by index ──────────────────────────────
  async updateNextStep(
    callId:   string,
    tenantId: string,
    index:    number,
    step:     string,
  ): Promise<string[]> {
    const current = await this.findByCallId(callId, tenantId);

    if (index < 0 || index >= current.length) {
      throw new NotFoundException(
        `Next step at index ${index} not found for call ${callId}`,
      );
    }

    const updated = [...current];
    updated[index] = step;

    await this.prisma.transcript.updateMany({
      where: { callId, tenantid: tenantId },
      data:  { nextSteps: updated },
    });

    return updated;
  }

  // ── Delete a specific next step by index ──────────────────────────────
  async deleteNextStep(
    callId:   string,
    tenantId: string,
    index:    number,
  ): Promise<string[]> {
    const current = await this.findByCallId(callId, tenantId);

    if (index < 0 || index >= current.length) {
      throw new NotFoundException(
        `Next step at index ${index} not found for call ${callId}`,
      );
    }

    const updated = current.filter((_, i) => i !== index);

    await this.prisma.transcript.updateMany({
      where: { callId, tenantid: tenantId },
      data:  { nextSteps: updated },
    });

    return updated;
  }

  // ── Replace entire next steps array (used by AI pipeline) ─────────────
  async replaceAll(
    callId:    string,
    tenantId:  string,
    nextSteps: string[],
  ): Promise<string[]> {
    await this.prisma.transcript.updateMany({
      where: { callId, tenantid: tenantId },
      data:  { nextSteps },
    });
    return nextSteps;
  }
}
