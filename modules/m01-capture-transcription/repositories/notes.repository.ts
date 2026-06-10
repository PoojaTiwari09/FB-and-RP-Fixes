import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from '../schemas/m01.schema';

@Injectable()
export class NotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── CT-22: Create note ────────────────────────────────────────────────
  async create(callId: string, tenantId: string, authorId: string, dto: CreateNoteDto) {
    return this.prisma.callNote.create({
      data: { callId, tenantid: tenantId, authorId, content: dto.content },
    });
  }

  // ── CT-22: Update note ────────────────────────────────────────────────
  async update(noteId: string, tenantId: string, dto: UpdateNoteDto) {
    return this.prisma.callNote.update({
      where: { id: noteId },
      data:  { content: dto.content },
    });
  }

  // ── CT-22: Delete note ────────────────────────────────────────────────
  async delete(noteId: string, tenantId: string) {
    return this.prisma.callNote.delete({ where: { id: noteId } });
  }

  // ── List notes for a call ─────────────────────────────────────────────
  async findByCallId(callId: string, tenantId: string, authorId?: string) {
    const where: any = { callId, tenantid: tenantId };
    if (authorId) {
      where.authorId = authorId;
    }
    return this.prisma.callNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
