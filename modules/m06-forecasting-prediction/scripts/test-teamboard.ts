import { PrismaClient } from '@prisma/client';
import { M06ForecastingPredictionService } from '../services/m06.service';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

const prisma = new PrismaClient();
// Mock EventPublisherService to avoid connecting to Redis
const mockEventPublisher = {
  publish: async () => {},
  dispatch: async () => {}
} as unknown as EventPublisherService;

async function main() {
  const service = new M06ForecastingPredictionService(prisma as any, mockEventPublisher, undefined);
  
  try {
    const data = await service.getTeamBoard(
      '00000000-0000-0000-0000-000000000001', 
      undefined, 
      undefined, 
      '00000000-0000-0000-0000-0000000000b2'
    );
    console.log("SUCCESS");
  } catch (e: any) {
    console.error("TEAM BOARD FAILED:", e);
  }
}

main().finally(() => prisma.$disconnect());
