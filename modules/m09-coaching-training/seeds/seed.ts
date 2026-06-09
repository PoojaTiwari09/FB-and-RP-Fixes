import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const orgId = 'org-demo';

  const password = await bcrypt.hash('password123', 10);

  // 1. Create Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      name: 'John Manager',
      role: 'manager',
      status: 'active',
      org_id: orgId,
      password,
    },
  });

  // 2. Create Reps
  const reps = [];
  for (let i = 1; i <= 3; i++) {
    const rep = await prisma.user.upsert({
      where: { email: `rep${i}@demo.com` },
      update: {},
      create: {
        email: `rep${i}@demo.com`,
        name: `Jane Rep ${i}`,
        role: 'rep',
        status: 'active',
        org_id: orgId,
        manager_id: manager.id,
        password,
      },
    });
    reps.push(rep);
  }

  // 3. Create Scenarios
  const scenario = await prisma.trainingScenario.upsert({
    where: { id: 'seed-scenario-1' },
    update: {},
    create: {
      id: 'seed-scenario-1',
      org_id: orgId,
      persona_name: 'Angry Client',
      persona_type: 'Executive',
      difficulty: 'advanced',
      context_text: 'Client is upset about recent downtime.',
    },
  });

  // 4. Create an Assignment
  await prisma.trainingAssignment.create({
    data: {
      rep_id: reps[0].id,
      manager_id: manager.id,
      scenario_id: scenario.id,
      status: 'Pending',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'High'
    }
  });

  // 5. Create Dummy Completed Sessions for Demo Data
  const mockMessages = [
    { role: 'user', content: 'Hi, I would like to talk about our new solution.' },
    { role: 'assistant', content: 'Sure, what do you have in mind?' },
    { role: 'user', content: 'It improves ROI by 20%.' },
    { role: 'assistant', content: 'That sounds great, lets do a pilot.' }
  ];

  const mockFeedback = {
    scores: { opening: 18, discovery: 15, objection_handling: 17, talk_ratio: 16, closing: 19 },
    overall_score: 85,
    evaluation_summary: 'Great job handling the objections and securing the next steps.',
    strengths: ['Strong opening', 'Good value proposition'],
    improvements: ['Ask more discovery questions'],
    objective_metrics: { talk_ratio_pct: 45, questions_asked: 2, closing_attempts: 1, total_exchanges: 2 }
  };

  const session1 = await prisma.trainingSession.create({
    data: {
      rep_id: reps[0].id,
      scenario_id: scenario.id,
      messages_json: mockMessages,
      feedback_json: mockFeedback,
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  const session2 = await prisma.trainingSession.create({
    data: {
      rep_id: reps[0].id,
      scenario_id: scenario.id,
      messages_json: mockMessages,
      feedback_json: { ...mockFeedback, overall_score: 72, scores: { ...mockFeedback.scores, closing: 12 } },
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  });

  // Update assignment to link to one session
  await prisma.trainingAssignment.create({
    data: {
      rep_id: reps[0].id,
      manager_id: manager.id,
      scenario_id: scenario.id,
      session_id: session1.id,
      status: 'Completed',
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      priority: 'Medium',
      attempt_count: 2,
      best_score: 85,
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      best_session_id: session1.id
    }
  });

  // 6. Create Dummy Recommendations for the Rep
  await prisma.coachingRecommendation.create({
    data: {
      rep_id: reps[0].id,
      focus_area: 'Discovery',
      weakest_skill: 'Open-ended questions',
      recommendation_text: 'You tend to ask yes/no questions early in the call.',
      suggested_action: 'Practice asking "How" and "What" questions to get the prospect talking.',
      priority: 'High',
      status: 'active',
      generated_at: new Date()
    }
  });

  await prisma.coachingRecommendation.create({
    data: {
      rep_id: reps[0].id,
      focus_area: 'Closing',
      weakest_skill: 'Next Steps',
      recommendation_text: 'Calls often end without a clear booked meeting.',
      suggested_action: 'Always propose a specific time for the next call before hanging up.',
      priority: 'Medium',
      status: 'active',
      generated_at: new Date()
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
