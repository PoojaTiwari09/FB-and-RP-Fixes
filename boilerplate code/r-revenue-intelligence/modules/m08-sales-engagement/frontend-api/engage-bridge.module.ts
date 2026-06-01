import { Module } from '@nestjs/common';
import { M08FrontendEngageController } from './m08-frontend-engage.controller';
import { M08FrontendEngageService } from './m08-frontend-engage.service';
import { M08FrontendEngageManagerController } from './manager/m08-frontend-engage-manager.controller';
import { M08FrontendEngageManagerService } from './manager/m08-frontend-engage-manager.service';

/** Lightweight Engage UI API — rep `/api/engage/*` + manager `/api/tasks/*` (no Prisma/Redis). */
@Module({
  controllers: [M08FrontendEngageController, M08FrontendEngageManagerController],
  providers: [M08FrontendEngageService, M08FrontendEngageManagerService],
})
export class EngageBridgeModule {}
