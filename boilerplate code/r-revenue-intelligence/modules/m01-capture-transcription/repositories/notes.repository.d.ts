import { PrismaService } from '../database/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from '../schemas/m01.schema';
export declare class NotesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(callId: string, tenantId: string, authorId: string, dto: CreateNoteDto): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    update(noteId: string, tenantId: string, dto: UpdateNoteDto): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    delete(noteId: string, tenantId: string): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    findByCallId(callId: string, tenantId: string): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }[]>;
}
