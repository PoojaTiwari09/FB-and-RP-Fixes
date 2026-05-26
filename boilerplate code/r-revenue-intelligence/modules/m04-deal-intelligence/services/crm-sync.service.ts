import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
@Injectable()
export class CrmSyncService {
  constructor(private readonly db: DatabaseService) {}
}
