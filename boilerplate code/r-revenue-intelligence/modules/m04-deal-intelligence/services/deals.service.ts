import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DealsService {
  constructor(private readonly db: DatabaseService) {}
}
