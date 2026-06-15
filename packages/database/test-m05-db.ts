import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Testing Accounts Data (Teams & Reps)...');
    const teams = await prisma.team.findMany({ take: 2 });
    const reps = await prisma.user.findMany({ take: 2 });
    console.log('Teams:', teams.map(t => t.name));
    console.log('Reps:', reps.map(r => r.name));

    console.log('\nTesting Coaching Data...');
    const recs = await prisma.coachingrecommendations.findMany({ take: 2 });
    const snaps = await prisma.coachingsnapshots.findMany({ take: 2 });
    console.log('Recommendations found:', recs.length);
    console.log('Snapshots found:', snaps.length);
    
    if (recs.length > 0) {
      console.log('Sample recommendation:', recs[0].recommendationtext);
    }
  } catch (error) {
    console.error('Error during database check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
