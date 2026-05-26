import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}
  async log(entry: { userId: string; action: string; resource: string; resourceId?: string; meta?: unknown }) {
    await this.db.query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, meta, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [entry.userId, entry.action, entry.resource, entry.resourceId ?? null, JSON.stringify(entry.meta ?? {})],
    );
  }
}
