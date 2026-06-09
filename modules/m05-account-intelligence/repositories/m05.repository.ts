import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class M05AccountIntelligenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, userId?: string, userRole?: string) {
    const where: any = { tenantId };
    
    // Data Isolation: Sales Reps can only see their own accounts
    if (userRole === 'sales_rep' && userId) {
      where.ownerUserId = userId;
    }

    return this.prisma.account.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 100,
    });
  }

  async create(data: { tenantId: string; name: string; assignedRepId?: string }) {
    return this.prisma.account.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        assignedRepId: data.assignedRepId,
      },
    });
  }
}
