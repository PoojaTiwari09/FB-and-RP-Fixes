import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TasksService {
  constructor(private readonly db: DatabaseService) {}
}
