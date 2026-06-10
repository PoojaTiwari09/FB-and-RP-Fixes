import type {
  DealDriverRecord,
  DriverPriority,
  DriverStatus,
  DriverType,
  WarningTypeKey,
} from '../interfaces/deal-driver.types';

export class DealDriverEntity implements DealDriverRecord {
  id: string;
  tenantId: string;
  dealId: string;
  boardId: string | null;
  name: string;
  type: DriverType;
  status: DriverStatus;
  priority: DriverPriority;
  owner: string | null;
  dueDate: string | null;
  description: string | null;
  warningType: WarningTypeKey | null;
  createdAt: string;
  updatedAt: string;
  dealName?: string;
  boardName?: string;

  constructor(data: DealDriverRecord) {
    Object.assign(this, data);
  }

  static fromPrisma(row: {
    id: string;
    tenantid: string;
    dealId: string;
    boardId: string | null;
    name: string;
    type: string;
    status: string;
    priority: string;
    owner: string | null;
    dueDate: Date | null;
    description: string | null;
    warningType: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DealDriverEntity {
    return new DealDriverEntity({
      id: row.id,
      tenantId: row.tenantid,
      dealId: row.dealId,
      boardId: row.boardId,
      name: row.name,
      type: row.type as DriverType,
      status: row.status as DriverStatus,
      priority: row.priority as DriverPriority,
      owner: row.owner,
      dueDate: row.dueDate?.toISOString() ?? null,
      description: row.description,
      warningType: row.warningType as WarningTypeKey | null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }
}
