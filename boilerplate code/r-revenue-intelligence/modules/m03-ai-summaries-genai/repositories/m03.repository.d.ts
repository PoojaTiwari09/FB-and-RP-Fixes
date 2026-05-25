import { PrismaService } from '../database/prisma.service';
export declare class M03AiSummariesGenaiRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(data: any): Promise<any>;
}
