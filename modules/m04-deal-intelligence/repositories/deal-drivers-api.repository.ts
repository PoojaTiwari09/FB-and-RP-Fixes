import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { CreateDealDriverDto, UpdateDealDriverDto } from '../interfaces/deal-driver.types';

@Injectable()
export class DealDriversApiRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filters: { dealId?: string; boardId?: string; tenantId?: string }) {
    return this.prisma.m04DealDriver.findMany({
      where: {
        tenantId: filters.tenantId ?? 'default',
        ...(filters.dealId ? { dealId: filters.dealId } : {}),
        ...(filters.boardId ? { boardId: filters.boardId } : {}),
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.m04DealDriver.findUnique({ where: { id } });
  }

  create(tenantId: string, dto: CreateDealDriverDto) {
    return this.prisma.m04DealDriver.create({
      data: {
        tenantId,
        dealId: dto.dealId,
        boardId: dto.boardId ?? null,
        name: dto.name,
        type: dto.type ?? 'action',
        status: dto.status ?? 'active',
        priority: dto.priority ?? 'medium',
        owner: dto.owner ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        description: dto.description ?? null,
        warningType: dto.warningType ?? null,
      },
    });
  }

  update(id: string, dto: UpdateDealDriverDto) {
    return this.prisma.m04DealDriver.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.owner !== undefined ? { owner: dto.owner } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.warningType !== undefined ? { warningType: dto.warningType } : {}),
        ...(dto.boardId !== undefined ? { boardId: dto.boardId } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
      },
    });
  }

  delete(id: string) {
    return this.prisma.m04DealDriver.delete({ where: { id } });
  }
}
