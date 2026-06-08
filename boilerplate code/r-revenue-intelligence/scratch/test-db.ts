import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaService } from 'C:/Users/Relanto/OneDrive - Relanto/Desktop/112/r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence/modules/m07-revenue-dashboards/database/prisma.service';

const prisma = new PrismaService() as any;

async function main() {
  console.log('--- Calls and Detections ---');
  try {
    const calls = await prisma.callRecord.findMany({
      include: {
        transcript: true
      }
    });
    console.log(`Found ${calls.length} calls:`);
    calls.forEach((c) => {
      console.log(`- Call ID: ${c.id}, Title: ${c.title}, AccountId: ${c.accountId}, OppId: ${c.opportunityId}, Date: ${c.callDate}, Participants: ${JSON.stringify(c.participants)}`);
    });

    const detections = await prisma.m02TrackerDetection.findMany({
      include: {
        tracker: true
      }
    });
    console.log(`Found ${detections.length} detections:`);
    detections.forEach((d) => {
      console.log(`- Detection ID: ${d.id}, Call ID: ${d.entityId}, Tracker Name: ${d.tracker?.name}, Keyword: ${d.matchedKeyword}, Snippet: "${d.snippet}"`);
    });
  } catch (error) {
    console.error('Inspection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
